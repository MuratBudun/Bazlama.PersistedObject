"""
Field Definition Utilities

This module provides standardized field definition utilities for Pydantic models.
It establishes consistent field constraints, especially for string fields that 
need to be mapped to database columns with specific size limitations.

All field helpers use the user-approved pattern where semantic field names
automatically include appropriate constraints.
"""

from typing import Any, Optional
from pydantic import Field


def IDField(
    default: Any = ...,
    *,
    description: Optional[str] = "Unique identifier",
    **kwargs
) -> Any:
    """
    Field definition for unique identifiers (e.g., ULIDs, UUIDs).
    Uses a standard max_length of 26 characters to accommodate ULID strings.
    
    Args:
        default: Default value generator (typically get_ulid or similar)
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for ID fields
        
    Example:
        id: str = IDField(default_factory=get_ulid, description="User ID")
    """
    kwargs["max_length"] = kwargs.get("max_length", 26)
    return Field(default, description=description, **kwargs)


def ReferenceIDField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for reference ID fields (e.g., user_id, session_id).
    Uses a standard max_length of 36 characters to accommodate ULID/UUID/GUID references.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for reference ID fields
        
    Example:
        user_id: str = ReferenceIDField(description="User identifier")
    """
    kwargs["max_length"] = kwargs.get("max_length", 36)
    return Field(default, description=description, **kwargs)


def KeyField(
    default: Any = ...,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for key-like string fields (e.g., identifiers, names, codes, slugs).
    Uses a standard max_length of 200 characters.
    
    This is one of the most commonly used field helpers - perfect for names,
    identifiers, slugs, and other short text that needs indexing.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings
        
    Example:
        name: str = KeyField(description="Category name")
        slug: str = KeyField(description="URL-friendly slug")
    """
    kwargs["max_length"] = kwargs.get("max_length", 200)
    return Field(default, description=description, **kwargs)


def TitleField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for title-like string fields.
    Uses a standard max_length of 400 characters.
    
    Use this for display titles, headers, and other medium-length text
    that is longer than a key but shorter than a description.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings
        
    Example:
        title: str = TitleField(description="Article title")
        display_name: str = TitleField(description="Display name")
    """
    kwargs["max_length"] = kwargs.get("max_length", 400)
    return Field(default, description=description, **kwargs)


def DescriptionField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for description-like string fields.
    Uses a standard max_length of 800 characters.
    
    Perfect for short descriptions, summaries, and help text.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings
        
    Example:
        description: str = DescriptionField(description="Category description")
        bio: str = DescriptionField(description="User biography")
    """
    kwargs["max_length"] = kwargs.get("max_length", 800)
    return Field(default, description=description, **kwargs)


def ContentField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for content-like string fields (e.g., rich text, large content).
    Uses a standard max_length of 4000 characters.
    
    Use for longer text content like blog posts, comments, or article sections.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings
        
    Example:
        content: str = ContentField(description="Article content")
        notes: str = ContentField(description="Additional notes")
    """
    kwargs["max_length"] = kwargs.get("max_length", 4000)
    return Field(default, description=description, **kwargs)


def LargeContentField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for large content-like string fields (e.g., long text, documents).
    Uses a standard max_length of 10000 characters.
    
    For very long text content like full documents or detailed articles.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for large content
        
    Example:
        full_text: str = LargeContentField(description="Full document text")
    """
    kwargs["max_length"] = kwargs.get("max_length", 10000)
    return Field(default, description=description, **kwargs)


def MaxContentField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for maximum content-like string fields (e.g., very large text).
    Uses a standard max_length of 100000 characters.
    
    For extremely long content like full books or large datasets.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for maximum content
        
    Example:
        raw_data: str = MaxContentField(description="Raw JSON data")
    """
    kwargs["max_length"] = kwargs.get("max_length", 100000)
    return Field(default, description=description, **kwargs)


def UnlimitedContentField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for unlimited content-like string fields.
    Does not impose any length limit, allowing for database TEXT/NTEXT types without constraints.
    
    Use sparingly - only when content truly has no predictable size limit.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for unlimited content
        
    Example:
        full_document: str = UnlimitedContentField(description="Complete document")
    """
    # Explicitly remove max_length if it was provided in kwargs
    if "max_length" in kwargs:
        del kwargs["max_length"]
    return Field(default, description=description, **kwargs)


def StandardField(
    default: Any = ...,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Standard field with consistent description handling.
    Use this for non-string fields or when you need custom settings.
    
    This is the generic field helper - use when none of the semantic helpers apply.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings
        
    Example:
        count: int = StandardField(default=0, description="Item count")
        is_active: bool = StandardField(default=True, description="Active status")
        tags: List[str] = StandardField(default_factory=list, description="Tags")
    """
    return Field(default, description=description, **kwargs)


def PasswordField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for password fields with automatic UI masking.
    
    Frontend will automatically render this as a password input field.
    This demonstrates the json_schema_extra pattern for custom UI components.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with UI component hint for password masking
        
    Example:
        password: str = PasswordField(description="User password (hashed)")
        api_key: str = PasswordField(description="API key")
    """
    kwargs.setdefault("json_schema_extra", {})
    if isinstance(kwargs["json_schema_extra"], dict):
        kwargs["json_schema_extra"]["ui_component"] = "PasswordField"
    return Field(default, description=description, **kwargs)


def VersionField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for version numbers (e.g., semantic versioning).
    Uses a standard max_length of 50 characters to accommodate version strings 
    like '1.2.3-beta.1+build.12345'.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings for version numbers
        
    Example:
        version: str = VersionField(default="1.0.0", description="App version")
    """
    kwargs["max_length"] = kwargs.get("max_length", 50)
    return Field(default, description=description, **kwargs)


def PromptTemplateField(
    default: Any = None,
    *,
    description: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Field definition for prompt template strings.
    Uses a standard max_length of 100000 characters and custom UI component.
    
    This is an example of a domain-specific field helper with custom UI.
    
    Args:
        default: Default value
        description: Field description
        **kwargs: Additional arguments to pass to Field
        
    Returns:
        Pydantic Field with standardized settings and UI component hint
        
    Example:
        prompt: str = PromptTemplateField(description="LLM prompt template")
    """
    kwargs["max_length"] = kwargs.get("max_length", 100000)
    kwargs.setdefault("json_schema_extra", {})
    if isinstance(kwargs["json_schema_extra"], dict):
        kwargs["json_schema_extra"]["ui_component"] = "PromptTemplate"
    return Field(default, description=description, **kwargs)
