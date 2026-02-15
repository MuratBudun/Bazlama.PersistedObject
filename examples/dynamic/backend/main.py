"""
Dynamic PersistedObject Example - FastAPI Application

This example demonstrates creating PersistedObject models at runtime
through a UI. Models, database tables, and CRUD endpoints are all
created dynamically.
"""

from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from persisted_object import Store, create_crud_router
from src.database import get_db, create_tables, engine
from src.models import ModelDefinition
from src.dynamic_manager import (
    create_dynamic_model,
    create_dynamic_model_from_script,
    extract_model_info_from_script,
    ensure_table_exists,
    get_dynamic_model,
    get_dynamic_store,
    get_all_dynamic_models,
    remove_dynamic_model,
)

# Load environment variables
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# Store for model definitions
definition_store = Store(ModelDefinition)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and restore dynamic models on startup."""
    await create_tables()
    print("\n✅ Database initialized")

    # Restore previously saved model definitions
    async for session in get_db():
        try:
            result = await definition_store.filter_async(db=session, use_model_output=True, limit=None)
            for item in result.items:
                if isinstance(item, dict):
                    defn = item
                else:
                    defn = item.model_dump() if hasattr(item, "model_dump") else dict(item)
                try:
                    # Check if this was created via script (Advanced mode)
                    script = defn.get("script")
                    if script:
                        info = create_dynamic_model_from_script(script)
                    else:
                        info = create_dynamic_model(defn)
                    await ensure_table_exists(defn["name"])
                    _register_dynamic_routes(app, defn["name"])
                    mode = "script" if script else "fields"
                    print(f"   Restored model ({mode}): {defn['name']} -> {info['endpoint']}")
                except Exception as e:
                    print(f"   ⚠️ Failed to restore {defn.get('name', '?')}: {e}")
        except Exception as e:
            print(f"   ⚠️ Could not load saved definitions: {e}")
        break

    print("   Ready!\n")
    yield


# Create FastAPI app
app = FastAPI(
    title="PersistedObject Dynamic Example",
    description="Create and manage PersistedObject models at runtime",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Model Definition CRUD ====================

definition_router = create_crud_router(
    model=ModelDefinition,
    store=definition_store,
    prefix="/api/definitions",
    tags=["Model Definitions"],
    get_db=get_db,
)
app.include_router(definition_router)


# ==================== Dynamic Model Management ====================

def _register_dynamic_routes(app: FastAPI, model_name: str) -> None:
    """Register CRUD routes for a dynamic model."""
    model_cls = get_dynamic_model(model_name)
    store = get_dynamic_store(model_name)
    if not model_cls or not store:
        return

    table_name = model_cls.__table_name__
    prefix = f"/api/dynamic/{table_name}"

    # Check if route already registered
    for route in app.routes:
        if hasattr(route, "path") and route.path.startswith(prefix):
            return

    router = create_crud_router(
        model=model_cls,
        store=store,
        prefix=prefix,
        tags=[model_name],
        get_db=get_db,
    )
    app.include_router(router)


@app.post("/api/models/register", tags=["Dynamic Models"])
async def register_model(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Register a new dynamic model.
    
    Saves the definition, creates the model class, database table, and API routes.
    Returns the created model info including its API endpoint.
    """
    body = await request.json()

    name = body.get("name")
    table_name = body.get("table_name")
    fields = body.get("fields", [])
    description = body.get("description", "")

    if not name or not table_name or not fields:
        raise HTTPException(status_code=400, detail="name, table_name, and fields are required")

    # Check if already exists
    if get_dynamic_model(name):
        raise HTTPException(status_code=409, detail=f"Model '{name}' is already registered")

    # Save definition to database
    definition = ModelDefinition(
        name=name,
        table_name=table_name,
        description=description,
        fields=fields,
    )
    await definition_store.acreate(db, definition)

    # Create dynamic model
    info = create_dynamic_model(body)

    # Create table
    await ensure_table_exists(name)

    # Register routes
    _register_dynamic_routes(app, name)

    return {
        "status": "created",
        **info,
        "message": f"Model '{name}' created with {len(fields)} fields. API available at {info['endpoint']}",
    }


@app.post("/api/models/register-script", tags=["Dynamic Models"])
async def register_model_from_script(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Register a new dynamic model from a Python script (Advanced mode).

    The script should define a class that inherits from PersistedObject.
    Available imports: PersistedObject, Field, KeyField, TitleField,
    DescriptionField, StandardField, ContentField, IDField, Optional,
    List, Dict, Any, datetime.

    ⚠️  Executes user-provided code. Use only in trusted environments.
    """
    body = await request.json()
    script = body.get("script", "").strip()

    if not script:
        raise HTTPException(status_code=400, detail="script is required")

    # Extract model info from script to validate before executing
    try:
        model_info = extract_model_info_from_script(script)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    name = model_info["name"]

    # Check if already exists
    if get_dynamic_model(name):
        raise HTTPException(status_code=409, detail=f"Model '{name}' is already registered")

    # Save definition to database (with script, empty fields)
    definition = ModelDefinition(
        name=name,
        table_name=model_info["table_name"],
        description=model_info.get("description", ""),
        fields=[],
        script=script,
    )
    await definition_store.acreate(db, definition)

    # Create dynamic model from script
    try:
        info = create_dynamic_model_from_script(script)
    except ValueError as e:
        # Rollback the saved definition
        try:
            await definition_store.adelete(db, name)
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=str(e))

    # Create table
    await ensure_table_exists(name)

    # Register routes
    _register_dynamic_routes(app, name)

    return {
        "status": "created",
        **info,
        "mode": "script",
        "message": f"Model '{name}' created from script. API available at {info['endpoint']}",
    }


@app.get("/api/models", tags=["Dynamic Models"])
async def list_models(db: AsyncSession = Depends(get_db)):
    """List all registered dynamic models and their endpoints."""
    result = await definition_store.filter_async(db=db, use_model_output=True, limit=None)
    models = []
    for item in result.items:
        if isinstance(item, dict):
            defn = item
        else:
            defn = item.model_dump() if hasattr(item, "model_dump") else dict(item)
        models.append({
            "name": defn["name"],
            "table_name": defn["table_name"],
            "description": defn.get("description", ""),
            "fields": defn.get("fields", []),
            "script": defn.get("script"),
            "endpoint": f"/api/dynamic/{defn['table_name']}",
            "is_active": get_dynamic_model(defn["name"]) is not None,
        })
    return models


@app.delete("/api/models/{model_name}", tags=["Dynamic Models"])
async def unregister_model(model_name: str, db: AsyncSession = Depends(get_db)):
    """
    Unregister a dynamic model.
    
    Removes the definition and in-memory model/store.
    The database table is NOT dropped (data is preserved).
    """
    # Remove from store
    try:
        await definition_store.adelete(db, model_name)
    except Exception:
        pass

    removed = remove_dynamic_model(model_name)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

    return {"status": "removed", "name": model_name, "message": f"Model '{model_name}' unregistered. Table preserved."}


# ==================== Root ====================

@app.get("/")
def root():
    """API root endpoint."""
    return {
        "name": "PersistedObject Dynamic Example",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "definitions": "/api/definitions",
            "models_list": "/api/models",
            "register_model": "/api/models/register",
            "register_model_script": "/api/models/register-script",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
