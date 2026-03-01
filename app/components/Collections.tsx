"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export default function Collections({ collections }: { collections: Collection[] }) {
  if (!collections?.length) return null;

  return (
    <section
      id="collections"
      data-testid="collections-section"
      className="py-24 md:py-32 bg-stone-100"
    >
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="font-accent italic text-yellow-700 text-base md:text-lg mb-2">Curated</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-stone-900 tracking-tight">
            Our Collections
          </h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
        >
          {collections.map((c, i) => (
            <motion.div
              key={c.id}
              variants={fadeUp}
              data-testid={`collection-card-${c.id}`}
              className={`group relative overflow-hidden cursor-pointer ${
                i === 0
                  ? "md:row-span-2 min-h-[400px] md:min-h-[600px]"
                  : "min-h-[280px] md:min-h-[290px]"
              }`}
            >
              <Link
                href={`/collections/${c.slug}`}
                className="absolute inset-0 z-10"
                data-testid={`collection-link-${c.slug}`}
              />
              {c.imageUrl && (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <p className="font-accent italic text-white/60 text-sm mb-1">
                  {c.slug?.replace(/-/g, " ")}
                </p>
                <h3 className="font-heading text-xl md:text-2xl text-white mb-2">{c.name}</h3>
                <p className="text-white/60 text-sm max-w-md leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 mb-3">
                  {c.description}
                </p>
                <span className="inline-flex items-center gap-2 text-white/80 text-xs uppercase tracking-widest group-hover:gap-3 transition-all duration-300">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
