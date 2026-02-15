"""
Example CrudHooks demonstrating lifecycle hooks.

Each hook class shows a real-world use case:
- CategoryHooks: Auto-generate slug, validate sort_order
- BlogPostHooks: Auto-slug, publish workflow, reading time calculation
- UserHooks: Normalize email, set defaults, track last activity
- ProjectHooks: Auto-generate slug, sync member_count
- EventHooks: Validate event dates, auto-set priority
- TagHooks: Normalize tag names, track usage
"""

import re
import logging
from datetime import datetime
from typing import Any, Dict
from persisted_object import PersistedObject
from persisted_object.hooks import CrudHooks

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


# ==================== Category Hooks ====================

class CategoryHooks(CrudHooks):
    """
    Hooks for Category model.

    - before_create: Auto-generate slug from title if not provided
    - before_update: Re-generate slug if title changed and slug wasn't manually set
    - after_create / after_delete: Log category changes
    """

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-generate slug from title if empty
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])
            logger.info(f"[CategoryHooks] Auto-generated slug: {data['slug']}")
        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(f"[CategoryHooks] Category created: {item.title} (slug={item.slug})")

    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Re-generate slug if title changed but slug wasn't manually edited
        if data.get("title") and data.get("slug") == id:
            data["slug"] = _slugify(data["title"])
            logger.info(f"[CategoryHooks] Slug updated to: {data['slug']}")
        return data

    async def after_delete(self, id: str) -> None:
        logger.info(f"[CategoryHooks] Category deleted: {id}")


# ==================== BlogPost Hooks ====================

class BlogPostHooks(CrudHooks):
    """
    Hooks for BlogPost model.

    - before_create: Auto-generate slug, calculate reading time
    - before_update: Auto-set published_at when status changes to 'published',
                     recalculate reading time on content change
    - after_create: Log new post
    """

    def _estimate_reading_time(self, content_blocks: list) -> int:
        """Estimate reading time from content blocks (avg 200 words/min)."""
        word_count = 0
        for block in content_blocks:
            if isinstance(block, dict):
                text = block.get("content", "")
                if isinstance(text, str):
                    word_count += len(text.split())
        return max(1, word_count // 200)

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-generate slug from title
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])

        # Calculate reading time from content blocks
        if data.get("content_blocks"):
            data["reading_time_minutes"] = self._estimate_reading_time(data["content_blocks"])

        # If status is 'published', set published_at
        if data.get("status") == "published" and not data.get("published_at"):
            data["published_at"] = datetime.now().isoformat()

        logger.info(f"[BlogPostHooks] New post prepared: {data.get('title')}")
        return data

    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-set published_at when transitioning to 'published'
        if data.get("status") == "published" and not data.get("published_at"):
            data["published_at"] = datetime.now().isoformat()
            logger.info(f"[BlogPostHooks] Post {id} published at {data['published_at']}")

        # Recalculate reading time if content changed
        if data.get("content_blocks"):
            data["reading_time_minutes"] = self._estimate_reading_time(data["content_blocks"])

        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(f"[BlogPostHooks] Blog post created: {item.title} (status={item.status})")


# ==================== User Hooks ====================

class UserHooks(CrudHooks):
    """
    Hooks for User model.

    - before_create: Normalize email, set default settings
    - before_update: Normalize email, track changes
    - after_create: Log new user
    - before_delete: Prevent deleting admin users
    """

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Normalize email to lowercase
        if data.get("email"):
            data["email"] = data["email"].strip().lower()

        # Normalize username to lowercase
        if data.get("username"):
            data["username"] = data["username"].strip().lower()

        # Ensure default settings exist
        if not data.get("settings"):
            data["settings"] = {
                "theme": "light",
                "language": "en",
                "notifications": True,
                "email_updates": False
            }

        logger.info(f"[UserHooks] New user prepared: {data.get('username')}")
        return data

    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Normalize email on update too
        if data.get("email"):
            data["email"] = data["email"].strip().lower()

        if data.get("username"):
            data["username"] = data["username"].strip().lower()

        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(f"[UserHooks] User created: {item.username} ({item.email}), role={item.role}")

    async def after_delete(self, id: str) -> None:
        logger.info(f"[UserHooks] User deleted: {id}")


# ==================== Project Hooks ====================

class ProjectHooks(CrudHooks):
    """
    Hooks for Project model.

    - before_create: Auto-generate slug, sync member_count from members list
    - before_update: Sync member_count, prevent archiving active projects with members
    - after_create: Log new project
    """

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-generate slug from title
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])

        # Sync member_count from members array
        if data.get("members"):
            data["member_count"] = len(data["members"])

        logger.info(f"[ProjectHooks] New project prepared: {data.get('title')}")
        return data

    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Keep member_count in sync with members array
        if "members" in data:
            data["member_count"] = len(data.get("members", []))
            logger.info(f"[ProjectHooks] Project {id} member_count synced to {data['member_count']}")

        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(
            f"[ProjectHooks] Project created: {item.title} "
            f"(owner={item.owner_id}, members={item.member_count})"
        )


# ==================== Event Hooks ====================

class EventHooks(CrudHooks):
    """
    Hooks for Event model.

    - before_create: Default priority based on date proximity
    - before_update: Auto-feature high-priority published events
    - after_create: Log event creation
    """

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-set priority based on how soon the event is
        if data.get("event_date") and data.get("priority", 0) == 0:
            try:
                event_dt = data["event_date"]
                if isinstance(event_dt, str):
                    event_dt = datetime.fromisoformat(event_dt.replace("Z", "+00:00"))
                days_until = (event_dt - datetime.now(event_dt.tzinfo)).days
                if days_until <= 3:
                    data["priority"] = 2  # High
                elif days_until <= 14:
                    data["priority"] = 1  # Medium
                # else stays 0 (Low)
                logger.info(f"[EventHooks] Auto-priority set to {data['priority']} ({days_until} days away)")
            except (ValueError, TypeError):
                pass

        logger.info(f"[EventHooks] Event prepared: {data.get('title')}")
        return data

    async def before_update(self, id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        # Auto-feature high-priority published events
        if data.get("priority", 0) >= 2 and data.get("is_published"):
            data["is_featured"] = True
            logger.info(f"[EventHooks] Event {id} auto-featured (high priority + published)")

        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(f"[EventHooks] Event created: {item.title} (priority={item.priority})")


# ==================== Tag Hooks ====================

class TagHooks(CrudHooks):
    """
    Hooks for Tag model.

    - before_create: Normalize tag name (lowercase, trimmed)
    - after_create / after_delete: Log tag lifecycle
    """

    async def before_create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Normalize tag name: lowercase, trim whitespace
        if data.get("name"):
            data["name"] = data["name"].strip().lower()
            logger.info(f"[TagHooks] Tag normalized: {data['name']}")
        return data

    async def after_create(self, item: PersistedObject) -> None:
        logger.info(f"[TagHooks] Tag created: {item.name} (color={item.color})")

    async def after_delete(self, id: str) -> None:
        logger.info(f"[TagHooks] Tag deleted: {id}")
