-- CMS Schema for Hotel Booking System
-- This schema defines tables for CMS functionality: global settings, landing page content, amenities

-- Create global_settings table for storing global configuration
CREATE TABLE global_settings (
    id INT PRIMARY KEY CHECK (id = 1),
    app_name VARCHAR(255) NOT NULL DEFAULT 'Hotel Booking System',
    hotel_name VARCHAR(255) NOT NULL,
    bank_account_number VARCHAR(100) NOT NULL,
    max_file_size_mb INT DEFAULT 2 CHECK (max_file_size_mb > 0),
    currency VARCHAR(10) DEFAULT 'IDR',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create landing_page_content table for managing landing page sections
CREATE TABLE landing_page_content (
    id SERIAL PRIMARY KEY,
    section_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    subtitle TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create amenities table for storing hotel amenities/features
CREATE TABLE amenities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NOT NULL, -- Lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create room_amenities junction table for many-to-many relationship between rooms and amenities
CREATE TABLE room_amenities (
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, amenity_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_landing_page_content_section_key ON landing_page_content(section_key);
CREATE INDEX idx_landing_page_content_is_active ON landing_page_content(is_active);
CREATE INDEX idx_amenities_name ON amenities(name);
CREATE INDEX idx_room_amenities_room_id ON room_amenities(room_id);
CREATE INDEX idx_room_amenities_amenity_id ON room_amenities(amenity_id);

-- Apply trigger to automatically update updated_at timestamp for global_settings
CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to automatically update updated_at timestamp for landing_page_content
CREATE TRIGGER update_landing_page_content_updated_at
    BEFORE UPDATE ON landing_page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default global settings
INSERT INTO global_settings (
    id,
    hotel_name,
    bank_account_number,
    max_file_size_mb,
    contact_email,
    contact_phone
) VALUES (
    1,
    'LuxuryStay',
    'BCA 1234567890 a.n. Hotel Booking',
    2,
    NULL,
    NULL
);

-- Comments for documentation
COMMENT ON TABLE global_settings IS 'Stores global configuration settings for the hotel booking system';
COMMENT ON TABLE landing_page_content IS 'Stores content for different sections of the landing page';
COMMENT ON TABLE amenities IS 'Stores hotel amenities/features with Lucide icon names';
COMMENT ON TABLE room_amenities IS 'Junction table linking rooms to their amenities';