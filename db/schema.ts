import { sql } from 'drizzle-orm'
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

export const discountTypeEnum = pgEnum('discount_type', ['flat', 'percentage', 'tiered', 'bundle'])

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

export const sizeGuides = pgTable('size_guides', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	productType: text('product_type').default(''),
	unit: text('unit').notNull().default('in'),
	note: text('note').default(''),
	columnsJson: text('columns_json').notNull().default('[]'),
	rowsJson: text('rows_json').notNull().default('[]'),
	isActive: boolean('is_active').notNull().default(true),
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
	sizeGuideId: text('size_guide_id').references(() => sizeGuides.id, { onDelete: 'set null' }),
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

export const discounts = pgTable(
	'discounts',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description').default(''),
		discountType: discountTypeEnum('discount_type').notNull(),
		discountValue: real('discount_value').notNull().default(0),
		originalPrice: real('original_price'),
		startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
		endDate: timestamp('end_date', { withTimezone: true }),
		minCartValue: real('min_cart_value').notNull().default(0),
		applicableCategories: text('applicable_categories')
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		stackable: boolean('stackable').notNull().default(false),
		maxUses: integer('max_uses'),
		priority: integer('priority').notNull().default(0),
		isActive: boolean('is_active').notNull().default(true),
		productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
		bundleProductIds: text('bundle_product_ids')
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		tierRulesJson: text('tier_rules_json').notNull().default('[]'),
		usageCount: integer('usage_count').notNull().default(0),
		wording: text('wording').notNull().default('Instant Price Drop'),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull(),
	},
	(table) => ({
		discountsProductIdIdx: index('discounts_product_id_idx').on(table.productId),
		discountsActiveIdx: index('discounts_active_idx').on(table.isActive),
		discountsPriorityIdx: index('discounts_priority_idx').on(table.priority),
		discountsTypeIdx: index('discounts_type_idx').on(table.discountType),
	}),
)

export const discountUsages = pgTable(
	'discount_usages',
	{
		id: serial('id').primaryKey(),
		discountId: text('discount_id')
			.notNull()
			.references(() => discounts.id, { onDelete: 'cascade' }),
		userKey: text('user_key').notNull(),
		useCount: integer('use_count').notNull().default(0),
		lastUsedAt: text('last_used_at').notNull(),
	},
	(table) => ({
		discountUserUnique: uniqueIndex('discount_usages_discount_user_key_unique').on(
			table.discountId,
			table.userKey,
		),
		discountUsageDiscountIdx: index('discount_usages_discount_idx').on(table.discountId),
		discountUsageUserIdx: index('discount_usages_user_idx').on(table.userKey),
	}),
)
