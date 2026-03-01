"use server";

import { getDb } from "@/db";
import { products, collections, heroBanners, categories, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteItem(type: string, id: string) {
  const db = getDb();

  try {
    switch (type) {
      case "products":
        await db.delete(products).where(eq(products.id, id));
        break;
      case "collections":
        await db.delete(collections).where(eq(collections.id, id));
        break;
      case "hero":
        await db.delete(heroBanners).where(eq(heroBanners.id, id));
        break;
      case "categories":
        await db.delete(categories).where(eq(categories.id, id));
        break;
      default:
        throw new Error("Invalid type");
    }
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function saveSettings(data: any) {
  const db = getDb();
  try {
    // Upsert logic for settings (since there is only one row)
    const existing = await db.select().from(settings).limit(1);
    if (existing.length > 0) {
      await db.update(settings).set(data).where(eq(settings.id, existing[0].id));
    } else {
      await db.insert(settings).values(data);
    }
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function saveItem(type: string, mode: "add" | "edit", data: any) {
  const db = getDb();

  try {
    switch (type) {
      case "products":
        if (mode === "add") {
          await db.insert(products).values(data);
        } else {
          await db.update(products).set(data).where(eq(products.id, data.id));
        }
        break;
      case "collections":
        if (mode === "add") {
          await db.insert(collections).values(data);
        } else {
          await db.update(collections).set(data).where(eq(collections.id, data.id));
        }
        break;
      case "hero":
        if (mode === "add") {
          await db.insert(heroBanners).values(data);
        } else {
          await db.update(heroBanners).set(data).where(eq(heroBanners.id, data.id));
        }
        break;
      case "categories":
        if (mode === "add") {
          await db.insert(categories).values(data);
        } else {
          await db.update(categories).set(data).where(eq(categories.id, data.id));
        }
        break;
      default:
        throw new Error("Invalid type");
    }
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
