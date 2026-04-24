# HỆ THỐNG QUẢN LÝ NÔNG SẢN

Hệ thống quản lý và bán nông sản trực tuyến với đầy đủ tính năng quản lý kho, đơn hàng, và thanh toán.

## 🚀 Công nghệ sử dụng

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **JWT** - Authentication
- **OAuth 2.0** - Google/Facebook login

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Zustand** - State management

## 📋 Yêu cầu hệ thống

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Clone project

```bash
git clone <repository-url>
cd MNM_project
```

### 2. Cài đặt Database

#### Tạo database PostgreSQL:

```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE nong_san_db;

# Thoát
\q
```

#### Import schema:

```bash
psql -U postgres -d nong_san_db -f database-schema.sql
```

### 3. Cài đặt Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env từ .env.example
cp .env.example .env

# Chỉnh sửa file .env với thông tin database của bạn
# DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost/nong_san_db
```

### 4. Cài đặt Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
cp .env.example .env

# File .env sẽ có:
# VITE_API_URL=http://localhost:8000/api/v1
```

## ▶️ Chạy ứng dụng

### Chạy Backend

```bash
cd backend
python run.py
```

Backend sẽ chạy tại: http://localhost:8000

API Documentation: http://localhost:8000/docs

### Chạy Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## 👤 Tài khoản mặc định

Sau khi import database, bạn có thể đăng ký tài khoản mới hoặc tạo tài khoản admin thủ công:

```sql
-- Tạo tài khoản admin (password: admin123)
INSERT INTO users (email, password_hash, full_name, role_id, oauth_provider, is_active, email_verified)
VALUES (
    'admin@nongsan.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7Iq',
    'Admin',
    1,
    'local',
    true,
    true
);
```

## 📁 Cấu trúc project

```
MNM_project/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Security, RBAC
│   │   ├── db/           # Database config
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic schemas
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Context providers
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── routes/       # Route config
│   ├── package.json
│   └── .env.example
└── database-schema.sql   # Database schema
```

## 🔑 Tính năng chính

### Khách hàng
- ✅ Đăng ký/Đăng nhập (Local + OAuth Google/Facebook)
- ✅ Xem danh sách sản phẩm nông sản
- ✅ Tìm kiếm, lọc sản phẩm theo danh mục, mùa vụ
- ✅ Thêm vào giỏ hàng
- ✅ Đặt hàng và thanh toán
- ✅ Xem lịch sử đơn hàng
- ✅ Yêu cầu hủy đơn hàng
- ✅ Đánh giá sản phẩm

### Admin
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý danh mục
- ✅ Quản lý kho hàng (inventory)
- ✅ Quản lý đơn hàng
- ✅ Xử lý yêu cầu hủy đơn
- ✅ Quản lý người dùng
- ✅ Dashboard thống kê

## 📊 Database Schema

Xem chi tiết trong file `database-schema.sql`

Các bảng chính:
- `users` - Người dùng
- `products` - Sản phẩm
- `categories` - Danh mục
- `inventory` - Tồn kho
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `cart_items` - Giỏ hàng
- `reviews` - Đánh giá

## 🔐 Bảo mật

- JWT token authentication
- Password hashing với bcrypt
- CORS configuration
- Role-based access control (RBAC)
- SQL injection prevention với SQLAlchemy ORM

## 📝 API Documentation

Sau khi chạy backend, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🐛 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows:
pg_ctl status

# Kiểm tra thông tin kết nối trong .env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost/nong_san_db
```

### Lỗi import module Python
```bash
# Đảm bảo đã kích hoạt virtual environment
cd backend
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Lỗi CORS
```bash
# Kiểm tra CORS_ORIGINS trong backend/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📞 Liên hệ

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ qua email.

## 📄 License

MIT License
