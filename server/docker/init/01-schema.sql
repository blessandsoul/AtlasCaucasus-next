-- ==========================================
-- TOURISM SERVER DATABASE SCHEMA
-- Multi-role system with Company, Guide, Driver profiles
-- ==========================================

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Company hierarchy: Tour agents belong to a parent company
    parent_company_id VARCHAR(36) NULL,
    
    -- Email verification
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(64) NULL,
    verification_token_expires_at TIMESTAMP NULL,
    
    -- Password reset
    reset_password_token VARCHAR(64) NULL,
    reset_password_token_expires_at TIMESTAMP NULL,
    
    -- Account lockout (brute force protection)
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_is_active (is_active),
    INDEX idx_users_parent_company_id (parent_company_id),
    INDEX idx_users_verification_token (verification_token),
    INDEX idx_users_reset_password_token (reset_password_token),
    
    -- Self-referencing FK for company hierarchy
    CONSTRAINT fk_users_parent_company FOREIGN KEY (parent_company_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- USER ROLES TABLE (Multi-role support)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('USER', 'COMPANY', 'TOUR_AGENT', 'GUIDE', 'DRIVER', 'ADMIN') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Each user can have each role only once
    UNIQUE KEY uk_user_role (user_id, role),
    INDEX idx_user_roles_role (role),
    
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- USER SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    user_agent VARCHAR(512) NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_expires_at (expires_at),
    INDEX idx_user_sessions_revoked_at (revoked_at),
    
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- COMPANIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    registration_number VARCHAR(100) NULL UNIQUE,
    logo_url VARCHAR(512) NULL,
    website_url VARCHAR(512) NULL,
    phone_number VARCHAR(20) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_companies_is_verified (is_verified),
    INDEX idx_companies_company_name (company_name),
    
    CONSTRAINT fk_companies_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- GUIDES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS guides (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    bio TEXT NULL,
    languages JSON NOT NULL DEFAULT ('[]'),
    years_of_experience INT NULL,
    photo_url VARCHAR(512) NULL,
    phone_number VARCHAR(20) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_guides_is_verified (is_verified),
    INDEX idx_guides_is_available (is_available),
    
    CONSTRAINT fk_guides_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- DRIVERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    bio TEXT NULL,
    vehicle_type VARCHAR(100) NULL,
    vehicle_capacity INT NULL,
    vehicle_make VARCHAR(100) NULL,
    vehicle_model VARCHAR(100) NULL,
    vehicle_year INT NULL,
    license_number VARCHAR(50) NULL,
    photo_url VARCHAR(512) NULL,
    phone_number VARCHAR(20) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_drivers_is_verified (is_verified),
    INDEX idx_drivers_is_available (is_available),
    INDEX idx_drivers_vehicle_type (vehicle_type),
    
    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- LOCATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Georgia',
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_location_name_country (name, country),
    INDEX idx_locations_is_active (is_active),
    INDEX idx_locations_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TOURS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS tours (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    description TEXT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GEL',
    duration_minutes INT NULL,
    max_people INT NULL,
    difficulty ENUM('easy', 'moderate', 'challenging') NULL,
    category VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tours_owner_id (owner_id),
    INDEX idx_tours_company_id (company_id),
    INDEX idx_tours_is_active (is_active),
    INDEX idx_tours_is_featured (is_featured),
    INDEX idx_tours_price (price),
    INDEX idx_tours_category (category),
    
    CONSTRAINT fk_tours_owner FOREIGN KEY (owner_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tours_company FOREIGN KEY (company_id) 
        REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- TOUR LOCATIONS (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS tour_locations (
    tour_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (tour_id, location_id),
    INDEX idx_tour_locations_location_id (location_id),
    
    CONSTRAINT fk_tour_locations_tour FOREIGN KEY (tour_id) 
        REFERENCES tours(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tour_locations_location FOREIGN KEY (location_id) 
        REFERENCES locations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- GUIDE LOCATIONS (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS guide_locations (
    guide_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (guide_id, location_id),
    INDEX idx_guide_locations_location_id (location_id),
    
    CONSTRAINT fk_guide_locations_guide FOREIGN KEY (guide_id) 
        REFERENCES guides(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_guide_locations_location FOREIGN KEY (location_id) 
        REFERENCES locations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- DRIVER LOCATIONS (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS driver_locations (
    driver_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (driver_id, location_id),
    INDEX idx_driver_locations_location_id (location_id),
    
    CONSTRAINT fk_driver_locations_driver FOREIGN KEY (driver_id) 
        REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_driver_locations_location FOREIGN KEY (location_id) 
        REFERENCES locations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
