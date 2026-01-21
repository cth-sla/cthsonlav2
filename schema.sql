-- MySQL Schema for E-Meeting SLA Platform
CREATE DATABASE IF NOT EXISTS emeeting_sla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emeeting_sla;

-- 1. Table: Users
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('ADMIN', 'VIEWER') DEFAULT 'VIEWER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table: Units (Đơn vị)
CREATE TABLE units (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table: Staff (Cán bộ)
CREATE TABLE staff (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    unit_id VARCHAR(50),
    position VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- 4. Table: Endpoints (Điểm cầu)
CREATE TABLE endpoints (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status ENUM('CONNECTED', 'DISCONNECTED', 'CONNECTING') DEFAULT 'DISCONNECTED',
    last_connected VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Table: Meetings (Cuộc họp)
CREATE TABLE meetings (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    host_unit_name VARCHAR(255),
    chair_person_name VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table: Meeting Participants (Thành phần tham dự - M-M relationship if needed, here stored as list)
CREATE TABLE meeting_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id VARCHAR(50),
    participant_name VARCHAR(255),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- 7. Table: Meeting Endpoints (Mapping endpoints to meetings)
CREATE TABLE meeting_endpoints (
    meeting_id VARCHAR(50),
    endpoint_id VARCHAR(50),
    PRIMARY KEY (meeting_id, endpoint_id),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE
);

-- Insert Default Admin
INSERT INTO users (id, username, password, full_name, role) 
VALUES ('1', 'admin', 'admin', 'System Administrator', 'ADMIN');
