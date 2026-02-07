"""
Base class for objects that can be persisted in a database.

Provides the foundational PersistedObject class that other models inherit from.
"""

from datetime import datetime
from typing import Any, ClassVar, Dict, List, Optional
from pydantic import BaseModel, model_validator


class PersistedObject(BaseModel):
    """
    Base class for Pydantic objects that can be stored in the database.
    
    Child classes must define:
    - __table_name__: The name of the database table
    - __primary_key__: The field name to use as primary key
    - __indexed_fields__: List of fields to index for quick access
    - __unique_fields__: (Optional) List of fields that must be unique (besides primary key)
    - __encrypt_json__: (Optional) Whether to encrypt the JSON data column (default: False)
    
    Automatic fields (managed by database):
    - _created_at: Timestamp when the record was created
    - _updated_at: Timestamp when the record was last updated
    
    ⚠️ WARNING: Do NOT override _created_at or _updated_at in subclasses.
    These fields are automatically managed by the database layer.
    
    Example:
        @register_persisted_model
        class User(PersistedObject):
            __table_name__ = "users"
            __primary_key__ = "id"
            __indexed_fields__ = ["id", "email", "is_active"]
            __unique_fields__ = ["email"]
            __encrypt_json__ = True
            
            id: str = KeyField(description="User ID")
            email: str = KeyField(description="Email address")
            name: str = TitleField(description="Full name")
            is_active: bool = True
    """
    __table_name__: ClassVar[str]
    __primary_key__: ClassVar[str]
    __indexed_fields__: ClassVar[List[str]]
    __unique_fields__: ClassVar[List[str]] = []  # Optional: unique fields other than PK
    __encrypt_json__: ClassVar[bool] = False  # Optional: encrypt JSON data column
    
    # Timestamp fields automatically managed by database (DO NOT OVERRIDE)
    # _created_at: Optional[datetime] = None
    # _updated_at: Optional[datetime] = None

    @model_validator(mode='after')
    def validate_db_settings(self) -> 'PersistedObject':
        """Validate that required class variables are defined in subclasses."""
        cls = self.__class__
        
        if not hasattr(cls, '__table_name__'):
            raise ValueError(f"Class {cls.__name__} must define __table_name__")
        
        if not hasattr(cls, '__primary_key__'):
            raise ValueError(f"Class {cls.__name__} must define __primary_key__")
            
        if not hasattr(cls, '__indexed_fields__'):
            raise ValueError(f"Class {cls.__name__} must define __indexed_fields__")
        
        # Validate that the primary key exists in the model
        if cls.__primary_key__ not in self.model_fields:
            raise ValueError(f"Primary key {cls.__primary_key__} not found in {cls.__name__}")
        
        # Validate that indexed fields exist in the model
        for field in cls.__indexed_fields__:
            if field not in self.model_fields:
                raise ValueError(f"Indexed field {field} not found in {cls.__name__}")

        # Validate that unique fields exist in the model
        if hasattr(cls, '__unique_fields__'):
            for field in cls.__unique_fields__:
                if field not in self.model_fields:
                    raise ValueError(f"Unique field {field} not found in {cls.__name__}")
        
        # # Prevent timestamp field overrides in subclasses
        # if cls != PersistedObject:
        #     base_fields = PersistedObject.model_fields
        #     for field_name in ['_created_at', '_updated_at']:
        #         if field_name in cls.model_fields:
        #             # Check if the field was redefined in a subclass
        #             if cls.model_fields[field_name] is not base_fields.get(field_name):
        #                 raise ValueError(
        #                     f"Class {cls.__name__} must not override '{field_name}'. "
        #                     f"This field is automatically managed by the database."
        #                 )
            
        return self
    
    def to_db_dict(self) -> Dict[str, Any]:
        """Convert instance to a dictionary suitable for database storage."""
        db_dict = {}
        
        # Extract primary key
        pk_name = self.__class__.__primary_key__
        db_dict[pk_name] = getattr(self, pk_name)
        
        # Extract indexed fields
        for field_name in self.__class__.__indexed_fields__:
            if field_name != pk_name:  # Skip if it's the primary key
                db_dict[field_name] = getattr(self, field_name)
        
        # Store the full model as JSON (includes _created_at and _updated_at)
        db_dict['json_data'] = self
        
        return db_dict
    
    @classmethod
    def from_db_dict(cls, db_dict: Dict[str, Any]) -> 'PersistedObject':
        """Create an instance from a database dictionary."""
        json_data = db_dict.get('json_data', {})
        return cls.model_validate(json_data)
