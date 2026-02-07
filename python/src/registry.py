"""Registry for Persisted models.

This module provides a registry for PersistedObject models and a decorator to register them.
This makes it easier to set up database migrations and automatically initialize all models.

Author: Murat Büdün (muratbudun@gmail.com)
Date: 2025-04-09
Version: 0.1.0

Version History:
  - 0.1.0: Initial implementation
"""

from typing import Dict, List, Type, TypeVar
from .base import PersistedObject

# Global registry to store all registered model classes
_persisted_models: Dict[str, Type[PersistedObject]] = {}

# Type variable for generic decorator
T = TypeVar('T', bound=Type[PersistedObject])


def register_persisted_model(cls: T) -> T:
    """
    Decorator to register a PersistedObject class in the registry.
    
    Usage:
        @register_persisted_model
        class MyModel(PersistedObject):
            __table_name__ = "my_models"
            __primary_key__ = "id"
            __indexed_fields__ = ["id"]
            
            id: str = KeyField(description="Model ID")
            # ... other fields
    
    Args:
        cls: A class that inherits from PersistedObject
        
    Returns:
        The same class, with proper type information preserved
        
    Raises:
        TypeError: If the class doesn't inherit from PersistedObject
        ValueError: If the class doesn't define __table_name__
    """
    if not issubclass(cls, PersistedObject):
        raise TypeError(f"Class {cls.__name__} must be a subclass of PersistedObject")
    
    # Store the class in the registry using its table name as the key
    table_name = getattr(cls, "__table_name__", None)
    if not table_name:
        raise ValueError(f"Class {cls.__name__} must define __table_name__")
        
    _persisted_models[table_name] = cls
    return cls  # Return the class itself, preserving type information


def get_all_models() -> List[Type[PersistedObject]]:
    """
    Get all registered PersistedObject models.
    
    Returns:
        A list of all registered model classes
    """
    return list(_persisted_models.values())


def get_model_by_table_name(table_name: str) -> Type[PersistedObject]:
    """
    Get a model class by its table name.
    
    Args:
        table_name: The name of the table
        
    Returns:
        The model class corresponding to the table name
        
    Raises:
        KeyError: If no model with the given table name is registered
    """
    if table_name not in _persisted_models:
        raise KeyError(f"No model registered with table name: {table_name}")
    return _persisted_models[table_name]


def clear_registry() -> None:
    """
    Clear all registered models. Useful for testing.
    """
    _persisted_models.clear()
