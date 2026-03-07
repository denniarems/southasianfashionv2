PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DELETE FROM product_images;
DELETE FROM discount_usages;
DELETE FROM discounts;
DELETE FROM products;
DELETE FROM size_guides;
DELETE FROM collections;
DELETE FROM categories;
DELETE FROM hero_banners;
DELETE FROM settings;

INSERT INTO categories (id, name, slug, description, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarees', 'sarees', 'Traditional and contemporary sarees', '2026-03-07T00:00:00.000Z'),
  ('22222222-2222-2222-2222-222222222222', 'Lehengas', 'lehengas', 'Bridal and festive lehengas', '2026-03-07T00:00:00.000Z'),
  ('33333333-3333-3333-3333-333333333333', 'Kurtas', 'kurtas', 'Everyday and occasion kurtas', '2026-03-07T00:00:00.000Z'),
  ('44444444-4444-4444-4444-444444444444', 'Jewelry', 'jewelry', 'Traditional and modern jewelry', '2026-03-07T00:00:00.000Z'),
  ('55555555-5555-5555-5555-555555555555', 'Menswear', 'menswear', 'Sherwanis, kurtas, and more', '2026-03-07T00:00:00.000Z'),
  ('66666666-6666-6666-6666-666666666666', 'Accessories', 'accessories', 'Stoles, dupattas, and more', '2026-03-07T00:00:00.000Z');

INSERT INTO collections (id, name, description, image_url, slug, created_at) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'The Silk Heritage', 'A celebration of South Asia''s finest silk weaving traditions. From Banarasi to Chanderi, each piece tells a story of artisanal excellence.', 'https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=1200', 'silk-heritage', '2026-03-07T00:00:00.000Z'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Modern Maharani', 'Contemporary silhouettes rooted in traditional craftsmanship. Where heritage meets the modern woman.', 'https://images.unsplash.com/photo-1654764745388-978ac6cb8f82?q=80&w=1200', 'modern-maharani', '2026-03-07T00:00:00.000Z'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Groom''s Atelier', 'Distinguished menswear for life''s most memorable moments. Sherwanis and suits crafted with precision and pride.', 'https://images.unsplash.com/photo-1762709413447-15781dbc08f7?q=80&w=1200', 'grooms-atelier', '2026-03-07T00:00:00.000Z'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Sacred Adornments', 'Jewelry that bridges centuries of artistry. Temple-inspired designs reimagined for today.', 'https://images.unsplash.com/photo-1769706039344-7ad8d7ec2442?q=80&w=1200', 'sacred-adornments', '2026-03-07T00:00:00.000Z');

INSERT INTO size_guides (id, name, product_type, unit, note, columns_json, rows_json, is_active, created_at) VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Women Ethnic (Kurta / Saree Blouse)', 'Womenswear', 'in', 'All measurements are garment measurements in inches. For comfort fit, keep 1-2 inches ease.', '["Bust","Waist","Hip","Length"]', '[{"size":"XS","values":["32","26","35","38"]},{"size":"S","values":["34","28","37","39"]},{"size":"M","values":["36","30","39","40"]},{"size":"L","values":["38","32","41","41"]},{"size":"XL","values":["40","34","43","42"]},{"size":"XXL","values":["42","36","45","43"]}]', 1, '2026-03-07T00:00:00.000Z'),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Lehenga Set (Blouse + Skirt)', 'Womenswear', 'in', 'Lehenga measurements are finished garment measurements. Contact us for custom cancan/length adjustments.', '["Bust","Waist","Hip","Skirt Length"]', '[{"size":"XS","values":["32","25","36","42"]},{"size":"S","values":["34","27","38","42"]},{"size":"M","values":["36","29","40","43"]},{"size":"L","values":["38","31","42","43"]},{"size":"XL","values":["40","33","44","44"]}]', 1, '2026-03-07T00:00:00.000Z'),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Mens Sherwani / Kurta', 'Menswear', 'in', 'Chest and shoulder are key fit points for sherwanis. If in-between sizes, we recommend sizing up.', '["Chest","Shoulder","Waist","Length","Sleeve"]', '[{"size":"S","values":["38","17","34","40","24"]},{"size":"M","values":["40","17.5","36","41","24.5"]},{"size":"L","values":["42","18","38","42","25"]},{"size":"XL","values":["44","18.5","40","43","25.5"]},{"size":"XXL","values":["46","19","42","44","26"]}]', 1, '2026-03-07T00:00:00.000Z'),
  ('bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 'Accessory Length Guide', 'Accessories', 'in', 'Accessory measurements may vary slightly due to handcrafted finishing.', '["Length","Width"]', '[{"size":"Standard","values":["80","28"]},{"size":"Long","values":["92","30"]}]', 1, '2026-03-07T00:00:00.000Z');

INSERT INTO products (id, name, slug, description, price, currency, category, image_url, is_new, is_featured, collection_id, size_guide_id, created_at) VALUES
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'Silk Chanderi Saree', 'silk-chanderi-saree', 'Hand-woven silk chanderi saree with gold zari border. A testament to centuries-old weaving traditions.', 485, 'CAD', 'Sarees', 'https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=800', 1, 1, 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2026-03-07T00:00:00.000Z'),
  ('ccccccc2-cccc-cccc-cccc-ccccccccccc2', 'Zardozi Lehenga', 'zardozi-lehenga', 'Intricately embroidered lehenga with zardozi work. Perfect for celebrations and grand ceremonies.', 1250, 'CAD', 'Lehengas', 'https://images.unsplash.com/photo-1754925434445-fc9bb09ea8ff?q=80&w=800', 1, 0, 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '2026-03-07T00:00:00.000Z'),
  ('ccccccc3-cccc-cccc-cccc-ccccccccccc3', 'Block Print Kurta', 'block-print-kurta', 'Hand block-printed cotton kurta in traditional Jaipur motifs. Effortless everyday elegance.', 165, 'CAD', 'Kurtas', 'https://images.unsplash.com/photo-1649140339391-b0953a2a8959?q=80&w=800', 1, 0, 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '2026-03-07T00:00:00.000Z'),
  ('ccccccc4-cccc-cccc-cccc-ccccccccccc4', 'Temple Jewelry Set', 'temple-jewelry-set', 'Gold-plated temple jewelry set inspired by ancient South Indian artistry. Statement pieces for the modern connoisseur.', 320, 'CAD', 'Jewelry', 'https://images.unsplash.com/photo-1758995115857-2de1eb6283d0?q=80&w=800', 1, 1, 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', NULL, '2026-03-07T00:00:00.000Z'),
  ('ccccccc5-cccc-cccc-cccc-ccccccccccc5', 'Royal Sherwani', 'royal-sherwani', 'Ivory embroidered sherwani with intricate thread work. Regal attire for the discerning gentleman.', 890, 'CAD', 'Menswear', 'https://images.unsplash.com/photo-1760080838961-4208536db385?q=80&w=800', 1, 0, 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '2026-03-07T00:00:00.000Z'),
  ('ccccccc6-cccc-cccc-cccc-ccccccccccc6', 'Pashmina Stole', 'pashmina-stole', 'Pure Kashmiri pashmina with delicate hand embroidery. Timeless warmth meets artisanal luxury.', 275, 'CAD', 'Accessories', 'https://images.unsplash.com/photo-1669197793395-ce3edf554c99?q=80&w=800', 0, 1, 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbb4-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '2026-03-07T00:00:00.000Z');

INSERT INTO hero_banners (id, title, subtitle, image_url, cta_text, cta_link, is_active, created_at) VALUES
  ('ddddddd1-dddd-dddd-dddd-ddddddddddd1', 'Curated Luxury. Culturally Rooted.', 'Discover South Asia''s finest fashion — where centuries of craftsmanship meet contemporary elegance.', 'https://images.unsplash.com/photo-1610189338175-0782dfdb0c04?q=80&w=2000', 'Explore Collection', '#new-arrivals', 1, '2026-03-07T00:00:00.000Z');

INSERT INTO settings (id, whatsapp_number, whatsapp_message, brand_name, brand_tagline, contact_email, instagram_url, facebook_url) VALUES
  (1, '+1234567890', 'Hello! I''m interested in SouthAsianFashion. Could you help me with', 'SouthAsianFashion', 'Curated Luxury. Culturally Rooted.', '[email protected]', 'https://instagram.com/southasianfashion', 'https://facebook.com/southasianfashion');

COMMIT;
