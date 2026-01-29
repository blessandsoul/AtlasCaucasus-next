-- ==========================================
-- SEED DATA: Georgian Locations
-- ==========================================

INSERT INTO locations (id, name, region, country, latitude, longitude, is_active) VALUES
-- Tbilisi Region
(UUID(), 'Tbilisi', 'Tbilisi', 'Georgia', 41.7151, 44.8271, TRUE),
(UUID(), 'Mtskheta', 'Mtskheta-Mtianeti', 'Georgia', 41.8456, 44.7176, TRUE),

-- Kakheti Region (Wine Region)
(UUID(), 'Sighnaghi', 'Kakheti', 'Georgia', 41.6198, 45.9221, TRUE),
(UUID(), 'Telavi', 'Kakheti', 'Georgia', 41.9198, 45.4733, TRUE),
(UUID(), 'Kvareli', 'Kakheti', 'Georgia', 41.9545, 45.8166, TRUE),
(UUID(), 'Tsinandali', 'Kakheti', 'Georgia', 41.8889, 45.5639, TRUE),

-- Imereti Region
(UUID(), 'Kutaisi', 'Imereti', 'Georgia', 42.2679, 42.6946, TRUE),
(UUID(), 'Prometheus Cave', 'Imereti', 'Georgia', 42.3767, 42.6008, TRUE),
(UUID(), 'Sataplia', 'Imereti', 'Georgia', 42.3100, 42.6375, TRUE),

-- Adjara Region
(UUID(), 'Batumi', 'Adjara', 'Georgia', 41.6168, 41.6367, TRUE),
(UUID(), 'Gonio', 'Adjara', 'Georgia', 41.5731, 41.5722, TRUE),
(UUID(), 'Mtirala National Park', 'Adjara', 'Georgia', 41.6667, 41.8333, TRUE),

-- Svaneti Region
(UUID(), 'Mestia', 'Samegrelo-Zemo Svaneti', 'Georgia', 43.0456, 42.7271, TRUE),
(UUID(), 'Ushguli', 'Samegrelo-Zemo Svaneti', 'Georgia', 42.9167, 43.0167, TRUE),

-- Kazbegi Region
(UUID(), 'Stepantsminda (Kazbegi)', 'Mtskheta-Mtianeti', 'Georgia', 42.6569, 44.6433, TRUE),
(UUID(), 'Gergeti Trinity Church', 'Mtskheta-Mtianeti', 'Georgia', 42.6628, 44.6200, TRUE),

-- Samtskhe-Javakheti Region
(UUID(), 'Borjomi', 'Samtskhe-Javakheti', 'Georgia', 41.8428, 43.3897, TRUE),
(UUID(), 'Vardzia', 'Samtskhe-Javakheti', 'Georgia', 41.3814, 43.2842, TRUE),
(UUID(), 'Rabati Castle', 'Samtskhe-Javakheti', 'Georgia', 41.6400, 42.9758, TRUE),

-- Racha-Lechkhumi Region
(UUID(), 'Ambrolauri', 'Racha-Lechkhumi', 'Georgia', 42.5194, 43.1511, TRUE),
(UUID(), 'Shaori Lake', 'Racha-Lechkhumi', 'Georgia', 42.5000, 43.2500, TRUE),

-- Black Sea Coast
(UUID(), 'Kobuleti', 'Adjara', 'Georgia', 41.8211, 41.7764, TRUE),
(UUID(), 'Ureki', 'Guria', 'Georgia', 41.9417, 41.7833, TRUE),
(UUID(), 'Anaklia', 'Samegrelo-Zemo Svaneti', 'Georgia', 42.4000, 41.5833, TRUE);
