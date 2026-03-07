import { sql } from 'drizzle-orm'
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const discountTypes = ['flat', 'percentage', 'tiered', 'bundle'] as const

export type DiscountType = (typeof discountTypes)[number]

export const categories = sqliteTable('categories', {
	id: text('id').primaryKey(), // uuid from mongo
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique(),
	description: text('description').default(''),
	createdAt: text('created_at').notNull(), // ISO string
})

export const collections = sqliteTable('collections', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').default(''),
	imageUrl: text('image_url').default(''),
	slug: text('slug').notNull().unique(),
	createdAt: text('created_at').notNull(),
})

export const sizeGuides = sqliteTable('size_guides', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	productType: text('product_type').default(''),
	unit: text('unit').notNull().default('in'),
	note: text('note').default(''),
	columnsJson: text('columns_json').notNull().default('[]'),
	rowsJson: text('rows_json').notNull().default('[]'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: text('created_at').notNull(),
})

export const products = sqliteTable('products', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description').default(''),
	price: real('price').notNull().default(0),
	currency: text('currency').notNull().default('CAD'),
	category: text('category'),
	imageUrl: text('image_url').default(''),
	isNew: integer('is_new', { mode: 'boolean' }).default(true),
	isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
	collectionId: text('collection_id').references(() => collections.id),
	sizeGuideId: text('size_guide_id').references(() => sizeGuides.id, { onDelete: 'set null' }),
	createdAt: text('created_at').notNull(),
})

export const productImages = sqliteTable('product_images', {
	id: text('id').primaryKey(),
	productId: text('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	imageUrl: text('image_url').notNull(),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: text('created_at').notNull(),
})

export const heroBanners = sqliteTable('hero_banners', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	subtitle: text('subtitle').default(''),
	imageUrl: text('image_url').default(''),
	ctaText: text('cta_text').default('Explore Collection'),
	ctaLink: text('cta_link').default('#new-arrivals'),
	isActive: integer('is_active', { mode: 'boolean' }).default(true),
	createdAt: text('created_at').notNull(),
})

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	whatsappNumber: text('whatsapp_number').default(''),
	whatsappMessage: text('whatsapp_message').default(''),
	brandName: text('brand_name').default('SouthAsianFashion'),
	brandTagline: text('brand_tagline').default(''),
	contactEmail: text('contact_email').default(''),
	instagramUrl: text('instagram_url').default(''),
	facebookUrl: text('facebook_url').default(''),
})

export const otpCodes = sqliteTable('otp_codes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull(),
	otp: text('otp').notNull(),
	createdAt: text('created_at').notNull(),
	expiresAt: text('expires_at').notNull(),
})

export const discounts = sqliteTable(
	'discounts',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description').default(''),
		discountType: text('discount_type', { enum: discountTypes }).$type<DiscountType>().notNull(),
		discountValue: real('discount_value').notNull().default(0),
		originalPrice: real('original_price'),
		startDate: text('start_date').notNull(),
		endDate: text('end_date'),
		minCartValue: real('min_cart_value').notNull().default(0),
		applicableProductIds: text('applicable_product_ids', { mode: 'json' })
			.$type<string[]>()
			.notNull()
			.default(sql`(json_array())`),
		applicableCategories: text('applicable_categories', { mode: 'json' })
			.$type<string[]>()
			.notNull()
			.default(sql`(json_array())`),
		stackable: integer('stackable', { mode: 'boolean' }).notNull().default(false),
		maxUses: integer('max_uses'),
		priority: integer('priority').notNull().default(0),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
		bundleProductIds: text('bundle_product_ids', { mode: 'json' })
			.$type<string[]>()
			.notNull()
			.default(sql`(json_array())`),
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

export const discountUsages = sqliteTable(
	'discount_usages',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
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
