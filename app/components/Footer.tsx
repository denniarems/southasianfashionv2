import { Instagram, Facebook, Mail } from "lucide-react";
import Link from "next/link";

interface Settings {
  brandName?: string | null;
  brandTagline?: string | null;
  contactEmail?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
}

export default function Footer({ settings, year }: { settings?: Settings; year: number }) {
  return (
    <footer id="contact" data-testid="footer" className="bg-stone-900 text-white py-24 md:py-32">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">
          <div className="lg:col-span-2">
            <h3 className="font-heading text-2xl tracking-wide mb-4">
              {settings?.brandName || "SouthAsianFashion"}
            </h3>
            <p className="font-accent italic text-white/40 text-lg mb-6">
              {settings?.brandTagline || "Curated Luxury. Culturally Rooted."}
            </p>
            <p className="text-white/30 text-sm leading-relaxed max-w-md">
              Celebrating the rich tapestry of South Asian craftsmanship. Each piece in our
              collection is a testament to centuries-old traditions, reimagined for the contemporary
              connoisseur.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/20 mb-6">Explore</p>
            <div className="space-y-4">
              <Link
                href="/#new-arrivals"
                data-testid="footer-new-arrivals"
                className="block text-sm text-white/50 hover:text-white transition-colors duration-300"
              >
                New Arrivals
              </Link>
              <Link
                href="/collections"
                data-testid="footer-collections"
                className="block text-sm text-white/50 hover:text-white transition-colors duration-300"
              >
                Collections
              </Link>
              <Link
                href="/#featured"
                data-testid="footer-featured"
                className="block text-sm text-white/50 hover:text-white transition-colors duration-300"
              >
                Featured
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-white/20 mb-6">Connect</p>
            <div className="space-y-4">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  data-testid="footer-email"
                  className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors duration-300"
                >
                  <Mail size={14} /> {settings.contactEmail}
                </a>
              )}
              <div className="flex items-center gap-4 mt-6">
                {settings?.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="footer-instagram"
                    className="text-white/30 hover:text-white transition-colors duration-300"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {settings?.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="footer-facebook"
                    className="text-white/30 hover:text-white transition-colors duration-300"
                  >
                    <Facebook size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20 tracking-wider">
            &copy; {year} {settings?.brandName || "SouthAsianFashion"}. All
            rights reserved.
          </p>
          <p className="text-xs text-white/15 tracking-wider font-accent italic">
            Crafted with intention
          </p>
        </div>
      </div>
    </footer>
  );
}
