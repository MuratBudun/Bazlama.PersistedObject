# bazlama-persisted-object

**Zero-boilerplate CRUD operations for FastAPI applications.**

## Installation

```bash
pip install bazlama-persisted-object

# Optional: For encryption support
pip install bazlama-persisted-object[encryption]
# or
pip install cryptography
```

## Quick Start

### 1. Define Your Model

```python
from persisted_object import (
    PersistedObject, 
    register_persisted_model,
    KeyField, 
    TitleField, 
    DescriptionField
)

@register_persisted_model
class Category(PersistedObject):
    __table_name__ = "categories"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug"]
    __unique_fields__ = ["slug"]  # Unique constraint
    
    id: str = KeyField(description="Category ID")
    slug: str = KeyField(description="URL slug")
    title: str = TitleField(description="Category title")
    description: str = DescriptionField(description="Full description")
    is_active: bool = True  # Boolean field - properly typed in DB
```

### 2. Create Router

```python
from persisted_object import create_crud_router, Store
from fastapi import FastAPI

app = FastAPI()
store = Store(Category, db_session)

# This one line creates 10 CRUD endpoints!
router = create_crud_router(
    model=Category,
    store=store,
    prefix="/api/categories"
)
app.include_router(router)
```

### 3. Automatic Endpoints

The Router Factory generates these endpoints automatically:

- `GET /api/categories` - List with pagination & filtering
- `GET /api/categories/{id}` - Get single item
- `POST /api/categories` - Create new item
- `PUT /api/categories/{id}` - Update item
- `DELETE /api/categories/{id}` - Delete item
- `GET /api/categories/schema` - Get JSON Schema
- `GET /api/categories/schema/create` - Get create form schema
- `GET /api/categories/schema/edit` - Get edit form schema
- `POST /api/categories/export` - Export data
- `POST /api/categories/import` - Import data

## Core Concepts

### PersistedObject Base Class

All models inherit from `PersistedObject`:

```python
class MyModel(PersistedObject):
    __table_name__ = "my_table"           # Required
    __primary_key__ = "id"                 # Required
    __indexed_fields__ = ["slug", "name"]  # Optional (will be indexed for fast queries)
    __unique_fields__ = ["email"]          # Optional (unique constraints)
    __encrypt_json__ = False               # Optional (requires cryptography package)
```

### Multiple Column Types

The module supports proper column types:

```python
from datetime import datetime

@register_persisted_model
class Event(PersistedObject):
    __table_name__ = "events"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "is_published", "event_date", "priority"]
    
    id: str = KeyField()
    is_published: bool = False      # -> Boolean column
    event_date: datetime = None     # -> DateTime column
    priority: int = 0               # -> Integer column
    title: str = TitleField()       # -> String(400) column
```

### Composite Unique Constraints

Support for multi-field unique constraints:

```python
@register_persisted_model
class Person(PersistedObject):
    __table_name__ = "persons"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "first_name", "last_name", "email"]
    __unique_fields__ = [
        "email",                    # Single field unique
        "first_name,last_name"      # Composite unique constraint
    ]
    
    id: str = KeyField()
    first_name: str = KeyField()
    last_name: str = KeyField()
    email: str = KeyField()
```

### Automatic Timestamps

All tables automatically get timestamp columns with underscore prefix (indicating auto-managed fields):

```python
# Every PersistedObject table has:
# - _created_at: DateTime (auto-set on insert)
# - _updated_at: DateTime (auto-updated on change)

from datetime import datetime
from typing import Optional

class MyModel(PersistedObject):
    # Automatically inherited from PersistedObject:
    _created_at: Optional[datetime] = None
    _updated_at: Optional[datetime] = None
    
    # Your fields:
    id: str = KeyField()
    title: str = TitleField()

# Query with timestamps:
result = store.filter(
    db,
    where=MyModel._created_at > datetime(2024, 1, 1),
    order_by="-_created_at"  # Newest first
)

# Access in API responses:
item = store.get(db, "some-id")
print(item._created_at)  # 2024-02-05 10:30:00
print(item._updated_at)  # 2024-02-06 15:45:00
```

The underscore prefix (`_`) indicates these are automatically managed fields. Do not override them in subclasses.

### JSON Encryption

Encrypt sensitive data at rest (requires the `cryptography` package):

```bash
# Install encryption support
pip install cryptography
```

```python
import os

# Set environment variables
os.environ['PERSISTED_OBJECT_ENCRYPTION_KEY'] = 'your-secret-key'
os.environ['PERSISTED_OBJECT_ENCRYPTION_SALT'] = 'your-salt'

@register_persisted_model
class Secret(PersistedObject):
    __table_name__ = "secrets"
    __primary_key__ = "id"
    __indexed_fields__ = ["id"]
    __encrypt_json__ = True  # JSON column will be encrypted
    
    id: str = KeyField()
    api_key: str = PasswordField()
    credentials: dict = {}
```

Features:
- Fernet symmetric encryption
- PBKDF2 key derivation (100,000 iterations)
- Backward compatible decryption
- Base64 encoding

### Database Optimizations

Built-in optimizations for multiple databases:

```python
# Automatically configures:
# - MySQL: InnoDB engine, utf8mb4 charset
# - SQLite: autoincrement, foreign keys enabled
# - PostgreSQL: compatible
# - MSSQL: NTEXT support for Unicode
```

### Field Helpers

Semantic field definitions with automatic constraints:

```python
from persisted_object import (
    KeyField,          # max_length=200, for IDs and keys
    TitleField,        # max_length=400, for titles
    DescriptionField,  # max_length=800, for descriptions
    PasswordField,     # auto UI masking
    StandardField,     # generic field
)

class User(PersistedObject):
    username: str = KeyField(description="Unique username")
    display_name: str = TitleField(description="Display name")
    bio: str = DescriptionField(description="User bio")
    password: str = PasswordField(description="Hashed password")
    role: str = StandardField(description="User role")
```

