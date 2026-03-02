import { getDb } from "@/db";
import { products, settings, collections } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const db = getDb();
  const { slug } = await params;
  const currentYear = new Date().getFullYear();

  const [productQuery, allCollections, [siteSettings]] = await Promise.all([
    db.select().from(products).where(eq(products.id, slug)).limit(1),
    db.select().from(collections).orderBy(desc(collections.createdAt)),
    db.select().from(settings).limit(1),
  ]);

  const p = productQuery[0];
  if (!p) return notFound();

  const whatsapp = siteSettings?.whatsappNumber?.replace(/[^0-9]/g, "") || "";

  return (
    <>
      <Navbar settings={siteSettings} collections={allCollections} transparent={false} />

      <main className="pt-32 pb-24 min-h-screen bg-white">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
            <div className="flex-1">
              <div className="aspect-[3/4] w-full bg-stone-100 overflow-hidden">
                {p.imageUrl ? (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 font-accent italic">
                    No Image
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 pt-8 lg:pt-16">
              <span className="text-xs uppercase tracking-widest text-stone-400 mb-4 block">
                {p.category}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl text-stone-900 tracking-tight mb-4">
                {p.name}
              </h1>
              <p className="font-heading text-2xl text-stone-600 mb-8">
                {p.currency} {p.price?.toLocaleString()}
              </p>

              <div className="prose prose-stone max-w-none text-stone-500 mb-12">
                <p className="leading-relaxed">{p.description}</p>
              </div>

              <div className="border-t border-b border-stone-200 py-8 mb-12">
                <div className="flex items-center gap-4">
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello! I'm interested in the ${p.name}. Could you share more details?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold hover:bg-yellow-700 transition-colors duration-300"
                  >
                    <MessageCircle size={16} />
                    Inquire via WhatsApp
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-stone-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Made to order
                </p>
                <p className="text-sm text-stone-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Ships worldwide
                </p>
                <p className="text-sm text-stone-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" /> Customization available
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer settings={siteSettings} year={currentYear} />
    </>
  );
}
