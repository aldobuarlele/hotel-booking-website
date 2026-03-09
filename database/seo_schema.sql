-- SEO Schema for Hotel Booking System
-- This schema adds SEO metadata columns to the global_settings table

-- Add meta_title and meta_description columns to global_settings table
ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Comment for documentation
COMMENT ON COLUMN global_settings.meta_title IS 'SEO title tag for the website (displayed in browser tab and search results)';
COMMENT ON COLUMN global_settings.meta_description IS 'SEO description for the website (displayed in search results and social media previews)';

-- Example of how to update existing records with default values
-- UPDATE global_settings SET meta_title = hotel_name || ' | Pengalaman Menginap Terbaik' WHERE meta_title IS NULL;
-- UPDATE global_settings SET meta_description = 'Platform booking hotel premium dengan koleksi akomodasi terbaik, layanan pelanggan 24/7, dan pengalaman menginap yang tak terlupakan' WHERE meta_description IS NULL;