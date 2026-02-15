"""
Dynamic Model Manager

Creates PersistedObject classes, Store instances, and API routers
dynamically from ModelDefinition records at runtime.

Supports simple types (string, integer, boolean, text, datetime)
and complex types (string_array, object, object_array) that are
stored in JSON only (not as DB columns).
"""

from typing import Any, Dict, List, Optional, Type
from pydantic import Field

from persisted_object import PersistedObject, Store, create_crud_router
from persisted_object.sqlalchemy_models import mapper_registry

from .database import engine


# Registry of dynamically created models and their stores/routers
_dynamic_models: Dict[str, Type[PersistedObject]] = {}
_dynamic_stores: Dict[str, Store] = {}


# Simple field types that CAN become DB columns
SIMPLE_FIELD_TYPE_MAP = {
    "string": str,
    "integer": int,
    "boolean": bool,
    "text": str,
    "datetime": str,
}

# Complex field types that are stored in JSON only
COMPLEX_FIELD_TYPE_MAP = {
    "string_array": (List[str], list),
    "object": (Dict[str, Any], dict),
    "object_array": (List[Dict[str, Any]], list),
}

ALL_SIMPLE_TYPES = set(SIMPLE_FIELD_TYPE_MAP.keys())

# Default max_length per type
DEFAULT_MAX_LENGTH = {
    "string": 200,
    "text": 4000,
    "integer": None,
    "boolean": None,
    "datetime": None,
}


def _build_model_class(name: str, table_name: str, fields: List[dict], description: str = "") -> Type[PersistedObject]:
    """
    Dynamically create a PersistedObject subclass from field definitions.
    """
    # Find primary key field
    pk_field = None
    indexed_fields = []
    unique_fields = []
    annotations = {}
    namespace: Dict[str, Any] = {}

    for f in fields:
        fname = f["name"]
        ftype_str = f.get("field_type", "string")
        required = f.get("required", True)
        default_value = f.get("default_value")
        fdesc = f.get("description", "")
        is_pk = f.get("is_primary_key", False)
        is_indexed = f.get("is_indexed", False)
        is_unique = f.get("is_unique", False)

        # Determine if the field is a complex type (JSON-only)
        is_complex = ftype_str in COMPLEX_FIELD_TYPE_MAP

        if is_complex:
            # Complex types: stored in JSON blob, cannot be DB columns
            type_info = COMPLEX_FIELD_TYPE_MAP[ftype_str]
            python_type = type_info[0]  # e.g. List[str], Dict[str, Any]
            default_factory = type_info[1]  # list or dict
        else:
            # Simple types: can become DB columns
            python_type = SIMPLE_FIELD_TYPE_MAP.get(ftype_str, str)
            default_factory = None
            max_length = f.get("max_length") or DEFAULT_MAX_LENGTH.get(ftype_str)

        if is_pk:
            pk_field = fname

        # Only simple-type fields can be indexed / become DB columns
        if not is_complex:
            if is_pk or is_indexed:
                if fname not in indexed_fields:
                    if is_pk:
                        indexed_fields.insert(0, fname)
                    else:
                        indexed_fields.append(fname)
            if is_unique:
                unique_fields.append(fname)

        # Build field with proper typing
        field_kwargs: Dict[str, Any] = {"description": fdesc}

        if not is_complex and max_length is not None:
            field_kwargs["max_length"] = max_length
            field_kwargs["json_schema_extra"] = {"maxLength": max_length}

        if is_complex:
            # Complex fields are always optional with a default factory
            annotations[fname] = Optional[python_type]
            field_kwargs["default_factory"] = default_factory
        elif not required and not is_pk:
            annotations[fname] = Optional[python_type]
            # Parse default value
            if default_value is not None:
                if python_type == bool:
                    field_kwargs["default"] = default_value.lower() in ("true", "1", "yes")
                elif python_type == int:
                    try:
                        field_kwargs["default"] = int(default_value)
                    except ValueError:
                        field_kwargs["default"] = 0
                else:
                    field_kwargs["default"] = default_value
            else:
                field_kwargs["default"] = None
        else:
            annotations[fname] = python_type

        namespace[fname] = Field(**field_kwargs)

    if not pk_field:
        raise ValueError(f"Model '{name}' must have at least one primary key field")

    if not indexed_fields:
        indexed_fields = [pk_field]

    # Set class variables
    namespace["__table_name__"] = table_name
    namespace["__primary_key__"] = pk_field
    namespace["__indexed_fields__"] = indexed_fields
    namespace["__unique_fields__"] = unique_fields
    namespace["__annotations__"] = annotations

    # Create the class
    model_cls = type(name, (PersistedObject,), namespace)
    return model_cls


def create_dynamic_model(definition: dict) -> dict:
    """
    Create a dynamic model from a ModelDefinition dict.
    Returns info about what was created.
    """
    name = definition["name"]
    table_name = definition["table_name"]
    fields = definition.get("fields", [])
    description = definition.get("description", "")

    # Build the Pydantic model class
    model_cls = _build_model_class(name, table_name, fields, description)
    _dynamic_models[name] = model_cls

    # Create store
    store = Store(model_cls)
    _dynamic_stores[name] = store

    return {
        "name": name,
        "table_name": table_name,
        "endpoint": f"/api/dynamic/{table_name}",
    }


async def ensure_table_exists(name: str) -> None:
    """Create the database table for a dynamic model if it doesn't exist."""
    if name not in _dynamic_stores:
        return
    store = _dynamic_stores[name]
    # Ensure the table is created
    async with engine.begin() as conn:
        await conn.run_sync(mapper_registry.metadata.create_all)


def get_dynamic_model(name: str) -> Optional[Type[PersistedObject]]:
    return _dynamic_models.get(name)


def get_dynamic_store(name: str) -> Optional[Store]:
    return _dynamic_stores.get(name)


def get_all_dynamic_models() -> Dict[str, Type[PersistedObject]]:
    return dict(_dynamic_models)


def remove_dynamic_model(name: str) -> bool:
    """Remove a dynamic model from memory (does NOT drop the table)."""
    removed = False
    if name in _dynamic_models:
        del _dynamic_models[name]
        removed = True
    if name in _dynamic_stores:
        del _dynamic_stores[name]
        removed = True
    return removed
