"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface Settings {
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
}

export default function WhatsAppButton({ settings }: { settings?: Settings }) {
  const [open, setOpen] = useState(false);
  const whatsapp = settings?.whatsappNumber?.replace(/[^0-9]/g, "") || "";
  const message = settings?.whatsappMessage || "Hello! I'm interested in your collection.";

  return (
    <div className="fixed bottom-8 right-8 z-50" data-testid="whatsapp-widget">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-16 right-0 bg-white border border-stone-200 p-6 w-72 mb-4 shadow-lg"
          >
            <p className="font-heading text-lg text-stone-900 mb-2">Get in Touch</p>
            <p className="text-stone-500 text-sm mb-4 leading-relaxed">
              Chat with us on WhatsApp for personalized styling assistance.
            </p>
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="whatsapp-chat-link"
              className="block text-center bg-stone-900 text-white py-3 text-xs uppercase tracking-widest hover:bg-yellow-700 transition-colors duration-300"
            >
              Start Conversation
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        data-testid="whatsapp-toggle-btn"
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-stone-900 text-white flex items-center justify-center hover:bg-yellow-700 transition-colors duration-300 shadow-lg"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
