-- =====================================================
-- DỮ LIỆU MẪU CHO HỆ THỐNG QUẢN LÝ NÔNG SẢN
-- Chạy sau khi đã import database-schema.sql
-- =====================================================

-- =====================================================
-- 1. TẠO TÀI KHOẢN MẪU
-- =====================================================

-- Admin account (email: admin@nongsan.com, password: admin123)
INSERT INTO users (email, password_hash, full_name, phone, role_id, oauth_provider, is_active, email_verified)
VALUES (
    'admin@nongsan.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq',
    'Quản trị viên',
    '0901234567',
    1,
    'local',
    true,
    true
);

-- Customer accounts (password: customer123)
INSERT INTO users (email, password_hash, full_name, phone, role_id, oauth_provider, is_active, email_verified)
VALUES 
    ('customer1@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq', 'Nguyễn Văn A', '0912345678', 2, 'local', true, true),
    ('customer2@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq', 'Trần Thị B', '0923456789', 2, 'local', true, true);

-- =====================================================
-- 2. TẠO DANH MỤC SẢN PHẨM
-- =====================================================

INSERT INTO categories (category_name, description, is_active) VALUES
    ('Rau củ quả', 'Các loại rau, củ, quả tươi sạch', true),
    ('Trái cây', 'Trái cây tươi các loại', true),
    ('Ngũ cốc', 'Gạo, ngô, lúa mì và các loại ngũ cốc', true),
    ('Gia vị', 'Các loại gia vị, rau thơm', true);

-- =====================================================
-- 3. TẠO KHO HÀNG
-- =====================================================

INSERT INTO warehouses (warehouse_name, location, is_active)
VALUES 
    ('Kho Hà Nội', 'Số 123, Đường ABC, Hà Nội', true),
    ('Kho TP.HCM', 'Số 456, Đường XYZ, TP.HCM', true);

-- =====================================================
-- 4. TẠO SẢN PHẨM MẪU
-- =====================================================

-- Rau củ quả
INSERT INTO products (product_name, category_id, season_id, description, unit, price, discount_percent, origin, shelf_life_days, storage_instructions, is_active)
VALUES
    ('Cà chua Đà Lạt', 1, 5, 'Cà chua tươi từ Đà Lạt, giàu vitamin C', 'kg', 25000, 0, 'Đà Lạt, Lâm Đồng', 7, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Rau muống', 1, 5, 'Rau muống tươi, sạch', 'bó', 8000, 0, 'Đồng bằng sông Cửu Long', 3, 'Bảo quản trong ngăn mát tủ lạnh', true),
    ('Khoai tây Đà Lạt', 1, 5, 'Khoai tây Đà Lạt chất lượng cao', 'kg', 30000, 10, 'Đà Lạt, Lâm Đồng', 30, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Cải thảo', 1, 4, 'Cải thảo tươi ngon', 'kg', 15000, 0, 'Đà Lạt, Lâm Đồng', 5, 'Bảo quản trong ngăn mát tủ lạnh', true);

-- Trái cây
INSERT INTO products (product_name, category_id, season_id, description, unit, price, discount_percent, origin, shelf_life_days, storage_instructions, is_active)
VALUES
    ('Xoài cát Hòa Lộc', 2, 2, 'Xoài cát Hòa Lộc ngọt thơm', 'kg', 80000, 5, 'Tiền Giang', 7, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Cam sành', 2, 4, 'Cam sành tươi ngon, giàu vitamin C', 'kg', 35000, 0, 'Hà Giang', 14, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Thanh long ruột đỏ', 2, 5, 'Thanh long ruột đỏ Bình Thuận', 'kg', 28000, 0, 'Bình Thuận', 10, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Dưa hấu', 2, 2, 'Dưa hấu ngọt mát', 'quả', 45000, 0, 'Gia Lai', 7, 'Bảo quản nơi mát', true);

-- Ngũ cốc
INSERT INTO products (product_name, category_id, season_id, description, unit, price, discount_percent, origin, shelf_life_days, storage_instructions, is_active)
VALUES
    ('Gạo ST25', 3, 5, 'Gạo ST25 thơm ngon, đạt giải thưởng quốc tế', 'kg', 45000, 0, 'Sóc Trăng', 365, 'Bảo quản nơi khô ráo, tránh ẩm mốc', true),
    ('Gạo Jasmine', 3, 5, 'Gạo thơm Jasmine cao cấp', 'kg', 35000, 5, 'An Giang', 365, 'Bảo quản nơi khô ráo, tránh ẩm mốc', true);

-- Gia vị
INSERT INTO products (product_name, category_id, season_id, description, unit, price, discount_percent, origin, shelf_life_days, storage_instructions, is_active)
VALUES
    ('Tỏi', 4, 5, 'Tỏi tươi chất lượng cao', 'kg', 60000, 0, 'Lý Sơn, Quảng Ngãi', 60, 'Bảo quản nơi khô ráo, thoáng mát', true),
    ('Ớt hiểm', 4, 5, 'Ớt hiểm cay nồng', 'kg', 120000, 0, 'Tây Nguyên', 30, 'Bảo quản nơi khô ráo, thoáng mát', true);

-- =====================================================
-- 5. TẠO TỒN KHO
-- =====================================================

-- Lấy product_id và warehouse_id để insert inventory
INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 1000, 0, 'BATCH-2024-001', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days'
FROM products p WHERE p.product_name = 'Cà chua Đà Lạt';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 500, 0, 'BATCH-2024-002', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days'
FROM products p WHERE p.product_name = 'Rau muống';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 800, 0, 'BATCH-2024-003', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '50 days'
FROM products p WHERE p.product_name = 'Khoai tây Đà Lạt';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 300, 0, 'BATCH-2024-004', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '10 days'
FROM products p WHERE p.product_name = 'Cải thảo';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 2, 600, 0, 'BATCH-2024-005', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days'
FROM products p WHERE p.product_name = 'Xoài cát Hòa Lộc';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 2, 400, 0, 'BATCH-2024-006', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '20 days'
FROM products p WHERE p.product_name = 'Cam sành';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 2, 700, 0, 'BATCH-2024-007', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '12 days'
FROM products p WHERE p.product_name = 'Thanh long ruột đỏ';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 2, 200, 0, 'BATCH-2024-008', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '8 days'
FROM products p WHERE p.product_name = 'Dưa hấu';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 5000, 0, 'BATCH-2024-009', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days'
FROM products p WHERE p.product_name = 'Gạo ST25';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 3000, 0, 'BATCH-2024-010', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '345 days'
FROM products p WHERE p.product_name = 'Gạo Jasmine';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 500, 0, 'BATCH-2024-011', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days'
FROM products p WHERE p.product_name = 'Tỏi';

INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, batch_number, harvest_date, expiry_date)
SELECT p.product_id, 1, 300, 0, 'BATCH-2024-012', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '40 days'
FROM products p WHERE p.product_name = 'Ớt hiểm';

-- =====================================================
-- KẾT THÚC SEED DATA
-- =====================================================

-- Kiểm tra dữ liệu đã insert
SELECT 'Users created:' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Categories created:', COUNT(*) FROM categories
UNION ALL
SELECT 'Products created:', COUNT(*) FROM products
UNION ALL
SELECT 'Warehouses created:', COUNT(*) FROM warehouses
UNION ALL
SELECT 'Inventory records:', COUNT(*) FROM inventory;
