# Backend - Nông Sản Management API

FastAPI backend for Agricultural Product Management System.

## Setup

### 1. Create virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Setup database

```bash
# Create database
createdb nong_san_db

# Run migrations (if using Alembic)
alembic upgrade head
```

### 5. Run server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python
python -m app.main
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   ├── core/             # Core functionality
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── external/         # External services
│   ├── db/               # Database
│   ├── middleware/       # Middleware
│   ├── utils/            # Utilities
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── tests/                # Tests
├── requirements.txt      # Dependencies
└── .env.example          # Environment template
```

## Testing

```bash
pytest tests/ -v
```

## Technologies

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT
- OAuth 2.0
