"""
Router Factory - Automatic CRUD endpoint generation.

This is the core feature that eliminates boilerplate.
Define a model, create a router in 3 lines!
"""

from typing import Any, Dict, List, Optional, Type, TypeVar, Sequence
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from .base import PersistedObject
from .store import Store, StoreFilterResult
from .hooks import CrudHooks, CrudPermissions
from .exceptions import ModelNotFoundError, DuplicateKeyError

ModelType = TypeVar("ModelType", bound=PersistedObject)


def create_crud_router(
    model: Type[ModelType],
    store: Store[ModelType],
    prefix: str,
    get_db: Any,
    *,
    tags: Optional[Sequence[str]] = None,
    hooks: Optional[CrudHooks] = None,
    permissions: Optional[CrudPermissions] = None
) -> APIRouter:
    """
    Create a FastAPI router with automatic CRUD endpoints.
    
    This is the main Router Factory function that generates 10 CRUD endpoints:
    - GET /            - List items with pagination & filtering
    - GET /{id}        - Get single item by ID
    - POST /           - Create new item
    - PUT /{id}        - Update existing item
    - DELETE /{id}     - Delete item
    - GET /schema      - Get JSON Schema for model
    - GET /schema/create - Get JSON Schema for create form
    - GET /schema/edit   - Get JSON Schema for edit form
    - POST /export     - Export all data
    - POST /import     - Import data
    
    Args:
        model: PersistedObject subclass
        store: Store instance for database operations
        prefix: API endpoint prefix (e.g., "/api/categories")
        get_db: Dependency function to get database session
        tags: OpenAPI tags (defaults to [model.__name__])
        hooks: Optional CrudHooks instance for lifecycle events
        permissions: Optional CrudPermissions for authorization
        
    Returns:
        APIRouter with all CRUD endpoints configured
        
    Example:
        from persisted_object import create_crud_router, Store
        from models import Category
        
        store = Store(Category)
        router = create_crud_router(
            model=Category,
            store=store,
            prefix="/api/categories",
            tags=["Categories"]
        )
        app.include_router(router)
    """
    router = APIRouter(prefix=prefix, tags=list(tags) if tags else [model.__name__])
    
    # Use provided hooks or create empty ones
    if hooks is None:
        hooks = CrudHooks()
    
    if permissions is None:
        permissions = CrudPermissions()
    
    # Get model metadata
    model_name = model.__name__
    primary_key = model.__primary_key__
    
    # ==================== SCHEMA ENDPOINTS (MUST BE BEFORE /{item_id}) ====================
    
    @router.get("/schema")
    async def get_schema() -> Any:
        """Get JSON Schema for the model."""
        schema = model.model_json_schema()
        
        # Add index metadata from model's __indexed_fields__
        if "properties" in schema:
            indexed_fields = getattr(model, "__indexed_fields__", [])
            for field_name, field_schema in schema["properties"].items():
                field_schema["index"] = field_name in indexed_fields
        
        return schema
    
    @router.get("/schema/create")
    async def get_create_schema() -> Any:
        """Get JSON Schema for create form."""
        # For now, return the same schema
        # In the future, this could exclude readOnly fields
        schema = model.model_json_schema()
        
        # Add index metadata from model's __indexed_fields__
        if "properties" in schema:
            indexed_fields = getattr(model, "__indexed_fields__", [])
            for field_name, field_schema in schema["properties"].items():
                field_schema["index"] = field_name in indexed_fields
        
        return schema
    
    @router.get("/schema/edit")
    async def get_edit_schema() -> Any:
        """Get JSON Schema for edit form."""
        # For now, return the same schema
        # In the future, this could mark primary key as readOnly
        schema = model.model_json_schema()
        
        # Add index metadata from model's __indexed_fields__
        if "properties" in schema:
            indexed_fields = getattr(model, "__indexed_fields__", [])
            for field_name, field_schema in schema["properties"].items():
                field_schema["index"] = field_name in indexed_fields
        
        # Mark primary key as readOnly
        if "properties" in schema and primary_key in schema["properties"]:
            schema["properties"][primary_key]["readOnly"] = True
        return schema
    
    # ==================== LIST ENDPOINT ====================
    
    @router.get("/", response_model=StoreFilterResult)
    async def list_items(
        request: Request,
        skip: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Max items to return"),
        order_by: Optional[str] = Query(None, description="Field to order by (prefix with - for desc)"),
        search: Optional[str] = Query(None, description="Search term to filter results"),
        use_model_output: bool = Query(False, description="Return Pydantic models (True) or dicts (False)"),
        disable_total_query: bool = Query(False, description="Skip total count query for performance"),
        db: AsyncSession = Depends(get_db)
    ) -> StoreFilterResult:
        """
        List items with pagination and optional filtering.
        
        For simple dict-based filters from query params, use this endpoint.
        For advanced SQLAlchemy expressions, call store.filter() directly in your code.
        
        Query Parameters:
        - skip: Pagination offset
        - limit: Max items to return
        - order_by: Sort field (prefix with - for descending, e.g., "-_created_at")
        - search: Full-text search term
        - use_model_output: False (default) = dicts, True = Pydantic models
        - disable_total_query: True = skip total count (faster, but total=0)
        - Any other param: Used as equality filter (e.g., is_active=true)
        """
        # Check permissions
        if not await permissions.can_list():
            raise HTTPException(status_code=403, detail="Not authorized to list items")
        
        # Build WHERE conditions from query params
        # Exclude pagination/sorting/search/control params
        exclude_params = {'skip', 'limit', 'order_by', 'search', 'use_model_output', 'disable_total_query'}
        where_conditions = []
        
        # Extract filters from query params and convert to SQLAlchemy expressions
        for key, value in request.query_params.items():
            if key not in exclude_params and hasattr(store.db_model, key):
                # Simple equality filter
                where_conditions.append(getattr(store.db_model, key) == value)
        
        # Add search condition if provided
        if search:
            from sqlalchemy import or_
            search_conditions = []
            search_term = f"%{search}%"
            
            # Search in indexed string fields
            for field_name in store.indexed_fields:
                if hasattr(store.db_model, field_name):
                    field = getattr(store.db_model, field_name)
                    try:
                        if hasattr(field.type, 'python_type') and field.type.python_type == str:
                            search_conditions.append(field.ilike(search_term))
                    except (AttributeError, NotImplementedError):
                        pass
            
            if search_conditions:
                # Combine search conditions with OR
                where_conditions.append(or_(*search_conditions))
        
        # Use filter_async() method - it returns StoreFilterResult directly
        return await store.filter_async(
            db,
            where=where_conditions if where_conditions else None,
            skip=skip,
            limit=limit,
            order_by=order_by,
            use_model_output=use_model_output,
            disable_total_query=disable_total_query
        )
    
    # ==================== GET SINGLE ENDPOINT ====================
    
    @router.get("/{item_id}")
    async def get_item(
        item_id: str,
        db: AsyncSession = Depends(get_db)
    ) -> ModelType:
        """Get a single item by ID."""
        # Check permissions
        if not await permissions.can_get(id=item_id):
            raise HTTPException(status_code=403, detail="Not authorized to view this item")
        
        item = await store.aget(db, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"{model_name} not found")
        
        return item
    
    # ==================== CREATE ENDPOINT ====================
    
    @router.post("/", status_code=201)
    async def create_item(
        data: model,  # type: ignore
        db: AsyncSession = Depends(get_db)
    ) -> ModelType:
        """Create a new item."""
        # Check permissions
        if not await permissions.can_create():
            raise HTTPException(status_code=403, detail="Not authorized to create items")
        
        # Convert to dict for hooks
        data_dict = data.model_dump()
        
        # Before create hook
        data_dict = await hooks.before_create(data_dict)
        
        # Recreate model instance with modified data
        item = model.model_validate(data_dict)
        
        # Create in database
        try:
            created = await store.acreate(db, item)
        except DuplicateKeyError as e:
            raise HTTPException(status_code=409, detail=str(e))
        
        # After create hook
        await hooks.after_create(created)
        
        return created
    
    # ==================== UPDATE ENDPOINT ====================
    
    @router.put("/{item_id}")
    async def update_item(
        item_id: str,
        data: Dict[str, Any],
        db: AsyncSession = Depends(get_db)
    ) -> ModelType:
        """Update an existing item."""
        # Check permissions
        if not await permissions.can_update(id=item_id):
            raise HTTPException(status_code=403, detail="Not authorized to update this item")
        
        # Inject the primary key from URL path into the data
        # This allows clients to omit the primary key from the body
        data[primary_key] = item_id
        
        # Validate the data against the model
        try:
            validated = model.model_validate(data)
        except Exception as e:
            raise HTTPException(status_code=422, detail=str(e))
        
        # Convert to dict for hooks
        data_dict = validated.model_dump()
        
        # Before update hook
        data_dict = await hooks.before_update(item_id, data_dict)
        
        # Recreate model instance
        item = model.model_validate(data_dict)
        
        # Update in database
        try:
            updated = await store.aupdate(db, item)
        except ModelNotFoundError:
            raise HTTPException(status_code=404, detail=f"{model_name} not found")
        
        # After update hook
        await hooks.after_update(updated)
        
        return updated
    
    # ==================== DELETE ENDPOINT ====================
    
    @router.delete("/{item_id}")
    async def delete_item(
        item_id: str,
        db: AsyncSession = Depends(get_db)
    ) -> Dict[str, bool]:
        """Delete an item."""
        # Check permissions
        if not await permissions.can_delete(id=item_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this item")
        
        # Before delete hook
        await hooks.before_delete(item_id)
        
        # Delete from database
        deleted = await store.adelete(db, item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"{model_name} not found")
        
        # After delete hook
        await hooks.after_delete(item_id)
        
        return {"success": True}
    
    # ==================== EXPORT/IMPORT ENDPOINTS ====================
    
    @router.get("/export")
    async def export_items(
        db: AsyncSession = Depends(get_db)
    ) -> Dict[str, Any]:
        """Export all items as JSON."""
        items = await store.alist(db)
        return {
            "model": model_name,
            "count": len(items),
            "items": [item for item in items]
        }
    
    @router.post("/import")
    async def import_items(
        data: Dict[str, Any],
        db: AsyncSession = Depends(get_db)
    ):
        """Import items from JSON."""
        items = data.get("items", [])
        created_count = 0
        errors = []
        
        for item_data in items:
            try:
                item = model.model_validate(item_data)
                await store.acreate(db, item)
                created_count += 1
            except Exception as e:
                errors.append({"item": item_data, "error": str(e)})
        
        return {
            "success": len(errors) == 0,
            "created": created_count,
            "errors": errors
        }
    
    return router
