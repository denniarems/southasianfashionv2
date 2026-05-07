DELETE FROM discount_usages;
DELETE FROM discounts;
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM hero_banners;
DELETE FROM size_guides;
DELETE FROM categories;
DELETE FROM collections;
DELETE FROM settings;
DELETE FROM models;

INSERT INTO categories (id, name, slug, description, created_at) VALUES
	('cat-sarees', 'Sarees', 'sarees', 'Traditional and contemporary sarees', '2026-01-01T00:00:00.000Z'),
	('cat-lehengas', 'Lehengas', 'lehengas', 'Bridal and festive lehengas', '2026-01-01T00:00:00.000Z'),
	('cat-kurtas', 'Kurtas', 'kurtas', 'Everyday and occasion kurtas', '2026-01-01T00:00:00.000Z'),
	('cat-jewelry', 'Jewelry', 'jewelry', 'Traditional and modern jewelry', '2026-01-01T00:00:00.000Z'),
	('cat-menswear', 'Menswear', 'menswear', 'Sherwanis, kurtas, and more', '2026-01-01T00:00:00.000Z'),
	('cat-accessories', 'Accessories', 'accessories', 'Stoles, dupattas, and more', '2026-01-01T00:00:00.000Z');

INSERT INTO collections (id, name, description, image_url, slug, created_at) VALUES
	('col-silk-heritage', 'The Silk Heritage', 'A celebration of South Asia''s finest silk weaving traditions. From Banarasi to Chanderi, each piece tells a story of artisanal excellence.', 'https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=1200', 'silk-heritage', '2026-01-01T00:00:00.000Z'),
	('col-modern-maharani', 'Modern Maharani', 'Contemporary silhouettes rooted in traditional craftsmanship. Where heritage meets the modern woman.', 'https://images.unsplash.com/photo-1654764745388-978ac6cb8f82?q=80&w=1200', 'modern-maharani', '2026-01-01T00:00:00.000Z'),
	('col-grooms-atelier', 'Groom''s Atelier', 'Distinguished menswear for life''s most memorable moments. Sherwanis and suits crafted with precision and pride.', 'https://images.unsplash.com/photo-1762709413447-15781dbc08f7?q=80&w=1200', 'grooms-atelier', '2026-01-01T00:00:00.000Z'),
	('col-sacred-adornments', 'Sacred Adornments', 'Jewelry that bridges centuries of artistry. Temple-inspired designs reimagined for today.', 'https://images.unsplash.com/photo-1769706039344-7ad8d7ec2442?q=80&w=1200', 'sacred-adornments', '2026-01-01T00:00:00.000Z');

INSERT INTO size_guides (id, name, product_type, unit, note, columns_json, rows_json, is_active, created_at) VALUES
	('size-women-ethnic', 'Women Ethnic (Kurta / Saree Blouse)', 'Womenswear', 'in', 'All measurements are garment measurements in inches. For comfort fit, keep 1-2 inches ease.', '["Bust","Waist","Hip","Length"]', '[{"size":"XS","values":["32","26","35","38"]},{"size":"S","values":["34","28","37","39"]},{"size":"M","values":["36","30","39","40"]},{"size":"L","values":["38","32","41","41"]},{"size":"XL","values":["40","34","43","42"]},{"size":"XXL","values":["42","36","45","43"]}]', 1, '2026-01-01T00:00:00.000Z'),
	('size-lehenga', 'Lehenga Set (Blouse + Skirt)', 'Womenswear', 'in', 'Lehenga measurements are finished garment measurements. Contact us for custom cancan/length adjustments.', '["Bust","Waist","Hip","Skirt Length"]', '[{"size":"XS","values":["32","25","36","42"]},{"size":"S","values":["34","27","38","42"]},{"size":"M","values":["36","29","40","43"]},{"size":"L","values":["38","31","42","43"]},{"size":"XL","values":["40","33","44","44"]}]', 1, '2026-01-01T00:00:00.000Z'),
	('size-mens-sherwani', 'Mens Sherwani / Kurta', 'Menswear', 'in', 'Chest and shoulder are key fit points for sherwanis. If in-between sizes, we recommend sizing up.', '["Chest","Shoulder","Waist","Length","Sleeve"]', '[{"size":"S","values":["38","17","34","40","24"]},{"size":"M","values":["40","17.5","36","41","24.5"]},{"size":"L","values":["42","18","38","42","25"]},{"size":"XL","values":["44","18.5","40","43","25.5"]},{"size":"XXL","values":["46","19","42","44","26"]}]', 1, '2026-01-01T00:00:00.000Z'),
	('size-accessory', 'Accessory Length Guide', 'Accessories', 'in', 'Accessory measurements may vary slightly due to handcrafted finishing.', '["Length","Width"]', '[{"size":"Standard","values":["80","28"]},{"size":"Long","values":["92","30"]}]', 1, '2026-01-01T00:00:00.000Z');

