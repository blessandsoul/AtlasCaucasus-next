-- ============================================
-- SEED DATA FOR GUIDES TESTING
-- Run this in phpMyAdmin or MySQL CLI
-- ============================================

-- First, ensure we have some locations
INSERT IGNORE INTO locations (id, name, region, country, latitude, longitude, is_active, created_at, updated_at)
VALUES 
    (UUID(), 'Tbilisi', 'Tbilisi', 'Georgia', 41.7151, 44.8271, true, NOW(), NOW()),
    (UUID(), 'Batumi', 'Adjara', 'Georgia', 41.6168, 41.6367, true, NOW(), NOW()),
    (UUID(), 'Kutaisi', 'Imereti', 'Georgia', 42.2679, 42.6946, true, NOW(), NOW()),
    (UUID(), 'Mtskheta', 'Mtskheta-Mtianeti', 'Georgia', 41.8427, 44.7193, true, NOW(), NOW()),
    (UUID(), 'Kazbegi', 'Mtskheta-Mtianeti', 'Georgia', 42.6596, 44.6185, true, NOW(), NOW()),
    (UUID(), 'Signagi', 'Kakheti', 'Georgia', 41.6214, 45.9321, true, NOW(), NOW());

-- Create test users with GUIDE role
-- Password hash is for 'Password123!' using bcrypt
SET @password_hash = '$2b$10$K4t8YqN1hJqXhkR5mVxLxOxQyPzG4FvD2FwrIeV3nQ8W5sKjT6kZq';

-- User 1: Giorgi Beridze
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user1_id := UUID(), 'giorgi.guide@example.com', @password_hash, 'Giorgi', 'Beridze', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user1_id, 'GUIDE', NOW());

-- User 2: Nino Kapanadze
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user2_id := UUID(), 'nino.guide@example.com', @password_hash, 'Nino', 'Kapanadze', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user2_id, 'GUIDE', NOW());

-- User 3: Dato Lomidze
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user3_id := UUID(), 'dato.guide@example.com', @password_hash, 'Dato', 'Lomidze', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user3_id, 'GUIDE', NOW());

-- User 4: Mariam Chkhaidze
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user4_id := UUID(), 'mariam.guide@example.com', @password_hash, 'Mariam', 'Chkhaidze', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user4_id, 'GUIDE', NOW());

-- User 5: Tornike Gvenetadze
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user5_id := UUID(), 'tornike.guide@example.com', @password_hash, 'Tornike', 'Gvenetadze', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user5_id, 'GUIDE', NOW());

-- User 6: Elene Tsitskishvili
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, token_version, email_verified, created_at, updated_at)
VALUES (@user6_id := UUID(), 'elene.guide@example.com', @password_hash, 'Elene', 'Tsitskishvili', true, 0, true, NOW(), NOW());

INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @user6_id, 'GUIDE', NOW());

