"""
Seed data script for example project.

Creates sample data demonstrating all model features:
- AppSettings with different categories
- Categories with boolean and integer fields
- Tags with usage counts
- Users with datetime fields
- Projects with complex arrays
- Events with datetime for date queries
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.database import SessionLocal, create_tables_sync
from src.models import AppSettings, Category, Tag, User, Project, Event, ApiKey, BlogPost
from persisted_object import Store

from hmac import new
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    
# Load environment variables from .env file
env_path = Path(__file__).parent / ".." / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"Loaded environment variables from {env_path}")
else:
    print(f"No .env file found at {env_path}, using system environment variables")

if "PERSISTED_OBJECT_ENCRYPTION_KEY" not in os.environ:
    raise RuntimeError("PERSISTED_OBJECT_ENCRYPTION_KEY not set in environment variables. "
                       "Set this to a secure random value for encrypted fields to work.")

if "PERSISTED_OBJECT_ENCRYPTION_SALT" not in os.environ:
    raise RuntimeError("PERSISTED_OBJECT_ENCRYPTION_SALT not set in environment variables. "
                       "Set this to a secure random value for encrypted fields to work.") 
        

# Create stores at module level (after imports)
settings_store = Store(AppSettings)
category_store = Store(Category)
tag_store = Store(Tag)
user_store = Store(User)
project_store = Store(Project)
event_store = Store(Event)
apikey_store = Store(ApiKey)
blogpost_store = Store(BlogPost)


def seed_settings(db: Session):
    """Seed application settings."""
    print("Seeding AppSettings...")
    
    settings = [
        AppSettings(
            key="app_name",
            value="PersistedObject Demo",
            category="general",
            description="Application display name"
        ),
        AppSettings(
            key="items_per_page",
            value="20",
            category="ui",
            description="Default items per page in lists"
        ),
        AppSettings(
            key="enable_notifications",
            value="true",
            category="features",
            description="Enable user notifications"
        ),
        AppSettings(
            key="max_upload_size",
            value="10485760",
            category="limits",
            description="Maximum file upload size in bytes (10MB)"
        ),
    ]
    
    for setting in settings:
        try:
            settings_store.create(db, setting)
            print(f"  ✓ Created setting: {setting.key}")
        except Exception as e:
            print(f"  ✗ Skipping {setting.key}: {e}")


def seed_categories(db: Session):
    """Seed categories with boolean and integer fields."""
    print("\nSeeding Categories...")
    
    categories = [
        Category(
            id="tech",
            slug="technology",
            title="Technology",
            description="Technology and software development topics",
            icon="💻",
            is_active=True,
            sort_order=1
        ),
        Category(
            id="science",
            slug="science",
            title="Science",
            description="Scientific discoveries and research",
            icon="🔬",
            is_active=True,
            sort_order=2
        ),
        Category(
            id="business",
            slug="business",
            title="Business",
            description="Business and entrepreneurship",
            icon="💼",
            is_active=True,
            sort_order=3
        ),
        Category(
            id="health",
            slug="health",
            title="Health",
            description="Health and wellness topics",
            icon="🏥",
            is_active=False,  # Inactive category
            sort_order=4
        ),
    ]
    
    for category in categories:
        try:
            category_store.create(db, category)
            status = "active" if category.is_active else "inactive"
            print(f"  ✓ Created category: {category.title} ({status})")
        except Exception as e:
            print(f"  ✗ Skipping {category.title}: {e}")


def seed_tags(db: Session):
    """Seed tags."""
    print("\nSeeding Tags...")
    
    tags = [
        Tag(name="python", color="#3776ab", usage_count=15),
        Tag(name="javascript", color="#f7df1e", usage_count=12),
        Tag(name="fastapi", color="#009688", usage_count=8),
        Tag(name="react", color="#61dafb", usage_count=10),
        Tag(name="database", color="#4479a1", usage_count=6),
        Tag(name="tutorial", color="#ff6b6b", usage_count=20),
    ]
    
    for tag in tags:
        try:
            tag_store.create(db, tag)
            print(f"  ✓ Created tag: {tag.name} (used {tag.usage_count} times)")
        except Exception as e:
            print(f"  ✗ Skipping {tag.name}: {e}")


def seed_users(db: Session):
    """Seed users with datetime fields."""
    print("\nSeeding Users...")
    
    now = datetime.now()
    users = [
        User(
            id="user_admin",
            email="admin@example.com",
            username="admin",
            full_name="Admin User",
            role="admin",
            is_active=True,
            last_login=now - timedelta(hours=2),
            tags=["admin", "staff"],
            permissions=["read", "write", "delete", "manage_users"],
            favorite_categories=["tech", "science"],
            profile={"avatar": "admin.jpg", "bio": "System administrator"},
            settings={"theme": "dark", "language": "en", "notifications": True}
        ),
        User(
            id="user_john",
            email="john@example.com",
            username="johndoe",
            full_name="John Doe",
            role="user",
            is_active=True,
            last_login=now - timedelta(days=1),
            tags=["developer", "python"],
            permissions=["read", "write"],
            favorite_categories=["tech"],
            profile={"avatar": "john.jpg", "bio": "Python developer"},
            settings={"theme": "light", "language": "en"}
        ),
        User(
            id="user_jane",
            email="jane@example.com",
            username="janedoe",
            full_name="Jane Doe",
            role="user",
            is_active=False,  # Inactive user
            last_login=now - timedelta(days=30),
            tags=["designer"],
            permissions=["read"],
            favorite_categories=["business"],
            profile={"avatar": "jane.jpg", "bio": "UI/UX Designer"},
            settings={"theme": "light", "language": "en"}
        ),
    ]
    
    for user in users:
        try:
            user_store.create(db, user)
            status = "active" if user.is_active else "inactive"
            print(f"  ✓ Created user: {user.username} ({status}, role: {user.role})")
        except Exception as e:
            print(f"  ✗ Skipping {user.username}: {e}")


def seed_projects(db: Session):
    """Seed projects with complex arrays."""
    print("\nSeeding Projects...")
    
    projects = [
        Project(
            id="proj_api",
            slug="modern-api",
            title="Modern API Project",
            description="Building a scalable REST API with FastAPI",
            status="active",
            owner_id="user_admin",
            is_public=True,
            member_count=3,
            tags=["api", "fastapi", "python"],
            members=[
                {"user_id": "user_admin", "role": "owner", "permissions": ["all"]},
                {"user_id": "user_john", "role": "developer", "permissions": ["read", "write"]},
            ],
            milestones=[
                {"title": "MVP", "due_date": "2024-03-01", "completed": True},
                {"title": "Beta Release", "due_date": "2024-06-01", "completed": False},
            ]
        ),
        Project(
            id="proj_frontend",
            slug="react-dashboard",
            title="React Dashboard",
            description="Admin dashboard with React and TypeScript",
            status="draft",
            owner_id="user_john",
            is_public=False,
            member_count=1,
            tags=["react", "typescript", "dashboard"],
            members=[
                {"user_id": "user_john", "role": "owner", "permissions": ["all"]},
            ],
            milestones=[]
        ),
    ]
    
    for project in projects:
        try:
            project_store.create(db, project)
            visibility = "public" if project.is_public else "private"
            print(f"  ✓ Created project: {project.title} ({visibility}, {project.member_count} members)")
        except Exception as e:
            print(f"  ✗ Skipping {project.title}: {e}")


def seed_events(db: Session):
    """Seed events with datetime fields for date-based queries."""
    print("\nSeeding Events...")
    
    now = datetime.now()
    events = [
        Event(
            id="event_conf",
            title="Python Conference 2024",
            description="Annual Python developers conference",
            category="conference",
            event_date=now + timedelta(days=30),
            is_published=True,
            is_featured=True,
            priority=2,  # High priority
            location={
                "venue": "Tech Convention Center",
                "address": "123 Silicon Valley Blvd",
                "city": "San Francisco",
                "coordinates": {"lat": 37.7749, "lng": -122.4194}
            },
            attendees=["user_admin", "user_john"]
        ),
        Event(
            id="event_workshop",
            title="FastAPI Workshop",
            description="Hands-on workshop for building APIs with FastAPI",
            category="workshop",
            event_date=now + timedelta(days=7),
            is_published=True,
            is_featured=False,
            priority=1,  # Medium priority
            location={
                "venue": "Co-Working Space",
                "address": "456 Startup Lane",
                "city": "San Francisco",
            },
            attendees=["user_john"]
        ),
        Event(
            id="event_meetup",
            title="Local Developer Meetup",
            description="Monthly meetup for local developers",
            category="meetup",
            event_date=now - timedelta(days=5),  # Past event
            is_published=True,
            is_featured=False,
            priority=0,  # Low priority
            location={
                "venue": "Coffee Shop",
                "address": "789 Main Street",
                "city": "San Francisco",
            },
            attendees=["user_admin", "user_john", "user_jane"]
        ),
    ]
    
    for event in events:
        try:
            event_store.create(db, event)
            time_str = "past" if event.event_date < now else "upcoming"
            featured = " ⭐" if event.is_featured else ""
            print(f"  ✓ Created event: {event.title} ({time_str}){featured}")
        except Exception as e:
            print(f"  ✗ Skipping {event.title}: {e}")


def seed_apikeys(db: Session):
    """Seed API keys with encrypted storage."""
    print("\nSeeding API Keys...")
    
    now = datetime.now()
    apikeys = [
        ApiKey(
            id="key_prod",
            name="Production API Key",
            description="Main production API key for client applications",
            secure_value="sk_prod_abc123xyz789_secret_key_value",
            is_active=True,
            expires_at=now + timedelta(days=365),  # 1 year
            scopes=["read", "write"],
            allowed_ips=["203.0.113.0/24", "198.51.100.0/24"],
            rate_limit={"requests": 5000, "period": "hour"},
            created_by="user_admin",
            usage_history=[
                {
                    "timestamp": (now - timedelta(hours=2)).isoformat(),
                    "endpoint": "/api/users",
                    "method": "GET",
                    "ip": "203.0.113.10",
                    "status": 200
                },
                {
                    "timestamp": (now - timedelta(hours=1)).isoformat(),
                    "endpoint": "/api/projects",
                    "method": "POST",
                    "ip": "203.0.113.10",
                    "status": 201
                }
            ]
        ),
        ApiKey(
            id="key_dev",
            name="Development API Key",
            description="Development and testing key",
            secure_value="sk_dev_test123_development_key",
            is_active=True,
            expires_at=now + timedelta(days=30),  # 30 days
            scopes=["read"],
            allowed_ips=["127.0.0.1", "::1"],
            rate_limit={"requests": 100, "period": "hour"},
            created_by="user_admin",
            usage_history=[]
        ),
        ApiKey(
            id="key_analytics",
            name="Analytics Service Key",
            description="Key for analytics service integration",
            secure_value="sk_analytics_xyz789abc123_service_key",
            is_active=True,
            expires_at=None,  # No expiration
            scopes=["read", "analytics"],
            allowed_ips=[],  # No IP restriction
            rate_limit={"requests": 10000, "period": "day"},
            created_by="user_admin",
            last_used_at=now - timedelta(minutes=30)
        ),
    ]
    
    for apikey in apikeys:
        try:
            apikey_store.create(db, apikey)
            expiry = f"expires {apikey.expires_at.strftime('%Y-%m-%d')}" if apikey.expires_at else "no expiration"
            status = "🟢" if apikey.is_active else "🔴"
            print(f"  {status} Created API key: {apikey.name} ({expiry})")
        except Exception as e:
            print(f"  ✗ Skipping {apikey.name}: {e}")


def seed_blogposts(db: Session):
    """Seed blog posts with rich content."""
    print("\nSeeding Blog Posts...")
    
    now = datetime.now()
    blogposts = [
        BlogPost(
            id="post_intro",
            slug="getting-started-with-persisted-object",
            title="Getting Started with PersistedObject",
            subtitle="Build APIs in minutes with zero boilerplate",
            status="published",
            published_at=now - timedelta(days=7),
            is_featured=True,
            author_id="user_admin",
            content_blocks=[
                {
                    "type": "text",
                    "content": "PersistedObject makes it incredibly easy to build REST APIs without writing boilerplate code."
                },
                {
                    "type": "code",
                    "language": "python",
                    "content": "from persisted_object import PersistedObject, Store\n\nclass User(PersistedObject):\n    __table_name__ = 'users'\n    name: str\n    email: str"
                },
                {
                    "type": "text",
                    "content": "That's all you need to get started!"
                }
            ],
            meta_keywords=["python", "fastapi", "rest-api", "tutorial"],
            meta_description="Learn how to build REST APIs quickly using PersistedObject",
            categories=["tech"],
            tags=["python", "fastapi", "tutorial"],
            translations={
                "es": {
                    "title": "Comenzando con PersistedObject",
                    "subtitle": "Construye APIs en minutos sin código repetitivo",
                    "meta_description": "Aprende a construir APIs REST rápidamente"
                }
            },
            social_stats={
                "views": 1250,
                "likes": 89,
                "shares": 34,
                "comments": 12
            },
            comments=[
                {
                    "id": "comment1",
                    "author_id": "user_john",
                    "content": "This is amazing! Just what I needed.",
                    "created_at": (now - timedelta(days=6)).isoformat(),
                    "likes": 5
                }
            ],
            reading_time_minutes=5
        ),
        BlogPost(
            id="post_encryption",
            slug="secure-data-with-encryption",
            title="Securing Sensitive Data with Encryption",
            subtitle="How to use encrypted JSON storage",
            status="published",
            published_at=now - timedelta(days=3),
            is_featured=False,
            author_id="user_jane",
            content_blocks=[
                {
                    "type": "text",
                    "content": "When handling sensitive data like API keys, encryption is essential."
                },
                {
                    "type": "image",
                    "url": "https://example.com/encryption.jpg",
                    "caption": "Encryption flow diagram",
                    "alt": "How encryption works"
                },
                {
                    "type": "code",
                    "language": "python",
                    "content": "class ApiKey(PersistedObject):\n    __encrypt_json__ = True  # Enable encryption\n    secure_value: str"
                }
            ],
            meta_keywords=["security", "encryption", "data-protection"],
            meta_description="Learn how to encrypt sensitive data in your applications",
            categories=["tech"],
            tags=["database", "python"],
            social_stats={
                "views": 850,
                "likes": 67,
                "shares": 23,
                "comments": 8
            },
            reading_time_minutes=8
        ),
    ]
    
    for post in blogposts:
        try:
            blogpost_store.create(db, post)
            featured = " ⭐" if post.is_featured else ""
            print(f"  ✓ Created blog post: {post.title}{featured}")
        except Exception as e:
            print(f"  ✗ Skipping {post.title}: {e}")


def main():
    """Main seed function."""
    print("\nStarting database seeding...\n")
    print("=" * 60)
    
    # Create tables (models already imported at module level)
    create_tables_sync()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Seed all data
        seed_settings(db)
        seed_categories(db)
        seed_tags(db)
        seed_users(db)
        seed_projects(db)
        seed_events(db)
        seed_apikeys(db)
        seed_blogposts(db)
        
        print("\n" + "=" * 60)
        print("\nDatabase seeding completed successfully!")
        print("\nSummary:")
        print("  - AppSettings: Key-value configuration")
        print("  - Categories: With boolean (is_active) and integer (sort_order)")
        print("  - Tags: With usage counts")
        print("  - Users: With datetime (last_login) and composite unique constraints")
        print("  - Projects: With complex arrays and nested data")
        print("  - Events: With datetime for date-based queries")
        print("  - ApiKeys: With encrypted JSON storage (requires cryptography)")
        print("  - BlogPosts: With rich content blocks and multi-language support")
        print("\nStart the server with: python main.py")
        print("View API docs at: http://localhost:8000/docs\n")
        
    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
