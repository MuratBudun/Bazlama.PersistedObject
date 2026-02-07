# PersistedObject - Example Project

**Complete example demonstrating PersistedObject with advanced features.**

## What This Example Demonstrates

### Core Features
- **Router Factory** - 10 CRUD endpoints per model in 1 line of code
- **Multiple Column Types** - Boolean, Integer, DateTime, String (not just String!)
- **Automatic Timestamps** - `created_at` and `updated_at` on every table
- **Composite Unique Constraints** - Multi-field uniqueness (e.g., `first_name,last_name`)
- **Table Caching** - Optimized table creation
- **Database Optimizations** - MySQL (InnoDB), SQLite, PostgreSQL, MSSQL ready

### Models Included
1. **AppSettings** - Simple key-value store
2. **Category** - Boolean and Integer fields
3. **Tag** - Minimal configuration
4. **User** - DateTime field, composite unique constraints
5. **Project** - Complex arrays and nested data
6. **Event** - DateTime field for date-based queries

### Optional Extensions
- **JSON Encryption** - Commented out in User model (requires `cryptography`)

## Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Backend runs on **http://localhost:8000**
- **OpenAPI docs:** http://localhost:8000/docs
- **OpenAPI JSON:** http://localhost:8000/openapi.json

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Project Structure

```
example/
├── backend/
│   ├── main.py              # FastAPI app with Router Factory
│   ├── models.py            # 6 example models with advanced features
│   ├── database.py          # SQLite setup
│   ├── database.db          # SQLite database (auto-created)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   └── pages/          # CRUD pages for each model
    ├── package.json
    └── vite.config.ts
```

## Example Models Explained

### 1. AppSettings - Simple Key-Value Store
```python
@register_persisted_model
class AppSettings(PersistedObject):
    __table_name__ = "app_settings"
    __primary_key__ = "key"
    __indexed_fields__ = ["key", "category"]
    
    key: str = KeyField(description="Setting key")
    value: str = StandardField(description="Setting value")
    category: str = KeyField(default="general", description="Category")
```

### 2. Category - Multiple Column Types
```python
@register_persisted_model
class Category(PersistedObject):
    __table_name__ = "categories"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "is_active", "sort_order"]
    __unique_fields__ = ["slug"]
    
    id: str = KeyField()
    slug: str = KeyField()
    title: str = TitleField()
    is_active: bool = True      # -> Boolean column
    sort_order: int = 0          # -> Integer column
```

**Database columns created:**
- `id` - String(200)
- `slug` - String(200), UNIQUE
- `is_active` - **Boolean**
- `sort_order` - **Integer**
- `json_data` - Text
- `created_at` - **DateTime** (auto)
- `updated_at` - **DateTime** (auto)

### 3. User - DateTime and Composite Unique
```python
@register_persisted_model
class User(PersistedObject):
    __table_name__ = "users"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "email", "username", "last_login"]
    __unique_fields__ = ["email", "username"]  # Both unique
    
    id: str = IDField()
    email: str = KeyField()
    username: str = KeyField()
    last_login: Optional[datetime] = None  # -> DateTime column
    is_active: bool = True                 # -> Boolean column
```

**Special features:**
- `last_login` is a **DateTime** column → efficient date queries
- Automatic `created_at` and `updated_at` timestamps
- Both `email` and `username` are unique

### 4. Event - DateTime for Date-Based Queries
```python
@register_persisted_model
class Event(PersistedObject):
    __table_name__ = "events"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "event_date", "is_published", "priority"]
    
    event_date: datetime = StandardField(default_factory=datetime.now)
    is_published: bool = False
    priority: int = 0  # 0=low, 1=medium, 2=high
```

**Why DateTime column matters:**
```python
# Efficient date range queries
events = store.list(db, 
    filters={"event_date": ">=2024-01-01"},
    order_by="-event_date"
)
```

## Router Factory Power

**Before** (manual endpoints):
```python
@app.get("/api/categories")
def list_categories(...): pass

@app.get("/api/categories/{id}")
def get_category(...): pass

@app.post("/api/categories")
def create_category(...): pass

# ... 7 more endpoints
```

**After** (Router Factory):
```python
app.include_router(
    create_crud_router(
        model=Category,
        store=Store(Category),
        prefix="/api/categories",
        get_db=get_db
    )
)
# 10 endpoints created automatically!
```

## Inspect the Database

```bash
cd backend
sqlite3 database.db

# Show tables
.tables

# Check Category table structure
.schema categories

# You'll see:
# - is_active BOOLEAN
# - sort_order INTEGER
# - created_at DATETIME
# - updated_at DATETIME
```

## Test the API

```bash
# Create a category
curl -X POST http://localhost:8000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tech",
    "slug": "technology",
    "title": "Technology",
    "is_active": true,
    "sort_order": 1
  }'

# List categories (returns created_at and updated_at!)
curl http://localhost:8000/api/categories

# Update category (updated_at changes automatically!)
curl -X PUT http://localhost:8000/api/categories/tech \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tech",
    "slug": "technology",
    "title": "Technology & Science",
    "is_active": true,
    "sort_order": 1
  }'
```

## Optional: Enable Encryption

```python
# In models.py, uncomment:
class User(PersistedObject):
    # __encrypt_json__ = True  ← Uncomment this

# Install cryptography
pip install cryptography

# Set environment variables
export PERSISTED_OBJECT_ENCRYPTION_KEY="your-secret-key"
export PERSISTED_OBJECT_ENCRYPTION_SALT="your-salt"

# Run server
python main.py
```

## Learning Points

1. **Router Factory** eliminates boilerplate - 10 endpoints in 1 line
2. **Type Safety** - Boolean, Integer, DateTime map to proper DB columns
3. **Automatic Timestamps** - Every table gets created_at/updated_at
4. **Composite Unique** - Multi-field uniqueness support
5. **Optional Encryption** - Secure sensitive data at rest
6. **Zero Config** - No manual SQL, no migrations, just models

## Next Steps

- Check out the frontend code for React integration
- Try adding hooks (before_create, after_update, etc.)
- Add custom permissions (CrudPermissions class)
- Enable encryption for sensitive models
- Explore the generated OpenAPI schema at `/docs`

## License

MIT
