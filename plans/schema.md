# Database Schema (Cloudflare D1 + Drizzle ORM)

This schema maps the existing MongoDB documents to a relational SQLite structure suitable for Cloudflare D1.

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Categories
export const categories = sqliteTable('categories', {
	id: text('id').primaryKey(), // uuid from mongo
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').default(''),
	createdAt: text('created_at').notNull(), // ISO string
})

// Collections
export const collections = sqliteTable('collections', {
	id: text('id').primaryKey(), // uuid
	name: text('name').notNull(),
	description: text('description').default(''),
	imageUrl: text('image_url').default(''),
	slug: text('slug').notNull().unique(),
	createdAt: text('created_at').notNull(),
})

// Products
export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').default(''),
	price: real('price').notNull().default(0),
	currency: text('currency').notNull().default('CAD'),
	category: text('category').references(() => categories.name), // String match based on old logic, or change to cat_id
	imageUrl: text('image_url').default(''),
	isNew: integer('is_new', { mode: 'boolean' }).default(1),
	isFeatured: integer('is_featured', { mode: 'boolean' }).default(0),
	collectionId: text('collection_id').references(() => collections.id),
	createdAt: text('created_at').notNull(),
})

// Hero Banners
export const heroBanners = sqliteTable('hero_banners', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	subtitle: text('subtitle').default(''),
	imageUrl: text('image_url').default(''),
	ctaText: text('cta_text').default('Explore Collection'),
	ctaLink: text('cta_link').default('#new-arrivals'),
	isActive: integer('is_active', { mode: 'boolean' }).default(1),
	createdAt: text('created_at').notNull(),
})

// Settings (Single row config)
export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey(), // SQLite autoincrement
	whatsappNumber: text('whatsapp_number').default(''),
	whatsappMessage: text('whatsapp_message').default(''),
	brandName: text('brand_name').default('SouthAsianFashion'),
	brandTagline: text('brand_tagline').default(''),
	contactEmail: text('contact_email').default(''),
	instagramUrl: text('instagram_url').default(''),
	facebookUrl: text('facebook_url').default(''),
})

// OTP Codes
export const otpCodes = sqliteTable('otp_codes', {
	id: integer('id').primaryKey(),
	email: text('email').notNull(),
	otp: text('otp').notNull(),
	createdAt: text('created_at').notNull(),
	expiresAt: text('expires_at').notNull(),
})
```
