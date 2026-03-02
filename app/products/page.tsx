import Image from "next/image";
import { getDb } from "@/db";
import { products, settings, collections } from "@/db/schema";
import { count, desc } from "drizzle-orm";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default async function ProductsPage() {
  const db = getDb();
  const currentYear = new Date().getFullYear();

  const [allProducts, allCollections, [siteSettings], [{ total }]] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(collections).orderBy(desc(collections.createdAt)),
    db.select().from(settings).limit(1),
    db.select({ total: count() }).from(products),
  ]);

  return (
    <>
      <Navbar settings={siteSettings} collections={allCollections} transparent={false} />

      <main className="pt-32 pb-24 min-h-screen bg-stone-50">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl text-stone-900 tracking-tight mb-4">
                All Products
              </h1>
              <p className="font-accent italic text-stone-500 text-lg">Showing {total} pieces</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allProducts.map((p: any) => (
              <div key={p.id} className="group">
                <div className="relative overflow-hidden aspect-[3/4] mb-4">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors duration-500" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
                  {p.category}
                </p>
                <Link href={`/products/${p.id}`} className="block">
                  <h3 className="font-heading text-lg text-stone-900 mb-1 hover:text-yellow-700 transition-colors">
                    {p.name}
                  </h3>
                </Link>
                <p className="text-sm text-stone-500">
                  {p.currency} {p.price?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer settings={siteSettings} year={currentYear} />
    </>
  );
}
