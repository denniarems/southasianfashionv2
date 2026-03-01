import { getDb } from "./index";
import * as schema from "./schema";
import crypto from "crypto";

// Polyfill uuid for Edge runtime / Node
const generateId = () => crypto.randomUUID();

export async function seed() {
  const db = getDb();

  console.log("Starting seed...");

  // Clear existing data to prevent foreign key issues on rerun
  await db.delete(schema.products);
  await db.delete(schema.collections);
  await db.delete(schema.categories);
  await db.delete(schema.heroBanners);
  await db.delete(schema.settings);

  // Categories
  const cats = [
    {
      id: generateId(),
      name: "Sarees",
      slug: "sarees",
      description: "Traditional and contemporary sarees",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Lehengas",
      slug: "lehengas",
      description: "Bridal and festive lehengas",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Kurtas",
      slug: "kurtas",
      description: "Everyday and occasion kurtas",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Jewelry",
      slug: "jewelry",
      description: "Traditional and modern jewelry",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Menswear",
      slug: "menswear",
      description: "Sherwanis, kurtas, and more",
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Accessories",
      slug: "accessories",
      description: "Stoles, dupattas, and more",
      createdAt: new Date().toISOString(),
    },
  ];
  await db.insert(schema.categories).values(cats).onConflictDoNothing();

  // Collections
  const colSilkId = generateId();
  const colModernId = generateId();
  const colGroomId = generateId();
  const colJewelId = generateId();

  const cols = [
    {
      id: colSilkId,
      name: "The Silk Heritage",
      description:
        "A celebration of South Asia's finest silk weaving traditions. From Banarasi to Chanderi, each piece tells a story of artisanal excellence.",
      imageUrl: "https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=1200",
      slug: "silk-heritage",
      createdAt: new Date().toISOString(),
    },
    {
      id: colModernId,
      name: "Modern Maharani",
      description:
        "Contemporary silhouettes rooted in traditional craftsmanship. Where heritage meets the modern woman.",
      imageUrl: "https://images.unsplash.com/photo-1654764745388-978ac6cb8f82?q=80&w=1200",
      slug: "modern-maharani",
      createdAt: new Date().toISOString(),
    },
    {
      id: colGroomId,
      name: "Groom's Atelier",
      description:
        "Distinguished menswear for life's most memorable moments. Sherwanis and suits crafted with precision and pride.",
      imageUrl: "https://images.unsplash.com/photo-1762709413447-15781dbc08f7?q=80&w=1200",
      slug: "grooms-atelier",
      createdAt: new Date().toISOString(),
    },
    {
      id: colJewelId,
      name: "Sacred Adornments",
      description:
        "Jewelry that bridges centuries of artistry. Temple-inspired designs reimagined for today.",
      imageUrl: "https://images.unsplash.com/photo-1769706039344-7ad8d7ec2442?q=80&w=1200",
      slug: "sacred-adornments",
      createdAt: new Date().toISOString(),
    },
  ];
  await db.insert(schema.collections).values(cols).onConflictDoNothing();

  // Products
  const prods = [
    {
      id: generateId(),
      name: "Silk Chanderi Saree",
      description:
        "Hand-woven silk chanderi saree with gold zari border. A testament to centuries-old weaving traditions.",
      price: 485,
      category: "Sarees",
      imageUrl: "https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=800",
      isNew: true,
      isFeatured: true,
      collectionId: colSilkId,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Zardozi Lehenga",
      description:
        "Intricately embroidered lehenga with zardozi work. Perfect for celebrations and grand ceremonies.",
      price: 1250,
      category: "Lehengas",
      imageUrl: "https://images.unsplash.com/photo-1754925434445-fc9bb09ea8ff?q=80&w=800",
      isNew: true,
      isFeatured: false,
      collectionId: colModernId,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Block Print Kurta",
      description:
        "Hand block-printed cotton kurta in traditional Jaipur motifs. Effortless everyday elegance.",
      price: 165,
      category: "Kurtas",
      imageUrl: "https://images.unsplash.com/photo-1649140339391-b0953a2a8959?q=80&w=800",
      isNew: true,
      isFeatured: false,
      collectionId: colModernId,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Temple Jewelry Set",
      description:
        "Gold-plated temple jewelry set inspired by ancient South Indian artistry. Statement pieces for the modern connoisseur.",
      price: 320,
      category: "Jewelry",
      imageUrl: "https://images.unsplash.com/photo-1758995115857-2de1eb6283d0?q=80&w=800",
      isNew: true,
      isFeatured: true,
      collectionId: colJewelId,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Royal Sherwani",
      description:
        "Ivory embroidered sherwani with intricate thread work. Regal attire for the discerning gentleman.",
      price: 890,
      category: "Menswear",
      imageUrl: "https://images.unsplash.com/photo-1760080838961-4208536db385?q=80&w=800",
      isNew: true,
      isFeatured: false,
      collectionId: colGroomId,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      name: "Pashmina Stole",
      description:
        "Pure Kashmiri pashmina with delicate hand embroidery. Timeless warmth meets artisanal luxury.",
      price: 275,
      category: "Accessories",
      imageUrl: "https://images.unsplash.com/photo-1669197793395-ce3edf554c99?q=80&w=800",
      isNew: false,
      isFeatured: true,
      collectionId: colSilkId,
      createdAt: new Date().toISOString(),
    },
  ];
  await db.insert(schema.products).values(prods).onConflictDoNothing();

  // Hero
  await db
    .insert(schema.heroBanners)
    .values([
      {
        id: generateId(),
        title: "Curated Luxury. Culturally Rooted.",
        subtitle:
          "Discover South Asia's finest fashion \u2014 where centuries of craftsmanship meet contemporary elegance.",
        imageUrl: "https://images.unsplash.com/photo-1610189338175-0782dfdb0c04?q=80&w=2000",
        ctaText: "Explore Collection",
        ctaLink: "#new-arrivals",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ])
    .onConflictDoNothing();

  // Settings
  await db
    .insert(schema.settings)
    .values([
      {
        id: 1,
        whatsappNumber: "+1234567890",
        whatsappMessage: "Hello! I'm interested in SouthAsianFashion. Could you help me with",
        brandName: "SouthAsianFashion",
        brandTagline: "Curated Luxury. Culturally Rooted.",
        contactEmail: "hello@southasianfashion.com",
        instagramUrl: "https://instagram.com/southasianfashion",
        facebookUrl: "https://facebook.com/southasianfashion",
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete!");
}

// Allow running directly via `bun db/seed.ts`
if (typeof process !== "undefined" && process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
