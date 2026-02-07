"""
Lifecycle hooks for CRUD operations.

Allows custom logic to be injected before/after each CRUD operation.
"""

from typing import Any, Dict, Optional
from .base import PersistedObject


class CrudHooks:
    """
    Base class for CRUD lifecycle hooks.
    
    Override methods to add custom logic before/after CRUD operations.
    
    Example:
        class CategoryHooks(CrudHooks):
            async def before_create(self, data: dict) -> dict:
                # Auto-generate slug from title
                data["slug"] = data["title"].lower().replace(" ", "-")
                return data
            
            async def after_delete(self, id: str) -> None:
                # Clean up related data
                await cleanup_category_references(id)
    """
    
    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called before creating a new item.
        
        Args:
            data: The data to be created
            
        Returns:
            Modified data (can modify in-place or return new dict)
        """
        return data
    
    async def after_create(self, item: PersistedObject) -> None:
        """
        Called after successfully creating an item.
        
        Args:
            item: The created item
        """
        pass
    
    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called before updating an item.
        
        Args:
            id: The ID of the item being updated
            data: The update data
            
        Returns:
            Modified data
        """
        return data
    
    async def after_update(self, item: PersistedObject) -> None:
        """
        Called after successfully updating an item.
        
        Args:
            item: The updated item
        """
        pass
    
    async def before_delete(self, id: str) -> None:
        """
        Called before deleting an item.
        
        Args:
            id: The ID of the item being deleted
        """
        pass
    
    async def after_delete(self, id: str) -> None:
        """
        Called after successfully deleting an item.
        
        Args:
            id: The ID of the deleted item
        """
        pass


class CrudPermissions:
    """
    Base class for CRUD permission checks.
    
    Override methods to implement custom authorization logic.
    
    Example:
        class AdminOnlyPermissions(CrudPermissions):
            async def can_create(self, user: Any) -> bool:
                return user.role == "admin"
            
            async def can_delete(self, user: Any, id: str) -> bool:
                return user.role == "admin"
    """
    
    async def can_list(self, user: Any = None) -> bool:
        """Check if user can list items."""
        return True
    
    async def can_get(self, user: Any = None, id: str = None) -> bool:
        """Check if user can get a specific item."""
        return True
    
    async def can_create(self, user: Any = None) -> bool:
        """Check if user can create items."""
        return True
    
    async def can_update(self, user: Any = None, id: str = None) -> bool:
        """Check if user can update a specific item."""
        return True
    
    async def can_delete(self, user: Any = None, id: str = None) -> bool:
        """Check if user can delete a specific item."""
        return True
