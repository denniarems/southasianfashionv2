import { pgTable, text, real, boolean, serial } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
	id: text('id').primaryKey(), // uuid from mongo
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	description: text('description').default(''),
	createdAt: text('created_at').notNull(), // ISO string
})

export const collections = pgTable('collections', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').default(''),
	imageUrl: text('image_url').default(''),
	slug: text('slug').notNull().unique(),
	createdAt: text('created_at').notNull(),
})

export const products = pgTable('products', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').default(''),
	price: real('price').notNull().default(0),
	currency: text('currency').notNull().default('CAD'),
	category: text('category'),
	imageUrl: text('image_url').default(''),
	isNew: boolean('is_new').default(true),
	isFeatured: boolean('is_featured').default(false),
	collectionId: text('collection_id').references(() => collections.id),
	createdAt: text('created_at').notNull(),
})

export const productImages = pgTable('product_images', {
	id: text('id').primaryKey(),
	productId: text('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	imageUrl: text('image_url').notNull(),
	sortOrder: real('sort_order').notNull().default(0),
	createdAt: text('created_at').notNull(),
})

export const heroBanners = pgTable('hero_banners', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	subtitle: text('subtitle').default(''),
	imageUrl: text('image_url').default(''),
	ctaText: text('cta_text').default('Explore Collection'),
	ctaLink: text('cta_link').default('#new-arrivals'),
	isActive: boolean('is_active').default(true),
	createdAt: text('created_at').notNull(),
})

export const settings = pgTable('settings', {
	id: serial('id').primaryKey(),
	whatsappNumber: text('whatsapp_number').default(''),
	whatsappMessage: text('whatsapp_message').default(''),
	brandName: text('brand_name').default('SouthAsianFashion'),
	brandTagline: text('brand_tagline').default(''),
	contactEmail: text('contact_email').default(''),
	instagramUrl: text('instagram_url').default(''),
	facebookUrl: text('facebook_url').default(''),
})

export const otpCodes = pgTable('otp_codes', {
	id: serial('id').primaryKey(),
	email: text('email').notNull(),
	otp: text('otp').notNull(),
	createdAt: text('created_at').notNull(),
	expiresAt: text('expires_at').notNull(),
})
