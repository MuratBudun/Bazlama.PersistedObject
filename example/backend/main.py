"""
Example FastAPI application using Router Factory.

This demonstrates how the Router Factory eliminates boilerplate.
Now with advanced features: Boolean, Integer, DateTime columns and more!
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from persisted_object import Store, create_crud_router
from src.database import get_db, create_tables
from src.models import AppSettings, Category, Tag, User, Project, Event, ApiKey, BlogPost

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded environment variables from {env_path}")
else:
    print(f"No .env file found at {env_path}, using system environment variables")

# Create FastAPI app
app = FastAPI(
    title="PersistedObject Example API (Router Factory)",
    description="Zero-boilerplate CRUD with advanced features",
    version="0.2.0"
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create stores
settings_store = Store(AppSettings)
category_store = Store(Category)
tag_store = Store(Tag)
user_store = Store(User)
project_store = Store(Project)  
event_store = Store(Event)
apikey_store = Store(ApiKey)
blogpost_store = Store(BlogPost)


# ==================== Startup Event ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    await create_tables()
    print("\n✅ Database initialized with advanced features:")
    print("   - Multiple column types (Boolean, Integer, DateTime)")
    print("   - Automatic timestamps (created_at, updated_at)")
    print("   - Composite unique constraints")
    print("   - Optional JSON encryption (ApiKey model)")
    print("   - Table caching for performance")


# ==================== ROUTER FACTORY - THE MAGIC! ====================
# Each model gets 10 endpoints in 3 lines of code!

# Settings endpoints
settings_router = create_crud_router(
    model=AppSettings,
    store=settings_store,
    prefix="/api/settings",
    tags=["Settings"],
    get_db=get_db
)
app.include_router(settings_router)

# Category endpoints - with Boolean and Integer columns
category_router = create_crud_router(
    model=Category,
    store=category_store,
    prefix="/api/categories",
    tags=["Categories"],
    get_db=get_db
)
app.include_router(category_router)

# Tag endpoints
tag_router = create_crud_router(
    model=Tag,
    store=tag_store,
    prefix="/api/tags",
    tags=["Tags"],
    get_db=get_db
)
app.include_router(tag_router)

# User endpoints - with DateTime and composite unique constraints
user_router = create_crud_router(
    model=User,
    store=user_store,
    prefix="/api/users",
    tags=["Users"],
    get_db=get_db
)
app.include_router(user_router)

# Project endpoints - with complex arrays
project_router = create_crud_router(
    model=Project,
    store=project_store,
    prefix="/api/projects",
    tags=["Projects"],
    get_db=get_db
)
app.include_router(project_router)

# Event endpoints - with DateTime for date-based queries
event_router = create_crud_router(
    model=Event,
    store=event_store,
    prefix="/api/events",
    tags=["Events"],
    get_db=get_db
)
app.include_router(event_router)

# API Key endpoints - with encrypted JSON storage
apikey_router = create_crud_router(
    model=ApiKey,
    store=apikey_store,
    prefix="/api/apikeys",
    tags=["API Keys"],
    get_db=get_db
)
app.include_router(apikey_router)

# Blog Post endpoints - with rich content arrays
blogpost_router = create_crud_router(
    model=BlogPost,
    store=blogpost_store,
    prefix="/api/blogposts",
    tags=["Blog Posts"],
    get_db=get_db
)
app.include_router(blogpost_router)

# That's it! 24 lines vs 560+ lines of manual endpoints!
# 8 models with 80 endpoints, all zero boilerplate!


# ==================== Root ====================

@app.get("/")
def root():
    """API root endpoint."""
    return {
        "name": "PersistedObject Example API (Router Factory)",
        "version": "0.2.0",
        "docs": "/docs",
        "features": [
            "✅ Router Factory - 10 endpoints per model",
            "✅ Multiple column types (Boolean, Integer, DateTime, String)",
            "✅ Automatic timestamps (created_at, updated_at)",
            "✅ Composite unique constraints",
            "✅ Optional JSON encryption (ApiKey model)"
        ],
        "message": "8 models, 80 endpoints, 24 lines of code!",
        "endpoints": {
            "settings": "/api/settings",
            "categories": "/api/categories",
            "tags": "/api/tags",
            "users": "/api/users",
            "projects": "/api/projects", 
            "events": "/api/events",
            "apikeys": "/api/apikeys",
            "blogposts": "/api/blogposts"
        }
    }


# Debug endpoint to test schema
@app.get("/debug/schema/{model}")
def debug_schema(model: str):
    """Debug: Get model schema."""
    schemas = {
        "settings": AppSettings.model_json_schema(),
        "category": Category.model_json_schema(),
        "tag": Tag.model_json_schema(),
        "user": User.model_json_schema(),
        "project": Project.model_json_schema(),
        "event": Event.model_json_schema(),
        "apikey": ApiKey.model_json_schema(),
        "blogpost": BlogPost.model_json_schema(),
    }
    return schemas.get(model, {"error": "Model not found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