-- Create guide profiles
INSERT INTO guides (id, user_id, bio, languages, years_of_experience, photo_url, phone_number, is_verified, is_available, average_rating, review_count, price_per_day, currency, created_at, updated_at)
VALUES 
    (@guide1_id := UUID(), @user1_id, 
     'Professional tour guide with 10 years of experience exploring the hidden gems of Georgia. Fluent in English, Russian, and Georgian. Specializing in wine tours and historical sites.',
     '["en", "ru", "ka"]', 10, NULL, '+995599123456', true, true, 4.85, 47, 150.00, 'GEL', NOW(), NOW()),
    
    (@guide2_id := UUID(), @user2_id, 
     'Passionate about Georgian culture and history. I love sharing stories about ancient monasteries and the Silk Road heritage. Hiking and adventure tours specialist.',
     '["en", "ka", "de"]', 7, NULL, '+995599234567', true, true, 4.92, 31, 180.00, 'GEL', NOW(), NOW()),
    
    (@guide3_id := UUID(), @user3_id, 
     'Mountain guide certified for high-altitude trekking. Expert in Svaneti and Kazbegi regions. Safety-focused adventures for all skill levels.',
     '["en", "ru", "ka", "fr"]', 12, NULL, '+995599345678', true, true, 4.78, 56, 250.00, 'GEL', NOW(), NOW()),
    
    (@guide4_id := UUID(), @user4_id, 
     'Food and wine tour specialist. Former sommelier with deep knowledge of Georgian winemaking traditions. Let me take you on a culinary journey!',
     '["en", "ka"]', 5, NULL, '+995599456789', true, true, 4.95, 23, 200.00, 'GEL', NOW(), NOW()),
    
    (@guide5_id := UUID(), @user5_id, 
     'Photography and cultural tours. I help travelers capture the perfect shots while learning about Georgian traditions. Fluent in multiple languages.',
     '["en", "ru", "ka", "es"]', 8, NULL, '+995599567890', false, false, 4.60, 15, 120.00, 'GEL', NOW(), NOW()),
    
    (@guide6_id := UUID(), @user6_id, 
     'Nature and bird watching specialist. Certified ornithologist offering eco-tours in Georgian national parks. Perfect for nature lovers!',
     '["en", "ka"]', 6, NULL, '+995599678901', true, true, 4.72, 19, 140.00, 'GEL', NOW(), NOW());

-- Get location IDs
SET @tbilisi_id = (SELECT id FROM locations WHERE name = 'Tbilisi' LIMIT 1);
SET @batumi_id = (SELECT id FROM locations WHERE name = 'Batumi' LIMIT 1);
SET @kutaisi_id = (SELECT id FROM locations WHERE name = 'Kutaisi' LIMIT 1);
SET @mtskheta_id = (SELECT id FROM locations WHERE name = 'Mtskheta' LIMIT 1);
SET @kazbegi_id = (SELECT id FROM locations WHERE name = 'Kazbegi' LIMIT 1);
SET @signagi_id = (SELECT id FROM locations WHERE name = 'Signagi' LIMIT 1);

-- Add guide locations (many-to-many)
INSERT INTO guide_locations (guide_id, location_id, is_primary, created_at)
VALUES 
    -- Guide 1: Giorgi - Tbilisi (primary), Mtskheta, Signagi
    (@guide1_id, @tbilisi_id, true, NOW()),
    (@guide1_id, @mtskheta_id, false, NOW()),
    (@guide1_id, @signagi_id, false, NOW()),
    
    -- Guide 2: Nino - Kutaisi (primary), Batumi
    (@guide2_id, @kutaisi_id, true, NOW()),
    (@guide2_id, @batumi_id, false, NOW()),
    
    -- Guide 3: Dato - Kazbegi (primary), Mtskheta, Tbilisi
    (@guide3_id, @kazbegi_id, true, NOW()),
    (@guide3_id, @mtskheta_id, false, NOW()),
    (@guide3_id, @tbilisi_id, false, NOW()),
    
    -- Guide 4: Mariam - Signagi (primary), Tbilisi
    (@guide4_id, @signagi_id, true, NOW()),
    (@guide4_id, @tbilisi_id, false, NOW()),
    
    -- Guide 5: Tornike - Tbilisi (primary), Kazbegi, Batumi
    (@guide5_id, @tbilisi_id, true, NOW()),
    (@guide5_id, @kazbegi_id, false, NOW()),
    (@guide5_id, @batumi_id, false, NOW()),
    
    -- Guide 6: Elene - Batumi (primary), Kutaisi
    (@guide6_id, @batumi_id, true, NOW()),
    (@guide6_id, @kutaisi_id, false, NOW());

-- Verify the data
SELECT 
    g.id,
    CONCAT(u.first_name, ' ', u.last_name) AS guide_name,
    g.bio,
    g.languages,
    g.years_of_experience,
    g.is_verified,
    g.is_available,
    g.average_rating,
    g.review_count
FROM guides g
JOIN users u ON g.user_id = u.id
ORDER BY g.created_at DESC;
