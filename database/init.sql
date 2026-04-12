-- =============================================
-- MobileCity Chatbot Database Schema
-- PostgreSQL Init Script
-- =============================================

-- Bảng sản phẩm
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    price BIGINT NOT NULL,
    original_price BIGINT,
    stock INTEGER DEFAULT 0,
    specs JSONB,
    features TEXT[],
    warranty_months INTEGER DEFAULT 12,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng đơn hàng
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(20) NOT NULL UNIQUE,
    product_id INTEGER REFERENCES products(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD',
    status VARCHAR(20) DEFAULT 'pending',
    note TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng lịch sử hội thoại
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    sender VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    intent VARCHAR(100),
    confidence FLOAT,
    entities JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Bảng handoff requests
CREATE TABLE IF NOT EXISTS handoff_requests (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    trigger_reason VARCHAR(100) NOT NULL DEFAULT 'manual',
    fallback_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_staff VARCHAR(100),
    note TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index tối ưu query
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_handoff_status ON handoff_requests(status);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);

-- =============================================
-- Seed data mẫu
-- =============================================

INSERT INTO products (name, brand, price, original_price, stock, specs, features, warranty_months, image_url) VALUES
(
    'iPhone 16 Pro Max 256GB',
    'Apple',
    34990000,
    36990000,
    15,
    '{"cpu": "A18 Pro", "ram": "8GB", "storage": "256GB", "camera": "48MP + 48MP + 12MP", "battery": "4685mAh", "screen": "6.9 inch OLED 120Hz", "os": "iOS 18"}',
    ARRAY['Camera ProRes 4K', 'Action Button', 'USB-C 3.0', 'Face ID', 'MagSafe'],
    12,
    'https://mobilecity.vn/images/iphone-16-pro-max.jpg'
),
(
    'Samsung Galaxy S25 Ultra 256GB',
    'Samsung',
    31990000,
    33990000,
    8,
    '{"cpu": "Snapdragon 8 Elite", "ram": "12GB", "storage": "256GB", "camera": "200MP + 50MP + 10MP + 10MP", "battery": "5000mAh", "screen": "6.9 inch Dynamic AMOLED 120Hz", "os": "Android 15"}',
    ARRAY['S Pen tích hợp', 'AI Galaxy', 'Zoom 100x', 'Titanium Frame', '45W Fast Charge'],
    12,
    'https://mobilecity.vn/images/s25-ultra.jpg'
),
(
    'Samsung Galaxy A55 5G 256GB',
    'Samsung',
    10990000,
    11990000,
    25,
    '{"cpu": "Exynos 1480", "ram": "8GB", "storage": "256GB", "camera": "50MP + 12MP + 5MP", "battery": "5000mAh", "screen": "6.6 inch Super AMOLED 120Hz", "os": "Android 14"}',
    ARRAY['5G', 'IP67 chống nước', 'OIS chống rung', '25W Fast Charge', 'Gorilla Glass Victus+'],
    12,
    'https://mobilecity.vn/images/a55.jpg'
),
(
    'OPPO Reno 12 Pro 256GB',
    'OPPO',
    13490000,
    14990000,
    18,
    '{"cpu": "MediaTek Dimensity 7300 Energy", "ram": "12GB", "storage": "256GB", "camera": "50MP + 8MP + 50MP", "battery": "5000mAh", "screen": "6.7 inch AMOLED 120Hz", "os": "Android 14"}',
    ARRAY['AI Portrait', 'Satellite messaging', '80W SuperVOOC', 'Vegan leather', 'IP65'],
    12,
    'https://mobilecity.vn/images/reno12pro.jpg'
),
(
    'Xiaomi 14T Pro 512GB',
    'Xiaomi',
    14990000,
    16490000,
    12,
    '{"cpu": "MediaTek Dimensity 9300+", "ram": "12GB", "storage": "512GB", "camera": "50MP Leica + 50MP + 12MP", "battery": "5000mAh", "screen": "6.67 inch AMOLED 144Hz", "os": "Android 14"}',
    ARRAY['Camera Leica', '144Hz ProMotion', '120W HyperCharge', 'IP68', 'Dolby Vision'],
    12,
    'https://mobilecity.vn/images/14t-pro.jpg'
),
(
    'iPhone 15 128GB',
    'Apple',
    22990000,
    24990000,
    20,
    '{"cpu": "A16 Bionic", "ram": "6GB", "storage": "128GB", "camera": "48MP + 12MP", "battery": "3877mAh", "screen": "6.1 inch Super Retina XDR OLED", "os": "iOS 17"}',
    ARRAY['Dynamic Island', 'USB-C', 'Face ID', 'MagSafe', 'Emergency SOS'],
    12,
    'https://mobilecity.vn/images/iphone15.jpg'
);

-- Sample orders
INSERT INTO orders (order_code, product_id, customer_name, customer_phone, customer_address, payment_method, status, session_id) VALUES
('DH20260409001', 1, 'Nguyễn Văn An', '0901234567', '123 Nguyễn Trãi, Hà Nội', 'COD', 'confirmed', 'sess_abc123'),
('DH20260409002', 3, 'Trần Thị Bình', '0912345678', '456 Lê Lợi, TP.HCM', 'transfer', 'pending', 'sess_def456'),
('DH20260409003', 2, 'Lê Minh Châu', '0923456789', '789 Hai Bà Trưng, Đà Nẵng', 'COD', 'delivered', 'sess_ghi789'),
('DH20260409004', 5, 'Phạm Hồng Đức', '0934567890', '321 Đinh Tiên Hoàng, Hà Nội', 'COD', 'pending', 'sess_jkl012');

-- Sample conversations
INSERT INTO conversations (session_id, sender, message, intent, confidence) VALUES
('sess_abc123', 'user', 'Cho tôi xem điện thoại dưới 15 triệu chụp ảnh đẹp', 'tu_van_san_pham', 0.95),
('sess_abc123', 'bot', 'Dựa trên nhu cầu của bạn, đây là 3 gợi ý phù hợp nhất...', NULL, NULL),
('sess_abc123', 'user', 'Tôi muốn đặt Samsung Galaxy A55', 'dat_hang', 0.92),
('sess_def456', 'user', 'So sánh iPhone 16 và Samsung S25', 'so_sanh_san_pham', 0.97),
('sess_def456', 'bot', 'Đây là bảng so sánh chi tiết...', NULL, NULL),
('sess_ghi789', 'user', 'Cho gặp nhân viên tư vấn', 'yeu_cau_gap_nv', 0.98),
('sess_ghi789', 'bot', 'Đang kết nối với nhân viên MobileCity...', NULL, NULL);

-- Sample handoff requests
INSERT INTO handoff_requests (session_id, customer_name, customer_phone, trigger_reason, fallback_count, status, assigned_staff) VALUES
('sess_ghi789', 'Lê Minh Châu', '0923456789', 'manual', 0, 'resolved', 'Nguyễn Tuấn - Sales'),
('sess_xyz999', 'Hoàng Văn Em', '0945678901', 'fallback', 3, 'pending', NULL),
('sess_uvw888', 'Vũ Thị Phương', '0956789012', 'out_of_scope', 1, 'assigned', 'Trần Minh - Sales');
