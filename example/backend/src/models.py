"""
Example models demonstrating PersistedObject advanced features.

This module showcases:
- Multiple column types (Boolean, Integer, DateTime, String)
- Composite unique constraints
- Automatic timestamps (created_at, updated_at)
- Array fields and nested data
- Optional JSON encryption
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from persisted_object import (
    PersistedObject,
    register_persisted_model,
    KeyField,
    TitleField,
    DescriptionField,
    StandardField,
    IDField,
)


@register_persisted_model
class AppSettings(PersistedObject):
    """
    Application settings model.
    
    A simple key-value store for application configuration.
    Perfect example of a "secondary data structure" that benefits from
    PersistedObject's zero-boilerplate approach.
    """
    __table_name__ = "app_settings"
    __primary_key__ = "key"
    __indexed_fields__ = ["key", "category"]
    
    key: str = KeyField(description="Setting key (unique identifier)")
    value: str = StandardField(description="Setting value")
    category: str = KeyField(default="general", description="Setting category")
    description: Optional[str] = DescriptionField(
        default=None,
        description="Description of what this setting does"
    )


@register_persisted_model
class Category(PersistedObject):
    """
    Category model demonstrating multiple column types.
    
    Shows:
    - Boolean column (is_active)
    - Integer column (sort_order)
    - String columns with various max_length
    - Unique constraint on slug
    - Automatic created_at and updated_at timestamps
    """
    __table_name__ = "categories"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "is_active", "sort_order"]
    __unique_fields__ = ["slug"]
    
    id: str = KeyField(description="Category ID")
    slug: str = KeyField(description="URL-friendly slug (unique)")
    title: str = TitleField(description="Category display title")
    description: Optional[str] = DescriptionField(
        default=None,
        description="Category description"
    )
    icon: Optional[str] = KeyField(
        default="folder",
        description="Icon name for UI"
    )
    is_active: bool = True  # → Boolean column in DB
    sort_order: int = 0  # → Integer column in DB


@register_persisted_model
class Tag(PersistedObject):
    """
    Simple tag model.
    
    Demonstrates minimal configuration - just the essentials.
    """
    __table_name__ = "tags"
    __primary_key__ = "name"
    __indexed_fields__ = ["name"]
    
    name: str = KeyField(description="Tag name (unique)")
    color: Optional[str] = KeyField(
        default="#3b82f6",
        description="Hex color code for UI"
    )
    usage_count: int = StandardField(
        default=0,
        description="Number of times this tag is used"
    )


@register_persisted_model
class User(PersistedObject):
    """
    User model demonstrating advanced features.
    
    Shows:
    - Composite unique constraint (email + username)
    - DateTime field (last_login)
    - Boolean field (is_active)
    - Array fields (tags, permissions)
    - Complex nested data
    - Automatic timestamps
    - Optional encryption (__encrypt_json__ = True requires cryptography)
    """
    __table_name__ = "users"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "email", "username", "is_active", "role", "last_login"]
    __unique_fields__ = ["email", "username"]  # Both must be unique
    # __encrypt_json__ = True  # Uncomment to enable encryption (requires: pip install cryptography)
    
    id: str = IDField(description="User ID (ULID)")
    email: str = KeyField(description="Email address (unique)")
    username: str = KeyField(description="Username (unique)")
    full_name: str = TitleField(description="Full display name")
    role: str = KeyField(default="user", description="User role (admin, user, guest)")
    is_active: bool = True  # → Boolean column
    
    # DateTime field - stored as DateTime column in DB
    last_login: Optional[datetime] = None
    
    # Array fields - stored in json_data
    tags: List[str] = StandardField(
        default_factory=list,
        description="User tags for categorization"
    )
    permissions: List[str] = StandardField(
        default_factory=list,
        description="List of permissions granted to user"
    )
    favorite_categories: List[str] = StandardField(
        default_factory=list,
        description="User's favorite category IDs"
    )
    
    # Complex nested data - stored in json_data
    profile: Dict[str, Any] = StandardField(
        default_factory=dict,
        description="User profile data (avatar, bio, preferences, etc.)"
    )
    settings: Dict[str, Any] = StandardField(
        default_factory=lambda: {
            "theme": "light",
            "language": "en",
            "notifications": True,
            "email_updates": False
        },
        description="User preferences and settings"
    )


@register_persisted_model  
class Project(PersistedObject):
    """
    Project model with complex arrays and relationships.
    
    Demonstrates:
    - Multiple indexed fields
    - Boolean field (is_public)
    - Integer field (member_count)
    - Array of simple strings (tags)
    - Array of objects (members with roles)
    - Composite data structures
    """
    __table_name__ = "projects"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "status", "owner_id", "is_public", "member_count"]
    __unique_fields__ = ["slug"]
    
    id: str = IDField(description="Project ID")
    slug: str = KeyField(description="URL-friendly project slug")
    title: str = TitleField(description="Project title")
    description: Optional[str] = DescriptionField(
        default=None,
        description="Project description"
    )
    status: str = KeyField(
        default="draft",
        description="Project status (draft, active, completed, archived)"
    )
    owner_id: str = KeyField(description="ID of project owner")
    is_public: bool = False  # → Boolean column
    member_count: int = 0  # → Integer column
    
    # Array of simple strings
    tags: List[str] = StandardField(
        default_factory=list,
        description="Project tags for categorization"
    )
    
    # Array of objects - each member has role and permissions
    members: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Project members with their roles and permissions",
        json_schema_extra={
            "example": [
                {"user_id": "user123", "role": "admin", "permissions": ["read", "write", "delete"]},
                {"user_id": "user456", "role": "member", "permissions": ["read", "write"]}
            ]
        }
    )
    
    # Milestones
    milestones: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Project milestones with deadlines",
        json_schema_extra={
            "example": [
                {"title": "MVP", "due_date": "2024-03-01", "completed": False},
                {"title": "Beta Release", "due_date": "2024-06-01", "completed": False}
            ]
        }
    )


@register_persisted_model
class Event(PersistedObject):
    """
    Event model demonstrating DateTime and Boolean fields.
    
    Shows how DateTime fields are stored as actual DateTime columns,
    enabling efficient date-based queries and sorting.
    """
    __table_name__ = "events"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "event_date", "is_published", "category", "priority"]
    
    id: str = IDField(description="Event ID")
    title: str = TitleField(description="Event title")
    description: Optional[str] = DescriptionField(
        default=None,
        description="Event description"
    )
    category: str = KeyField(default="general", description="Event category")
    
    # DateTime field - stored as DateTime column for efficient queries
    event_date: datetime = StandardField(
        default_factory=datetime.now,
        description="Event date and time"
    )
    
    # Boolean fields - stored as Boolean columns
    is_published: bool = False
    is_featured: bool = False
    
    # Integer field - stored as Integer column
    priority: int = 0  # 0=low, 1=medium, 2=high
    
    # Location data
    location: Dict[str, Any] = StandardField(
        default_factory=dict,
        description="Event location (venue, address, coordinates)",
        json_schema_extra={
            "example": {
                "venue": "Conference Center",
                "address": "123 Main St",
                "city": "San Francisco",
                "coordinates": {"lat": 37.7749, "lng": -122.4194}
            }
        }
    )
    
    # Attendees
    attendees: List[str] = StandardField(
        default_factory=list,
        description="List of attendee user IDs"
    )


@register_persisted_model
class ApiKey(PersistedObject):
    """
    API Key model demonstrating secure encrypted storage.
    
    Features:
    - Encrypted JSON storage (__encrypt_json__ = True)
    - Sensitive data protection (secure_value, allowed_ips)
    - Permission arrays (scopes)
    - Expiration handling
    - Rate limiting configuration
    - Usage tracking with object arrays
    
    Encryption Requirements:
        pip install cryptography
        Set environment variables:
            - PERSISTED_OBJECT_ENCRYPTION_KEY
            - PERSISTED_OBJECT_ENCRYPTION_SALT
    """
    __table_name__ = "api_keys"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "name", "is_active", "expires_at"]
    __unique_fields__ = ["name"]
    __encrypt_json__ = True  # Enable encryption for sensitive data
    
    id: str = IDField(description="API Key ID")
    name: str = KeyField(description="API Key name (unique identifier)")
    description: Optional[str] = DescriptionField(
        default=None,
        description="Description of API key purpose"
    )
    
    # Sensitive field - stored encrypted in json_data
    secure_value: str = StandardField(
        description="The actual API key value (encrypted)"
    )
    
    # Status and expiration
    is_active: bool = True  # → Boolean column
    expires_at: Optional[datetime] = None  # → DateTime column
    
    # Permission arrays - stored in encrypted json_data
    scopes: List[str] = StandardField(
        default_factory=list,
        description="API scopes/permissions (e.g., ['read', 'write', 'delete'])"
    )
    allowed_ips: List[str] = StandardField(
        default_factory=list,
        description="Whitelist of allowed IP addresses"
    )
    
    # Rate limiting configuration
    rate_limit: Dict[str, Any] = StandardField(
        default_factory=lambda: {"requests": 1000, "period": "hour"},
        description="Rate limiting settings"
    )
    
    # Usage tracking - array of usage records
    usage_history: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Recent usage history with timestamps",
        json_schema_extra={
            "example": [
                {
                    "timestamp": "2024-01-15T10:30:00Z",
                    "endpoint": "/api/users",
                    "method": "GET",
                    "ip": "192.168.1.100",
                    "status": 200
                }
            ]
        }
    )
    
    # Metadata
    created_by: Optional[str] = KeyField(
        default=None,
        description="User ID who created this key"
    )
    last_used_at: Optional[datetime] = None


@register_persisted_model
class BlogPost(PersistedObject):
    """
    Blog Post model demonstrating rich content and arrays.
    
    Features:
    - Rich content blocks as arrays
    - Multi-language support with translations
    - SEO arrays (meta_keywords)
    - Social interaction tracking
    - Publishing workflow with DateTime
    - Complex nested structures
    """
    __table_name__ = "blog_posts"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "status", "published_at", "is_featured", "author_id"]
    __unique_fields__ = ["slug"]
    
    id: str = IDField(description="Blog post ID")
    slug: str = KeyField(description="URL-friendly slug (unique)")
    title: str = TitleField(description="Blog post title")
    subtitle: Optional[str] = TitleField(
        default=None,
        description="Blog post subtitle"
    )
    
    # Publishing workflow
    status: str = KeyField(
        default="draft",
        description="Post status (draft, published, archived)"
    )
    published_at: Optional[datetime] = None  # → DateTime column
    is_featured: bool = False  # → Boolean column
    
    # Author
    author_id: str = KeyField(description="Author user ID")
    
    # Rich content blocks - array of different content types
    content_blocks: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Structured content blocks (text, image, code, quote, etc.)",
        json_schema_extra={
            "example": [
                {
                    "type": "text",
                    "content": "This is a paragraph of text."
                },
                {
                    "type": "image",
                    "url": "https://example.com/image.jpg",
                    "caption": "Image caption",
                    "alt": "Alt text"
                },
                {
                    "type": "code",
                    "language": "python",
                    "content": "print('Hello, World!')"
                }
            ]
        }
    )
    
    # SEO
    meta_keywords: List[str] = StandardField(
        default_factory=list,
        description="SEO keywords array"
    )
    meta_description: Optional[str] = DescriptionField(
        default=None,
        description="SEO meta description"
    )
    
    # Categories and tags
    categories: List[str] = StandardField(
        default_factory=list,
        description="Category IDs"
    )
    tags: List[str] = StandardField(
        default_factory=list,
        description="Tag names"
    )
    
    # Multi-language support
    translations: Dict[str, Dict[str, str]] = StandardField(
        default_factory=dict,
        description="Translations for different languages",
        json_schema_extra={
            "example": {
                "es": {
                    "title": "Título en español",
                    "subtitle": "Subtítulo",
                    "meta_description": "Descripción"
                },
                "fr": {
                    "title": "Titre en français",
                    "subtitle": "Sous-titre",
                    "meta_description": "Description"
                }
            }
        }
    )
    
    # Social interaction tracking
    social_stats: Dict[str, int] = StandardField(
        default_factory=lambda: {
            "views": 0,
            "likes": 0,
            "shares": 0,
            "comments": 0
        },
        description="Social interaction statistics"
    )
    
    # Comments - array of comment objects
    comments: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Comments on this post",
        json_schema_extra={
            "example": [
                {
                    "id": "comment123",
                    "author_id": "user456",
                    "content": "Great post!",
                    "created_at": "2024-01-15T10:30:00Z",
                    "likes": 5
                }
            ]
        }
    )
    
    # Reading time estimate
    reading_time_minutes: int = 0  # → Integer column