INSERT INTO products (id, name, slug, description, price, currency, category, image_url, is_new, is_featured, collection_id, size_guide_id, created_at) VALUES
	('prod-silk-chanderi-saree', 'Silk Chanderi Saree', 'silk-chanderi-saree', 'Hand-woven silk chanderi saree with gold zari border. A testament to centuries-old weaving traditions.', 485, 'CAD', 'Sarees', 'https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=800', 1, 1, 'col-silk-heritage', 'size-women-ethnic', '2026-01-01T00:00:00.000Z'),
	('prod-zardozi-lehenga', 'Zardozi Lehenga', 'zardozi-lehenga', 'Intricately embroidered lehenga with zardozi work. Perfect for celebrations and grand ceremonies.', 1250, 'CAD', 'Lehengas', 'https://images.unsplash.com/photo-1754925434445-fc9bb09ea8ff?q=80&w=800', 1, 0, 'col-modern-maharani', 'size-lehenga', '2026-01-01T00:00:00.000Z'),
	('prod-block-print-kurta', 'Block Print Kurta', 'block-print-kurta', 'Hand block-printed cotton kurta in traditional Jaipur motifs. Effortless everyday elegance.', 165, 'CAD', 'Kurtas', 'https://images.unsplash.com/photo-1649140339391-b0953a2a8959?q=80&w=800', 1, 0, 'col-modern-maharani', 'size-women-ethnic', '2026-01-01T00:00:00.000Z'),
	('prod-temple-jewelry-set', 'Temple Jewelry Set', 'temple-jewelry-set', 'Gold-plated temple jewelry set inspired by ancient South Indian artistry. Statement pieces for the modern connoisseur.', 320, 'CAD', 'Jewelry', 'https://images.unsplash.com/photo-1758995115857-2de1eb6283d0?q=80&w=800', 1, 1, 'col-sacred-adornments', NULL, '2026-01-01T00:00:00.000Z'),
	('prod-royal-sherwani', 'Royal Sherwani', 'royal-sherwani', 'Ivory embroidered sherwani with intricate thread work. Regal attire for the discerning gentleman.', 890, 'CAD', 'Menswear', 'https://images.unsplash.com/photo-1760080838961-4208536db385?q=80&w=800', 1, 0, 'col-grooms-atelier', 'size-mens-sherwani', '2026-01-01T00:00:00.000Z'),
	('prod-pashmina-stole', 'Pashmina Stole', 'pashmina-stole', 'Pure Kashmiri pashmina with delicate hand embroidery. Timeless warmth meets artisanal luxury.', 275, 'CAD', 'Accessories', 'https://images.unsplash.com/photo-1669197793395-ce3edf554c99?q=80&w=800', 0, 1, 'col-silk-heritage', 'size-accessory', '2026-01-01T00:00:00.000Z');

INSERT INTO product_images (id, product_id, image_url, sort_order, created_at) VALUES
	('img-silk-chanderi-1', 'prod-silk-chanderi-saree', 'https://images.unsplash.com/photo-1705164453572-69b94a306f92?q=80&w=1200', 0, '2026-01-01T00:00:00.000Z'),
	('img-zardozi-lehenga-1', 'prod-zardozi-lehenga', 'https://images.unsplash.com/photo-1754925434445-fc9bb09ea8ff?q=80&w=1200', 0, '2026-01-01T00:00:00.000Z'),
	('img-royal-sherwani-1', 'prod-royal-sherwani', 'https://images.unsplash.com/photo-1760080838961-4208536db385?q=80&w=1200', 0, '2026-01-01T00:00:00.000Z');

INSERT INTO hero_banners (id, title, subtitle, image_url, cta_text, cta_link, is_active, created_at) VALUES
	('hero-main', 'Curated Luxury. Culturally Rooted.', 'Discover South Asia''s finest fashion, where centuries of craftsmanship meet contemporary elegance.', 'https://images.unsplash.com/photo-1610189338175-0782dfdb0c04?q=80&w=2000', 'Explore Collection', '#new-arrivals', 1, '2026-01-01T00:00:00.000Z');

INSERT INTO settings (id, whatsapp_number, whatsapp_message, brand_name, brand_tagline, contact_email, instagram_url, facebook_url) VALUES
	(1, '+1234567890', 'Hello! I''m interested in SouthAsianFashion. Could you help me with', 'SouthAsianFashion', 'Curated Luxury. Culturally Rooted.', 'hello@southasianfashion.com', 'https://instagram.com/southasianfashion', 'https://facebook.com/southasianfashion');

INSERT INTO discounts (id, name, description, discount_type, discount_value, original_price, start_date, end_date, min_cart_value, applicable_product_ids, applicable_categories, stackable, max_uses, priority, is_active, product_id, bundle_product_ids, tier_rules_json, usage_count, wording, created_at, updated_at) VALUES
	('discount-festive-flat', 'Festive Welcome', 'Introductory CAD 50 off featured occasionwear.', 'flat', 50, NULL, 1767225600000, NULL, 300, '[]', '["Sarees","Lehengas","Menswear"]', 0, NULL, 10, 1, NULL, '[]', '[]', 0, 'Festive Price Drop', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
