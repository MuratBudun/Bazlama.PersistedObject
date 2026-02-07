# CrudHooks Usage Guide

## Overview

`CrudHooks` lets you inject custom logic **before** and **after** each CRUD operation — without modifying the router or the store. Just subclass `CrudHooks`, override the methods you need, and pass it to `create_crud_router()`.

## Hook Methods

| Method | Called When | Can Modify Data? |
|---|---|---|
| `before_create(data)` | Before inserting a new record | ✅ Returns modified `data` dict |
| `after_create(item)` | After successful insert | ❌ Read-only |
| `before_update(id, data)` | Before updating a record | ✅ Returns modified `data` dict |
| `after_update(item)` | After successful update | ❌ Read-only |
| `before_delete(id)` | Before deleting a record | ❌ Can raise to abort |
| `after_delete(id)` | After successful delete | ❌ Clean-up only |

## Example Hooks in This Project

### CategoryHooks — Auto-slug Generation

```python
class CategoryHooks(CrudHooks):
    async def before_create(self, data):
        # Auto-generate slug from title if not provided
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])
        return data
```

**What it does:** When you create a category with `title: "My Cool Category"`, the slug is automatically set to `my-cool-category`.

---

### BlogPostHooks — Publish Workflow & Reading Time

```python
class BlogPostHooks(CrudHooks):
    async def before_create(self, data):
        # Auto-generate slug
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])

        # Calculate reading time from content blocks
        if data.get("content_blocks"):
            data["reading_time_minutes"] = self._estimate_reading_time(data["content_blocks"])

        # Auto-set published_at when status is 'published'
        if data.get("status") == "published" and not data.get("published_at"):
            data["published_at"] = datetime.now().isoformat()
        return data

    async def before_update(self, id, data):
        # Auto-set published_at when transitioning to 'published'
        if data.get("status") == "published" and not data.get("published_at"):
            data["published_at"] = datetime.now().isoformat()

        # Recalculate reading time if content changed
        if data.get("content_blocks"):
            data["reading_time_minutes"] = self._estimate_reading_time(data["content_blocks"])
        return data
```

**What it does:**
- Auto-generates slug from title
- Calculates `reading_time_minutes` from content blocks (~200 words/min)
- Sets `published_at` timestamp when status changes to `"published"`

---

### UserHooks — Email Normalization

```python
class UserHooks(CrudHooks):
    async def before_create(self, data):
        # Normalize email and username to lowercase
        if data.get("email"):
            data["email"] = data["email"].strip().lower()
        if data.get("username"):
            data["username"] = data["username"].strip().lower()

        # Ensure default settings exist
        if not data.get("settings"):
            data["settings"] = {"theme": "light", "language": "en", ...}
        return data
```

**What it does:** Normalizes email/username to lowercase and trims whitespace. Ensures every user gets default settings.

---

### ProjectHooks — Member Count Sync

```python
class ProjectHooks(CrudHooks):
    async def before_create(self, data):
        if not data.get("slug") and data.get("title"):
            data["slug"] = _slugify(data["title"])
        if data.get("members"):
            data["member_count"] = len(data["members"])
        return data

    async def before_update(self, id, data):
        if "members" in data:
            data["member_count"] = len(data.get("members", []))
        return data
```

**What it does:** Keeps `member_count` (an indexed Integer column) in sync with the `members` array automatically.

---

### EventHooks — Auto Priority

```python
class EventHooks(CrudHooks):
    async def before_create(self, data):
        if data.get("event_date") and data.get("priority", 0) == 0:
            days_until = (event_dt - datetime.now()).days
            if days_until <= 3:
                data["priority"] = 2  # High
            elif days_until <= 14:
                data["priority"] = 1  # Medium
        return data
```

**What it does:** Automatically sets priority based on how soon the event is:
- ≤ 3 days → **High** (2)
- ≤ 14 days → **Medium** (1)
- Otherwise → **Low** (0)

---

### TagHooks — Name Normalization

```python
class TagHooks(CrudHooks):
    async def before_create(self, data):
        if data.get("name"):
            data["name"] = data["name"].strip().lower()
        return data
```

**What it does:** Normalizes tag names to lowercase to prevent duplicates like `"Python"` and `"python"`.

---

## How to Use

### 1. Define your hooks

```python
# src/hooks.py
from persisted_object.hooks import CrudHooks

class MyModelHooks(CrudHooks):
    async def before_create(self, data):
        data["slug"] = data["title"].lower().replace(" ", "-")
        return data
```

### 2. Pass to router

```python
# main.py
from src.hooks import MyModelHooks

router = create_crud_router(
    model=MyModel,
    store=my_store,
    prefix="/api/my-model",
    tags=["MyModel"],
    get_db=get_db,
    hooks=MyModelHooks(),  # ← Just pass it here!
)
```

That's it! No middleware, no decorators, no monkey-patching.

## Logging

All hooks in this example use Python's `logging` module. Set log level to `INFO` to see hook activity:

```
[CategoryHooks] Auto-generated slug: my-cool-category
[BlogPostHooks] Post post-123 published at 2026-02-07T14:30:00
[UserHooks] User created: john_doe (john@example.com), role=user
[ProjectHooks] Project my-project member_count synced to 5
[EventHooks] Auto-priority set to 2 (2 days away)
[TagHooks] Tag normalized: python
```
