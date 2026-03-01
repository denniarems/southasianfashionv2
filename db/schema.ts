import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(), // uuid from mongo
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull(), // ISO string
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  slug: text("slug").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  price: real("price").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  category: text("category").references(() => categories.name),
  imageUrl: text("image_url").default(""),
  isNew: integer("is_new", { mode: "boolean" }).default(true),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
  collectionId: text("collection_id").references(() => collections.id),
  createdAt: text("created_at").notNull(),
});

export const heroBanners = sqliteTable("hero_banners", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").default(""),
  imageUrl: text("image_url").default(""),
  ctaText: text("cta_text").default("Explore Collection"),
  ctaLink: text("cta_link").default("#new-arrivals"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(), // SQLite autoincrement
  whatsappNumber: text("whatsapp_number").default(""),
  whatsappMessage: text("whatsapp_message").default(""),
  brandName: text("brand_name").default("SouthAsianFashion"),
  brandTagline: text("brand_tagline").default(""),
  contactEmail: text("contact_email").default(""),
  instagramUrl: text("instagram_url").default(""),
  facebookUrl: text("facebook_url").default(""),
});

export const otpCodes = sqliteTable("otp_codes", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
});
