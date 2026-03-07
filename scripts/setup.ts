import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('🚀 Welcome to the South Asian Fashion Deployment Setup!\n');
  
  const envPath = path.join(process.cwd(), '.env');
  let envVars: Record<string, string> = {};

  // Parse existing .env if it exists
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
    console.log('✅ Found existing .env file. We will update missing or changed values.\n');
  } else {
    console.log('📝 Creating a new .env file.\n');
  }

  // 1. Admin Emails
  const defaultAdmin = envVars['ADMIN_EMAIL'] || 'admin@example.com';
  const adminEmail = await question(`Admin Emails (comma separated) [${defaultAdmin}]: `);
  envVars['ADMIN_EMAIL'] = adminEmail.trim() || defaultAdmin;

  // 2. Sender Email
  const defaultSender = envVars['SENDER_EMAIL'] || 'no-reply@southasianfashion.ca';
  const senderEmail = await question(`Sender Email [${defaultSender}]: `);
  envVars['SENDER_EMAIL'] = senderEmail.trim() || defaultSender;

  // 3. Site URL
  const defaultSiteUrl = envVars['NEXT_PUBLIC_SITE_URL'] || 'https://southasianfashion.ca';
  const siteUrl = await question(`Site URL [${defaultSiteUrl}]: `);
  envVars['NEXT_PUBLIC_SITE_URL'] = siteUrl.trim() || defaultSiteUrl;

  // 4. Images Delivery Host
  const defaultDelivery = envVars['CLOUDFLARE_IMAGES_DELIVERY_HOST'] || 'imagedelivery.net';
  const deliveryHost = await question(`Cloudflare Images Delivery Host [${defaultDelivery}]: `);
  envVars['CLOUDFLARE_IMAGES_DELIVERY_HOST'] = deliveryHost.trim() || defaultDelivery;

  // 5. R2 Public URL
  const defaultR2 = envVars['R2_PUBLIC_URL'] || 'https://media.southasianfashion.ca';
  const r2Url = await question(`R2 Public URL [${defaultR2}]: `);
  envVars['R2_PUBLIC_URL'] = r2Url.trim() || defaultR2;

  // Write back to .env
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('\n✅ Saved configuration to .env');

  // Generate Wrangler example if missing
  if (!fs.existsSync('wrangler.jsonc') && fs.existsSync('wrangler.example.jsonc')) {
    fs.copyFileSync('wrangler.example.jsonc', 'wrangler.jsonc');
    console.log('✅ Created local wrangler.jsonc from example.');
  }

  // Provision Database & Bucket via Alchemy
  console.log('\n⏳ Syncing Cloudflare infrastructure via Alchemy...');
  try {
    // Ensure the ENV vars are passed into the process
    execSync('bun run alchemy:deploy', { 
      stdio: 'inherit',
      env: { ...process.env, ...envVars }
    });
    console.log('✅ Infrastructure synced.');
  } catch (error) {
    console.error('❌ Failed to sync infrastructure. Please check your Cloudflare login.');
  }

  // JWT Secret
  const setupSecret = await question('\nDo you want to generate and upload a new JWT_SECRET to Cloudflare? (y/N): ');
  if (setupSecret.toLowerCase() === 'y') {
    const secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync('temp-secret.txt', secret, 'utf8');
    try {
      console.log('⏳ Uploading JWT_SECRET to Cloudflare...');
      execSync('npx wrangler secret put JWT_SECRET < temp-secret.txt', { 
        stdio: 'inherit',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash'
      });
      console.log('✅ JWT_SECRET uploaded successfully.');
    } catch (error) {
      console.error('❌ Failed to upload JWT_SECRET.');
    } finally {
      if (fs.existsSync('temp-secret.txt')) fs.unlinkSync('temp-secret.txt');
    }
  }

  // Migrations
  const runMigrations = await question('\nDo you want to run remote database migrations? (y/N): ');
  if (runMigrations.toLowerCase() === 'y') {
    try {
      execSync('bun run db:migrate:remote', { stdio: 'inherit' });
      console.log('✅ Migrations applied.');
    } catch (error) {
      console.error('❌ Migrations failed.');
    }
  }

  console.log('\n🎉 Setup Complete!');
  console.log('To deploy your application, run:');
  console.log('  bun run deploy:production\n');

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
