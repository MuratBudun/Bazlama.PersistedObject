"""
Model Definition - The only pre-defined model for the dynamic example.

This model stores definitions of other models that users create at runtime.
"""

from typing import List, Optional
from pydantic import Field
from persisted_object import PersistedObject, KeyField, TitleField, StandardField, DescriptionField
from persisted_object.registry import register_persisted_model


class FieldDefinition(PersistedObject):
    """Schema for a single field within a model definition."""
    __table_name__ = "_field_def_"
    __primary_key__ = "name"
    __indexed_fields__ = ["name"]

    name: str = KeyField(description="Field name (snake_case)")
    field_type: str = StandardField(description="Field type: string, integer, boolean, text, datetime")
    description: str = DescriptionField(default="", description="Field description")
    required: bool = Field(default=True, description="Whether the field is required")
    default_value: Optional[str] = Field(default=None, description="Default value (as string)")
    max_length: Optional[int] = Field(default=None, description="Max length for string fields")
    is_primary_key: bool = Field(default=False, description="Whether this field is the primary key")
    is_indexed: bool = Field(default=False, description="Whether this field should be indexed")
    is_unique: bool = Field(default=False, description="Whether this field must be unique")


@register_persisted_model
class ModelDefinition(PersistedObject):
    """
    Stores the definition of a dynamic PersistedObject model.
    
    Users create these through the UI, and the backend dynamically
    creates PersistedObject classes, database tables, and API routes.
    """
    __table_name__ = "model_definitions"
    __primary_key__ = "name"
    __indexed_fields__ = ["name"]
    __unique_fields__ = ["name"]

    name: str = KeyField(description="Model name (PascalCase, e.g. 'Product')")
    table_name: str = StandardField(description="Database table name (snake_case, e.g. 'products')")
    description: str = DescriptionField(default="", description="Model description")
    fields: List[dict] = Field(default_factory=list, description="List of field definitions")
    script: Optional[str] = Field(default=None, description="Python script for advanced model definition (PersistedObject class)")
