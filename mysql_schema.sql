-- ============================================
-- MySQL Schema for ISS Sanitation System
-- Converted from PostgreSQL (Supabase)
-- ============================================

-- Create database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS iss_sanitation;
-- USE iss_sanitation;

-- ============================================
-- Table: sanitation_records
-- ============================================
CREATE TABLE IF NOT EXISTS sanitation_records (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plant VARCHAR(100) NOT NULL,
  area VARCHAR(100) NOT NULL,
  equipment VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'completed')),

  -- Photos with metadata
  photo_before_1 TEXT,
  photo_before_1_timestamp TIMESTAMP NULL,
  photo_before_2 TEXT,
  photo_before_2_timestamp TIMESTAMP NULL,
  photo_before_3 TEXT,
  photo_before_3_timestamp TIMESTAMP NULL,

  photo_after_1 TEXT,
  photo_after_1_timestamp TIMESTAMP NULL,
  photo_after_2 TEXT,
  photo_after_2_timestamp TIMESTAMP NULL,
  photo_after_3 TEXT,
  photo_after_3_timestamp TIMESTAMP NULL,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),

  INDEX idx_plant (plant),
  INDEX idx_area (area),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: app_users
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL
    CHECK (role IN ('admin', 'supervisor', 'qc_field')),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),

  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: permission_definitions
-- ============================================
CREATE TABLE IF NOT EXISTS permission_definitions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  permission_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_permission_name (permission_name),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: user_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission),
  INDEX idx_user_id (user_id),
  INDEX idx_permission (permission)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: menu_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS menu_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  menu_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_menu (user_id, menu_id),
  INDEX idx_user_id_menu (user_id),
  INDEX idx_menu_id (menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: plant_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS plant_permissions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  plant VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_plant (user_id, plant),
  INDEX idx_user_id_plant (user_id),
  INDEX idx_plant (plant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Permission Definitions
-- ============================================
INSERT INTO permission_definitions (permission_name, description, category) VALUES
  ('create_record', 'Membuat record sanitasi baru', 'Records'),
  ('edit_record', 'Edit record sanitasi', 'Records'),
  ('delete_record', 'Hapus record sanitasi', 'Records'),
  ('view_records', 'Lihat daftar records', 'Records'),
  ('save_all_draft_to_completed', 'Simpan semua draft menjadi completed', 'Records'),
  ('export_records', 'Export records ke Excel/PDF', 'Records'),
  ('manage_users', 'Kelola users dan permissions', 'Admin'),
  ('view_admin_panel', 'Akses admin panel', 'Admin')
ON DUPLICATE KEY UPDATE permission_name=permission_name;

-- ============================================
-- Insert Default Admin Account
-- Password: admin123
-- Note: This is a bcrypt hash, you'll need to use bcrypt in your backend
-- ============================================
INSERT INTO app_users (id, username, password_hash, full_name, role, is_active, created_by)
VALUES (
  UUID(),
  'admin',
  '$2a$10$8K1p/a0dL3LYqaVJTnHWp.h4z9eU3PBqJmYZxY5qYZqJZqJZqJZqJ',
  'Administrator',
  'admin',
  1,
  'system'
)
ON DUPLICATE KEY UPDATE username=username;

-- ============================================
-- Grant Admin All Permissions
-- ============================================
-- Note: Run this after admin user is created
-- Replace 'admin-user-id' with actual admin ID from app_users table

-- First, get the admin user ID:
-- SELECT id FROM app_users WHERE username = 'admin';

-- Then run these inserts (replace 'ADMIN_ID_HERE' with actual ID):
/*
INSERT INTO user_permissions (user_id, permission)
SELECT 'ADMIN_ID_HERE', permission_name
FROM permission_definitions
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Grant admin access to sanitasi_besar menu
INSERT INTO menu_permissions (user_id, menu_id)
VALUES ('ADMIN_ID_HERE', 'sanitasi_besar')
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Grant admin access to all plants
INSERT INTO plant_permissions (user_id, plant)
VALUES
  ('ADMIN_ID_HERE', 'Plant 1'),
  ('ADMIN_ID_HERE', 'Plant 2'),
  ('ADMIN_ID_HERE', 'Plant 3'),
  ('ADMIN_ID_HERE', 'Plant 4'),
  ('ADMIN_ID_HERE', 'Plant 5'),
  ('ADMIN_ID_HERE', 'Plant 6')
ON DUPLICATE KEY UPDATE user_id=user_id;
*/

-- ============================================
-- Notes:
-- ============================================
-- 1. UUID() function works in MySQL 8.0+
--    For older versions, use VARCHAR(36) and generate UUIDs in application
--
-- 2. TIMESTAMP vs timestamptz:
--    MySQL TIMESTAMP stores in UTC and converts to session timezone
--    Similar to PostgreSQL timestamptz
--
-- 3. Boolean vs TINYINT(1):
--    MySQL doesn't have native boolean, uses TINYINT(1)
--    0 = false, 1 = true
--
-- 4. Text types:
--    TEXT in MySQL = text in PostgreSQL
--    Both store large text
--
-- 5. CHECK constraints:
--    Supported in MySQL 8.0.16+
--    For older versions, use ENUM or handle in application
--
-- 6. RLS (Row Level Security):
--    MySQL doesn't have RLS - must implement in application layer
--    Use WHERE clauses to filter by user_id
--
-- 7. Indexes:
--    Added for common query patterns
--    May need adjustment based on usage
--
-- ============================================

-- ============================================
-- Verification Queries
-- ============================================

-- Check all tables created
-- SHOW TABLES;

-- Check table structure
-- DESCRIBE sanitation_records;
-- DESCRIBE app_users;

-- Check admin user created
-- SELECT * FROM app_users WHERE username = 'admin';

-- Check permissions defined
-- SELECT * FROM permission_definitions;

-- Count records
-- SELECT COUNT(*) FROM sanitation_records;
