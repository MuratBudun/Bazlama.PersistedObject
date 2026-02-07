"""
Custom exceptions for PersistedObject operations.
"""
from typing import Any

class PersistedObjectError(Exception):
    """Base exception for all PersistedObject errors."""
    pass


class ModelNotFoundError(PersistedObjectError):
    """Raised when a model instance is not found in the database."""
    
    def __init__(self, model_name: str, primary_key: str, value: Any):
        self.model_name = model_name
        self.primary_key = primary_key
        self.value = value
        super().__init__(
            f"{model_name} with {primary_key}={value} not found"
        )


class DuplicateKeyError(PersistedObjectError):
    """Raised when attempting to create a duplicate entry."""
    
    def __init__(self, model_name: str, primary_key: str, value: Any):
        self.model_name = model_name
        self.primary_key = primary_key
        self.value = value
        super().__init__(
            f"{model_name} with {primary_key}={value} already exists"
        )


class ValidationError(PersistedObjectError):
    """Raised when model validation fails."""
    pass


class RegistrationError(PersistedObjectError):
    """Raised when model registration fails."""
    pass