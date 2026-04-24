-- =====================================================
-- DATABASE SCHEMA: HỆ THỐNG QUẢN LÝ NÔNG SẢN
-- DBMS: PostgreSQL
-- =====================================================

-- Extension để hỗ trợ UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BẢNG QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
-- =====================================================

-- Bảng Roles (Vai trò)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL, -- 'ADMIN', 'CUSTOMER'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Users (Người dùng)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL nếu dùng OAuth
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id INTEGER NOT NULL REFERENCES roles(role_id),
    
    -- Hỗ trợ OAuth (Google, Facebook)
    oauth_provider VARCHAR(50), -- 'google', 'facebook', 'local'
    oauth_id VARCHAR(255), -- ID từ provider
    
    -- API Key cho tích hợp
    api_key VARCHAR(255) UNIQUE,
    api_key_expires_at TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    CONSTRAINT unique_oauth UNIQUE(oauth_provider, oauth_id)
);

-- Bảng Addresses (Địa chỉ giao hàng)
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. BẢNG QUẢN LÝ DANH MỤC & SẢN PHẨM
-- =====================================================

-- Bảng Categories (Danh mục nông sản)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(category_id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Seasons (Mùa vụ)
CREATE TABLE seasons (
    season_id SERIAL PRIMARY KEY,
    season_name VARCHAR(100) NOT NULL, -- 'Xuân', 'Hạ', 'Thu', 'Đông', 'Quanh năm'
    start_month INTEGER CHECK (start_month BETWEEN 1 AND 12),
    end_month INTEGER CHECK (end_month BETWEEN 1 AND 12),
    description TEXT
);

-- Bảng Products (Sản phẩm nông sản)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    season_id INTEGER REFERENCES seasons(season_id),
    
    description TEXT,
    unit VARCHAR(50) NOT NULL, -- 'kg', 'tấn', 'bó', 'quả'
    
    -- Giá bán
    price DECIMAL(15, 2) NOT NULL CHECK (price >= 0),
    discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    
    -- Thông tin đặc thù nông sản
    origin VARCHAR(255), -- Nguồn gốc (tỉnh/vùng)
    shelf_life_days INTEGER, -- Hạn sử dụng (số ngày)
    storage_instructions TEXT, -- Hướng dẫn bảo quản
    
    -- Hình ảnh
    thumbnail_url VARCHAR(500),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- Bảng Product Images (Nhiều ảnh cho 1 sản phẩm)
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. BẢNG QUẢN LÝ KHO
-- =====================================================

-- Bảng Warehouses (Kho)
CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    manager_id UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Inventory (Tồn kho)
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(warehouse_id),
    
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity DECIMAL(15, 3) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity DECIMAL(15, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Thông tin lô hàng
    batch_number VARCHAR(100),
    harvest_date DATE, -- Ngày thu hoạch
    expiry_date DATE, -- Ngày hết hạn
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_product_warehouse_batch UNIQUE(product_id, warehouse_id, batch_number)
);

-- Bảng Stock Transactions (Lịch sử nhập/xuất kho)
CREATE TABLE stock_transactions (
    transaction_id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL REFERENCES inventory(inventory_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'IN' (nhập), 'OUT' (xuất), 'ADJUST' (điều chỉnh)
    
    quantity DECIMAL(15, 3) NOT NULL,
    unit_cost DECIMAL(15, 2), -- Giá nhập (nếu là nhập kho)
    
    reference_type VARCHAR(50), -- 'PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'MANUAL'
    reference_id INTEGER, -- ID của đơn hàng/phiếu liên quan
    
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. BẢNG QUẢN LÝ ĐỚN HÀNG
-- =====================================================

-- Bảng Orders (Đơn hàng)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL, -- Mã đơn hàng (DH-20240101-0001)
    customer_id UUID NOT NULL REFERENCES users(user_id),
    
    -- Thông tin giao hàng
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    
    -- Thông tin đơn hàng
    subtotal DECIMAL(15, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(15, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_fee DECIMAL(15, 2) DEFAULT 0 CHECK (shipping_fee >= 0),
    total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount >= 0),
    
    -- Trạng thái
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', 
    -- 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'
    
    payment_method VARCHAR(50), -- 'COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'
    payment_status VARCHAR(50) DEFAULT 'UNPAID', -- 'UNPAID', 'PAID', 'REFUNDED'
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Bảng Order Items (Chi tiết đơn hàng)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    
    product_name VARCHAR(255) NOT NULL, -- Lưu tên tại thời điểm đặt
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL CHECK (unit_price >= 0),
    quantity DECIMAL(15, 3) NOT NULL CHECK (quantity > 0),
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    subtotal DECIMAL(15, 2) NOT NULL CHECK (subtotal >= 0),
    
    inventory_id INTEGER REFERENCES inventory(inventory_id), -- Lô hàng xuất
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Order Status History (Lịch sử trạng thái đơn hàng)
CREATE TABLE order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. BẢNG GIỎ HÀNG
-- =====================================================

-- Bảng Cart (Giỏ hàng)
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity DECIMAL(15, 3) NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_product UNIQUE(user_id, product_id)
);

-- =====================================================
-- 6. BẢNG HỖ TRỢ KHÁC
-- =====================================================

-- Bảng Order Cancellation Requests (Yêu cầu hủy đơn hàng)
CREATE TABLE order_cancellation_requests (
    request_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Reviews (Đánh giá sản phẩm)
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    order_id INTEGER REFERENCES orders(order_id),
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_product_order UNIQUE(user_id, product_id, order_id)
);

-- Bảng System Logs (Nhật ký hệ thống)
CREATE TABLE system_logs (
    log_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'PRODUCT', 'ORDER', 'USER'
    entity_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. INDEXES ĐỂ TỐI ƯU HIỆU NĂNG
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_users_api_key ON users(api_key) WHERE api_key IS NOT NULL;

-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_season ON products(season_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products(product_name);

-- Inventory
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_expiry ON inventory(expiry_date);

-- Orders
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_code ON orders(order_code);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Cart
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- Stock Transactions
CREATE INDEX idx_stock_trans_inventory ON stock_transactions(inventory_id);
CREATE INDEX idx_stock_trans_created ON stock_transactions(created_at);

-- Order Cancellation Requests
CREATE INDEX idx_order_cancellation_requests_order_id ON order_cancellation_requests(order_id);
CREATE INDEX idx_order_cancellation_requests_user_id ON order_cancellation_requests(user_id);
CREATE INDEX idx_order_cancellation_requests_status ON order_cancellation_requests(status);
CREATE INDEX idx_order_cancellation_requests_created_at ON order_cancellation_requests(created_at DESC);

-- =====================================================
-- 8. DỮ LIỆU MẪU (SEED DATA)
-- =====================================================

-- Insert Roles
INSERT INTO roles (role_name, description) VALUES
('ADMIN', 'Quản trị viên - Toàn quyền quản lý hệ thống'),
('CUSTOMER', 'Khách hàng - Xem và đặt mua sản phẩm');

-- Insert Seasons
INSERT INTO seasons (season_name, start_month, end_month, description) VALUES
('Xuân', 1, 3, 'Mùa xuân - Tháng 1 đến tháng 3'),
('Hạ', 4, 6, 'Mùa hạ - Tháng 4 đến tháng 6'),
('Thu', 7, 9, 'Mùa thu - Tháng 7 đến tháng 9'),
('Đông', 10, 12, 'Mùa đông - Tháng 10 đến tháng 12'),
('Quanh năm', NULL, NULL, 'Có sẵn quanh năm');

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers cho các bảng cần updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_cancellation_requests_updated_at BEFORE UPDATE ON order_cancellation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Tự động tạo mã đơn hàng
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_code = 'DH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                     LPAD(NEXTVAL('orders_order_id_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_code_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_code();

-- =====================================================
-- KẾT THÚC SCHEMA
-- =====================================================
