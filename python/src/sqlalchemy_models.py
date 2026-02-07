"""
SQLAlchemy table creation utilities for PersistedObject models.

This module handles automatic creation of SQLAlchemy table models
from PersistedObject definitions with advanced features:
- Multiple column types (Boolean, Integer, DateTime, String)
- Composite unique constraints
- Automatic timestamps (created_at, updated_at)
- Table caching for performance
- Database-specific optimizations
- Optional JSON encryption (requires cryptography package)
"""

from typing import Dict, Type, Any, Optional
import json
import base64
import os

from sqlalchemy import (
    Column, String, Text, MetaData, Boolean, Integer, DateTime,
    UniqueConstraint, Unicode, UnicodeText, func
)
from sqlalchemy.orm import registry as sa_registry
from sqlalchemy.types import TypeDecorator

# Try to import encryption libraries (optional)
try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    ENCRYPTION_AVAILABLE = True
except ImportError:
    ENCRYPTION_AVAILABLE = False


# Global SQLAlchemy registry for all PersistedObject tables
mapper_registry = sa_registry()
metadata = mapper_registry.metadata
Base = mapper_registry.generate_base()

# Table cache to avoid recreating the same table multiple times
_created_tables: Dict[str, Type] = {}


class JSONType(TypeDecorator):
    """
    SQLAlchemy type for storing JSON with optional encryption.
    
    Features:
    - Automatic Pydantic model serialization
    - Optional Fernet encryption with PBKDF2 key derivation
    - Backward compatible decryption fallback
    - Uses UnicodeText for MSSQL NTEXT support
    
    Encryption Extension:
        Install: pip install cryptography
        Environment variables:
            - PERSISTED_OBJECT_ENCRYPTION_KEY: Your encryption key
            - PERSISTED_OBJECT_ENCRYPTION_SALT: Your salt for key derivation
    """
    impl = UnicodeText
    cache_ok = True
    
    def __init__(
        self,
        encrypt: bool = False,
        encryption_key: Optional[str] = None,
        salt: Optional[str] = None,
        **kwargs
    ) -> None:
        """
        Initialize JSONType with optional encryption.
        
        Args:
            encrypt: Whether to encrypt the JSON data
            encryption_key: Custom encryption key (or use env var)
            salt: Custom salt for key derivation (or use env var)
        """
        super().__init__(**kwargs)
        self.encrypt = encrypt
        self.encryption_key = encryption_key
        self.salt = salt
        self._fernet = None
        
        if self.encrypt:
            if not ENCRYPTION_AVAILABLE:
                raise ImportError(
                    "Encryption requires cryptography package. "
                    "Install with: pip install cryptography"
                )
            self._setup_encryption()
    
    def _setup_encryption(self) -> None:
        """Setup Fernet encryption with PBKDF2 key derivation."""
        key = self.encryption_key or os.environ.get('PERSISTED_OBJECT_ENCRYPTION_KEY')
        if not key:
            raise ValueError(
                "Encryption key required. Provide via parameter or "
                "PERSISTED_OBJECT_ENCRYPTION_KEY environment variable"
            )
        
        salt = self.salt or os.environ.get('PERSISTED_OBJECT_ENCRYPTION_SALT')
        if not salt:
            raise ValueError(
                "Salt required for key derivation. Provide via parameter or "
                "PERSISTED_OBJECT_ENCRYPTION_SALT environment variable"
            )
        
        # Convert to bytes if needed
        key_bytes = key.encode('utf-8') if isinstance(key, str) else key
        salt_bytes = salt.encode('utf-8') if isinstance(salt, str) else salt
        
        # Derive encryption key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt_bytes,
            iterations=100000,
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key_bytes))
        self._fernet = Fernet(derived_key)
    
    def _encrypt_data(self, data: str) -> str:
        """Encrypt JSON string data."""
        if not self.encrypt or not self._fernet:
            return data
        
        encrypted_data = self._fernet.encrypt(data.encode('utf-8'))
        return base64.urlsafe_b64encode(encrypted_data).decode('utf-8')
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt JSON string data with backward compatibility."""
        if not self.encrypt or not self._fernet:
            return encrypted_data
        
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted_data = self._fernet.decrypt(decoded_data)
            return decrypted_data.decode('utf-8')
        except Exception:
            # Backward compatibility: return original if decryption fails
            return encrypted_data
    
    def process_bind_param(self, value, dialect) -> Optional[str]:
        """Convert Python object to JSON string with optional encryption."""
        if value is None:
            return None
        
        # Convert to JSON string
        if hasattr(value, 'model_dump_json'):
            # Pydantic model serialization
            json_str = value.model_dump_json()
        else:
            json_str = json.dumps(value)
        
        # Encrypt if enabled
        return self._encrypt_data(json_str)
    
    def process_result_value(self, value, dialect) -> Any:
        """Convert JSON string to Python object with optional decryption."""
        if value is None:
            return None
        
        # Decrypt if enabled
        decrypted_value = self._decrypt_data(value)
        
        try:
            return json.loads(decrypted_value)
        except json.JSONDecodeError:
            # Return raw value if JSON decode fails
            return decrypted_value


class PersistedTable(Base):
    """
    Abstract base class for all persisted tables.
    
    Automatically adds timestamp columns:
    - _created_at: Set on insert (underscore prefix indicates auto-managed field)
    - _updated_at: Updated on every modification (underscore prefix indicates auto-managed field)
    """
    __abstract__ = True
    
    _created_at = Column(DateTime, default=func.now(), nullable=False)
    _updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


def create_table_class(
    table_name: str,
    primary_key: str,
    field_types: Dict[str, Type],
    metadata: Optional[MetaData] = None,
    field_metadata: Optional[Dict[str, Dict[str, Any]]] = None,
    unique_fields: Optional[list] = None,
    encrypt_json: bool = False,
    encryption_key: Optional[str] = None,
    salt: Optional[str] = None,
) -> Type:
    """
    Create a SQLAlchemy table model for a PersistedObject.
    
    Features:
    - Multiple column types: Boolean, Integer, DateTime, String
    - Composite unique constraints (e.g., "first_name,last_name")
    - Automatic timestamps (created_at, updated_at)
    - Table caching for performance
    - Database-specific optimizations (MySQL, SQLite, PostgreSQL)
    - Optional JSON encryption
    
    Args:
        table_name: Name of the database table
        primary_key: Name of the primary key field
        field_types: Dictionary mapping field names to Python types
        metadata: Optional SQLAlchemy MetaData instance
        field_metadata: Optional dictionary with field metadata (max_length, etc.)
        unique_fields: List of unique fields (supports "field1,field2" for composite)
        encrypt_json: Whether to encrypt the json_data column
        encryption_key: Custom encryption key (or use env var)
        salt: Custom salt for key derivation (or use env var)
        
    Returns:
        A SQLAlchemy model class for the table
        
    Example:
        # Simple usage
        table_class = create_table_class(
            table_name="users",
            primary_key="id",
            field_types={"id": str, "email": str, "is_active": bool},
            field_metadata={"id": {"max_length": 26}, "email": {"max_length": 200}},
            unique_fields=["email"]
        )
        
        # With composite unique constraint
        table_class = create_table_class(
            table_name="persons",
            primary_key="id",
            field_types={"id": str, "first_name": str, "last_name": str},
            unique_fields=["first_name,last_name"]  # Composite
        )
        
        # With encryption (requires: pip install cryptography)
        table_class = create_table_class(
            table_name="secrets",
            primary_key="id",
            field_types={"id": str, "name": str},
            encrypt_json=True,
            encryption_key="your-key",
            salt="your-salt"
        )
    """
    # Use metadata or global registry metadata
    if metadata is None:
        metadata = mapper_registry.metadata
    
    if field_metadata is None:
        field_metadata = {}
    
    if unique_fields is None:
        unique_fields = []
    
    # Generate cache key for this table configuration
    metadata_id = id(metadata)
    cache_key = f"{table_name}_{metadata_id}"
    
    # Return cached table if already created
    if cache_key in _created_tables:
        return _created_tables[cache_key]
    
    # Get primary key metadata
    pk_meta = field_metadata.get(primary_key, {})
    pk_type = field_types.get(primary_key, str)
    pk_max_length = pk_meta.get('max_length', 400)
    
    # Determine primary key column type
    if pk_type == str or 'str' in str(pk_type):
        pk_column_type = Unicode(pk_max_length)
    else:
        pk_column_type = Unicode(400)  # Default fallback
    
    # Database-specific table arguments
    table_args = {
        'extend_existing': True,
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci',
        'sqlite_autoincrement': True,
        'sqlite_with_rowid': True,
        'info': {}
    }
    
    # Build unique constraints (supports composite constraints)
    unique_constraints = []
    if unique_fields:
        for field in unique_fields:
            if field != primary_key:
                if ',' in field:
                    # Composite unique constraint
                    field_names = [f.strip() for f in field.split(',')]
                    constraint_name = f'uq_{table_name}_{"_".join(field_names)}'
                    unique_constraints.append(
                        UniqueConstraint(*field_names, name=constraint_name)
                    )
                else:
                    # Single field unique constraint
                    unique_constraints.append(
                        UniqueConstraint(field, name=f'uq_{table_name}_{field}')
                    )
    
    # Combine constraints with table args
    table_args = tuple(unique_constraints) + (table_args,)
    
    # Build columns dictionary
    columns = {
        '__tablename__': table_name,
        '__table_args__': table_args,
        primary_key: Column(pk_column_type, primary_key=True),
        'json_data': Column(
            JSONType(encrypt=encrypt_json, encryption_key=encryption_key, salt=salt),
            nullable=False
        ),
    }
    
    # Add indexed field columns with proper types
    for field_name, field_type in field_types.items():
        if field_name != primary_key:
            field_meta = field_metadata.get(field_name, {})
            field_type_str = str(field_type)
            
            # Determine if field should be unique
            is_unique = field_name in unique_fields
            
            # Map Python types to SQLAlchemy types
            if field_type == bool or 'bool' in field_type_str.lower():
                columns[field_name] = Column(
                    Boolean, nullable=True, index=True, unique=is_unique
                )
            elif 'datetime' in field_type_str.lower():
                columns[field_name] = Column(
                    DateTime, nullable=True, index=True, unique=is_unique
                )
            elif field_type == int or 'int' in field_type_str.lower():
                columns[field_name] = Column(
                    Integer, nullable=True, index=True, unique=is_unique
                )
            else:
                # String type with max_length from metadata
                max_length = field_meta.get('max_length', 400)
                columns[field_name] = Column(
                    Unicode(max_length), nullable=True, index=True, unique=is_unique
                )
    
    # Create unique class name
    class_name = f"Table_{table_name}_{metadata_id}"
    
    # Create the table class inheriting from PersistedTable
    model_class = type(class_name, (PersistedTable,), columns)
    
    # Cache the created table
    _created_tables[cache_key] = model_class
    
    return model_class
