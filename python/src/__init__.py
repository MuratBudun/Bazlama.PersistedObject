"""
PersistedObject - Zero-boilerplate CRUD for FastAPI

A production-ready module for building type-safe CRUD applications with
automatic API generation and minimal code.
"""

from .base import PersistedObject
from .registry import register_persisted_model, get_all_models
from .store import Store
from .router import create_crud_router
from .hooks import CrudHooks, CrudPermissions
from .fields import (
    IDField,
    ReferenceIDField,
    KeyField,
    TitleField,
    DescriptionField,
    ContentField,
    LargeContentField,
    MaxContentField,
    PasswordField,
    StandardField,
    VersionField,
    PromptTemplateField,
)
from .exceptions import (
    PersistedObjectError,
    ModelNotFoundError,
    DuplicateKeyError,
    ValidationError,
)
from .sqlalchemy_models import (
    JSONType,
    PersistedTable,
    Base,
    metadata,
    mapper_registry,
)

__version__ = "0.1.0"

__all__ = [
    # Core classes
    "PersistedObject",
    "Store",
    # Router Factory - THE MAIN FEATURE!
    "create_crud_router",
    # Hooks
    "CrudHooks",
    "CrudPermissions",
    # Registry
    "register_persisted_model",
    "get_all_models",
    # Field helpers
    "IDField",
    "ReferenceIDField",
    "KeyField",
    "TitleField",
    "DescriptionField",
    "ContentField",
    "LargeContentField",
    "MaxContentField",
    "PasswordField",
    "StandardField",
    "VersionField",
    "PromptTemplateField",
    # Exceptions
    "PersistedObjectError",
    "ModelNotFoundError",
    "DuplicateKeyError",
    "ValidationError",
    # SQLAlchemy utilities
    "JSONType",
    "PersistedTable",
    "Base",
    "metadata",
    "mapper_registry",
]