### Custom UI Components

Tell the frontend which component to use:

```python
from typing import List

class PipeConfig(PersistedObject):
    # Frontend will render custom "ActionConfigList" component
    actions: List[ActionConfig] = StandardField(
        default_factory=list,
        json_schema_extra={"ui_component": "ActionConfigList"}
    )
```

### Lifecycle Hooks

Add custom logic to CRUD operations:

```python
from persisted_object import CrudHooks

class CategoryHooks(CrudHooks):
    async def before_create(self, data: dict) -> dict:
        # Auto-generate slug from title
        data["slug"] = data["title"].lower().replace(" ", "-")
        return data
    
    async def after_delete(self, id: str) -> None:
        # Clean up related data
        await cleanup_category_references(id)

router = create_crud_router(
    model=Category,
    store=store,
    prefix="/api/categories",
    hooks=CategoryHooks()
)
```

## API Reference

### `create_crud_router()`

```python
def create_crud_router(
    model: Type[PersistedObject],
    store: Store,
    prefix: str,
    tags: List[str] = None,
    hooks: CrudHooks = None,
    permissions: CrudPermissions = None,
) -> APIRouter:
    """
    Create a FastAPI router with all CRUD endpoints.
    
    Args:
        model: PersistedObject subclass
        store: Store instance for database operations
        prefix: API endpoint prefix (e.g., "/api/categories")
        tags: OpenAPI tags (defaults to [model.__name__])
        hooks: Lifecycle hooks for before/after operations
        permissions: Permission checks for each operation
    
    Returns:
        APIRouter with 10 CRUD endpoints
    """
```

### `Store` Class

The Store class provides both simple and advanced querying methods.

#### Basic Methods

```python
class Store:
    # Simple CRUD operations
    def create(self, db: Session, obj: ModelType) -> ModelType
    def get(self, db: Session, id_value: Any) -> Optional[ModelType]
    def update(self, db: Session, obj: ModelType) -> ModelType
    def delete(self, db: Session, id_value: Any) -> bool
    def get_all(self, db: Session) -> List[ModelType]
    
    # Simple list with dict-based filters
    def list(
        self,
        db: Session,
        filters: dict = None,
        skip: int = 0,
        limit: int = 100,
        order_by: str = None,
        search: str = None
    ) -> tuple[list[ModelType], int]
```

#### Advanced Filtering with SQLAlchemy Expressions

The `filter()` method provides advanced querying with SQLAlchemy expressions:

```python
from persisted_object import Store, StoreFilterResult
from sqlalchemy import and_, or_

store = Store(Category)

# Simple filter
result = store.filter(
    db,
    where=Category.is_active == True,
    order_by="title",
    skip=0,
    limit=20
)

# Multiple conditions with AND
result = store.filter(
    db,
    where=[
        Category.is_active == True,
        Category.slug.like("%tech%")
    ],
    order_by=["-_created_at", "title"],  # Sort by created desc, then title asc
    skip=0,
    limit=20
)

# Return models vs dictionaries
result = store.filter(
    db,
    where=Category.is_active == True,
    use_model_output=True  # Returns Pydantic models (default: False = dicts)
)

# Skip total count query for performance
result = store.filter(
    db,
    where=Category.priority > 5,
    disable_total_query=True  # Faster when you don't need total count
)

# Result structure
assert isinstance(result, StoreFilterResult)
print(result.items)     # List of items (models or dicts)
print(result.total)     # Total count (0 if disable_total_query=True)
print(result.skip)      # Pagination offset
print(result.limit)     # Max items requested  
print(result.fetch)     # Actual items returned
```

#### Filter Parameters

```python
def filter(
    self,
    db: Session,
    *,
    skip: int = 0,                    # Pagination offset
    limit: Optional[int] = 10,        # Max items (None = unlimited)
    where: Optional[...] = None,      # SQLAlchemy conditions
    order_by: Optional[...] = None,   # Sort criteria
    use_model_output: bool = False,   # True = models, False = dicts
    disable_total_query: bool = False # True = skip count query
) -> StoreFilterResult
```

**WHERE conditions:**
- Single expression: `Category.is_active == True`
- List of expressions (AND): `[Category.is_active == True, Category.priority > 5]`
- Complex SQLAlchemy: `and_(Category.is_active, or_(...))`

**ORDER BY options:**
- String: `"title"` (ascending) or `"-title"` (descending)
- List: `["-_created_at", "title"]` (multiple sort)
- SQLAlchemy: `Category.title.desc()`

**Performance Tips:**
- Use `use_model_output=False` (default) for API responses - returns dicts directly
- Use `disable_total_query=True` when you don't need total count (faster)
- Use indexed fields in WHERE conditions for best performance

## Advanced Usage

### Custom Filtering

```python
# Frontend can send filters as query params
# GET /api/categories?category=tech&status=active

# Backend automatically applies filters
results = await store.list(
    filters={"category": "tech", "status": "active"},
    skip=0,
    limit=20
)
```

### Permission System

```python
from persisted_object import CrudPermissions

class AdminOnlyPermissions(CrudPermissions):
    async def can_create(self, user) -> bool:
        return user.role == "admin"
    
    async def can_delete(self, user, id: str) -> bool:
        return user.role == "admin"

router = create_crud_router(
    model=Category,
    store=store,
    prefix="/api/categories",
    permissions=AdminOnlyPermissions()
)
```

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Type checking
mypy src/

# Linting
ruff check src/
```

## License

MIT
