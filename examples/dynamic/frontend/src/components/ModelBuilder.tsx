import { useState } from 'react'
import {
  Stack, Button, Group, Card, Text,
  Alert, ThemeIcon, Title,
  Paper, Badge, Tabs, ScrollArea,
  Code, Accordion, List, Tooltip, CopyButton, ActionIcon,
  SimpleGrid, Box, useComputedColorScheme
} from '@mantine/core'
import {
  IconCode, IconTemplate, IconHelp,
  IconPlayerPlay, IconBook, IconCopy, IconCheck,
  IconDatabase, IconBraces, IconKey, IconSearch,
  IconLock, IconId, IconTextCaption, IconFileDescription,
  IconArticle, IconLink
} from '@tabler/icons-react'

interface ModelBuilderProps {
  onCreated: (modelName: string) => void
  registerModelScript: (script: string) => Promise<any>
}

// ==================== Template Scripts from Basic Example ====================

const TEMPLATES: { name: string; color: string; description: string; script: string }[] = [
  {
    name: 'AppSettings',
    color: 'teal',
    description: 'Key-value configuration store. Simple and practical.',
    script: `class AppSettings(PersistedObject):
    """
    Application settings model.
    A simple key-value store for application configuration.
    """
    __table_name__ = "app_settings"
    __primary_key__ = "key"
    __indexed_fields__ = ["key", "category"]

    key: str = KeyField(description="Setting key (unique identifier)", json_schema_extra={"ui_width": 3, "ui_index": 0})
    value: str = StandardField(description="Setting value", json_schema_extra={"ui_width": 6, "ui_index": 2})
    category: str = KeyField(default="general", description="Setting category", json_schema_extra={"ui_width": 3, "ui_index": 1})
    description: Optional[str] = DescriptionField(
        default=None,
        description="Description of what this setting does",
        json_schema_extra={"ui_index": 6}
    )
`,
  },
  {
    name: 'Category',
    color: 'blue',
    description: 'Boolean, Integer, unique slug, auto timestamps.',
    script: `class Category(PersistedObject):
    """
    Category model demonstrating multiple column types.
    Boolean (is_active), Integer (sort_order), unique slug.
    """
    __table_name__ = "categories"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "is_active", "sort_order"]
    __unique_fields__ = ["slug"]

    id: str = KeyField(description="Category ID", json_schema_extra={"ui_width": 2, "ui_index": 0})
    slug: str = KeyField(description="URL-friendly slug (unique)", json_schema_extra={"ui_width": 2, "ui_index": 1})
    title: str = TitleField(description="Category display title", json_schema_extra={"ui_width": 2, "ui_index": 2})
    description: Optional[str] = DescriptionField(
        default=None,
        description="Category description",
        json_schema_extra={"ui_index": 3}
    )
    icon: Optional[str] = KeyField(
        default="folder",
        description="Icon name for UI",
        json_schema_extra={"ui_width": 2, "ui_index": 4}
    )
    is_active: bool = StandardField(default=True, description="Whether category is active", json_schema_extra={"ui_width": 2, "ui_index": 5})
    sort_order: int = StandardField(default=0, description="Display sort order", json_schema_extra={"ui_width": 2, "ui_index": 6})
`,
  },
  {
    name: 'Tag',
    color: 'cyan',
    description: 'Minimal model — name, color picker, usage count.',
    script: `class Tag(PersistedObject):
    """Simple tag model with color and usage count."""
    __table_name__ = "tags"
    __primary_key__ = "name"
    __indexed_fields__ = ["name"]

    name: str = KeyField(description="Tag name (unique)", json_schema_extra={"ui_width": 3, "ui_index": 0})
    color: Optional[str] = KeyField(
        default="#3b82f6",
        description="Hex color code for UI",
        json_schema_extra={"ui_component": "ColorPicker", "ui_width": 3, "ui_index": 1}
    )
    usage_count: int = StandardField(
        default=0,
        description="Number of times this tag is used",
        json_schema_extra={"ui_width": 3, "ui_index": 2}
    )
`,
  },
  {
    name: 'User',
    color: 'violet',
    description: 'Advanced: arrays, nested data, unique constraints, DateTime.',
    script: `class User(PersistedObject):
    """
    User model with composite unique, DateTime, arrays, nested data.
    """
    __table_name__ = "users"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "email", "username", "is_active", "role", "last_login"]
    __unique_fields__ = ["email", "username"]

    id: str = IDField(description="User ID (ULID)", json_schema_extra={"ui_width": 2, "ui_index": 0})
    email: str = KeyField(description="Email address (unique)", json_schema_extra={"ui_width": 2, "ui_index": 2})
    username: str = KeyField(description="Username (unique)", json_schema_extra={"ui_width": 2, "ui_index": 1})
    full_name: str = TitleField(description="Full display name", json_schema_extra={"ui_width": 3, "ui_index": 3})
    role: str = KeyField(
        default="user",
        description="User role (admin, user, guest)",
        json_schema_extra={
            "ui_component": "StatusBadge",
            "ui_width": 2,
            "ui_index": 4,
            "ui_props": {
                "options": [
                    {"value": "admin", "label": "Admin", "color": "red"},
                    {"value": "user", "label": "User", "color": "blue"},
                    {"value": "guest", "label": "Guest", "color": "gray"}
                ]
            }
        }
    )
    is_active: bool = StandardField(default=True, description="Whether user is active", json_schema_extra={"ui_width": 1, "ui_index": 5})
    last_login: Optional[datetime] = StandardField(default=None, description="Last login date and time", json_schema_extra={"ui_width": 3, "ui_index": 6})

    # Array fields -- stored in json_data
    tags: List[str] = StandardField(
        default_factory=list,
        description="User tags for categorization",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 7}
    )
    permissions: List[str] = StandardField(
        default_factory=list,
        description="List of permissions granted to user",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 8}
    )

    # Complex nested data -- stored in json_data
    profile: Dict[str, Any] = StandardField(
        default_factory=dict,
        description="User profile data (avatar, bio, preferences, etc.)",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 10}
    )
    settings: Dict[str, Any] = StandardField(
        default_factory=lambda: {
            "theme": "light",
            "language": "en",
            "notifications": True,
            "email_updates": False
        },
        description="User preferences and settings",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 11}
    )
`,
  },
  {
    name: 'Project',
    color: 'green',
    description: 'Arrays of objects, members with roles, milestones.',
    script: `class Project(PersistedObject):
    """
    Project model with complex arrays, members, milestones.
    """
    __table_name__ = "projects"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "status", "owner_id", "is_public", "member_count"]
    __unique_fields__ = ["slug"]

    id: str = IDField(description="Project ID", json_schema_extra={"ui_width": 2, "ui_index": 0})
    slug: str = KeyField(description="URL-friendly project slug", json_schema_extra={"ui_width": 2, "ui_index": 1})
    title: str = TitleField(description="Project title", json_schema_extra={"ui_width": 2, "ui_index": 2})
    description: Optional[str] = DescriptionField(
        default=None,
        description="Project description",
        json_schema_extra={"ui_index": 3}
    )
    status: str = KeyField(
        default="draft",
        description="Project status",
        json_schema_extra={
            "ui_component": "StatusBadge",
            "ui_width": 2,
            "ui_index": 4,
            "ui_props": {
                "options": [
                    {"value": "draft", "label": "Draft", "color": "gray"},
                    {"value": "active", "label": "Active", "color": "green"},
                    {"value": "completed", "label": "Completed", "color": "blue"},
                    {"value": "archived", "label": "Archived", "color": "orange"}
                ]
            }
        }
    )
    owner_id: str = KeyField(description="ID of project owner", json_schema_extra={"ui_width": 2, "ui_index": 5})
    is_public: bool = StandardField(default=False, description="Whether project is public", json_schema_extra={"ui_width": 1, "ui_index": 6})
    member_count: int = StandardField(default=0, description="Number of members", json_schema_extra={"ui_width": 1, "ui_index": 7})

    tags: List[str] = StandardField(
        default_factory=list,
        description="Project tags",
        json_schema_extra={"ui_component": "TagsInput", "ui_index": 8}
    )
    members: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Project members with roles",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 9}
    )
    milestones: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Project milestones with deadlines",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 10}
    )
`,
  },
  {
    name: 'Event',
    color: 'orange',
    description: 'DateTime fields, PriorityIndicator, boolean flags.',
    script: `class Event(PersistedObject):
    """
    Event model with DateTime, Boolean, and PriorityIndicator.
    """
    __table_name__ = "events"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "event_date", "is_published", "category", "priority"]

    id: str = IDField(description="Event ID", json_schema_extra={"ui_width": 3, "ui_index": 0})
    title: str = TitleField(description="Event title", json_schema_extra={"ui_width": 3, "ui_index": 1})
    description: Optional[str] = DescriptionField(
        default=None,
        description="Event description",
        json_schema_extra={"ui_index": 2}
    )
    category: str = KeyField(default="general", description="Event category", json_schema_extra={"ui_width": 2, "ui_index": 3})

    event_date: datetime = StandardField(
        default_factory=datetime.now,
        description="Event date and time",
        json_schema_extra={"ui_width": 2, "ui_index": 4}
    )

    is_published: bool = StandardField(default=False, description="Whether event is published", json_schema_extra={"ui_width": 1, "ui_index": 5})
    is_featured: bool = StandardField(default=False, description="Whether event is featured", json_schema_extra={"ui_width": 1, "ui_index": 6})

    priority: int = StandardField(
        default=0,
        description="Priority level (0=low, 1=medium, 2=high)",
        json_schema_extra={
            "ui_component": "PriorityIndicator",
            "ui_width": 3,
            "ui_index": 7,
            "ui_props": {
                "levels": [
                    {"value": 0, "label": "Low", "color": "green"},
                    {"value": 1, "label": "Medium", "color": "yellow"},
                    {"value": 2, "label": "High", "color": "red"}
                ]
            }
        }
    )

    location: Dict[str, Any] = StandardField(
        default_factory=dict,
        description="Event location (venue, address, coordinates)",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 8}
    )
    attendees: List[str] = StandardField(
        default_factory=list,
        description="List of attendee user IDs",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 9}
    )
`,
  },
  {
    name: 'ApiKey',
    color: 'red',
    description: 'Encrypted JSON storage, rate limiting, usage tracking.',
    script: `class ApiKey(PersistedObject):
    """
    API Key model with encrypted storage.
    Enable encryption: __encrypt_json__ = True (requires: pip install cryptography)
    """
    __table_name__ = "api_keys"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "name", "is_active", "expires_at"]
    __unique_fields__ = ["name"]
    # __encrypt_json__ = True  # Uncomment to enable encryption

    id: str = IDField(description="API Key ID", json_schema_extra={"ui_width": 3, "ui_index": 0})
    name: str = KeyField(description="API Key name (unique)", json_schema_extra={"ui_width": 3, "ui_index": 1})
    description: Optional[str] = DescriptionField(
        default=None,
        description="Description of API key purpose",
        json_schema_extra={"ui_index": 2}
    )

    secure_value: str = PasswordField(
        description="The actual API key value (encrypted)",
        json_schema_extra={"ui_index": 3}
    )

    is_active: bool = StandardField(default=True, description="Whether key is active", json_schema_extra={"ui_width": 2, "ui_index": 4})
    expires_at: Optional[datetime] = StandardField(default=None, description="Expiration date", json_schema_extra={"ui_width": 2, "ui_index": 5})

    scopes: List[str] = StandardField(
        default_factory=list,
        description="API scopes/permissions",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 6}
    )
    allowed_ips: List[str] = StandardField(
        default_factory=list,
        description="Whitelist of allowed IP addresses",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 7}
    )

    rate_limit: Dict[str, Any] = StandardField(
        default_factory=lambda: {"requests": 1000, "period": "hour"},
        description="Rate limiting settings",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 8}
    )
    usage_history: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Recent usage history",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 9}
    )

    created_by: Optional[str] = KeyField(
        default=None,
        description="User ID who created this key",
        json_schema_extra={"ui_width": 2, "ui_index": 10}
    )
    last_used_at: Optional[datetime] = StandardField(default=None, description="Last used date", json_schema_extra={"ui_width": 2, "ui_index": 11})
`,
  },
  {
    name: 'BlogPost',
    color: 'pink',
    description: 'Rich content blocks, SEO, translations, social stats.',
    script: `class BlogPost(PersistedObject):
    """
    Blog Post model with rich content, SEO, translations, and comments.
    """
    __table_name__ = "blog_posts"
    __primary_key__ = "id"
    __indexed_fields__ = ["id", "slug", "status", "published_at", "is_featured", "author_id"]
    __unique_fields__ = ["slug"]

    id: str = IDField(description="Blog post ID", json_schema_extra={"ui_width": 2, "ui_index": 0})
    slug: str = KeyField(description="URL-friendly slug (unique)", json_schema_extra={"ui_width": 2, "ui_index": 1})
    title: str = TitleField(description="Blog post title", json_schema_extra={"ui_width": 2, "ui_index": 2})
    subtitle: Optional[str] = TitleField(
        default=None,
        description="Blog post subtitle",
        json_schema_extra={"ui_index": 3}
    )

    status: str = KeyField(
        default="draft",
        description="Post status",
        json_schema_extra={
            "ui_component": "StatusBadge",
            "ui_width": 2,
            "ui_index": 4,
            "ui_props": {
                "options": [
                    {"value": "draft", "label": "Draft", "color": "gray"},
                    {"value": "published", "label": "Published", "color": "green"},
                    {"value": "archived", "label": "Archived", "color": "orange"}
                ]
            }
        }
    )
    published_at: Optional[datetime] = StandardField(default=None, description="Publish date", json_schema_extra={"ui_width": 2, "ui_index": 5})
    is_featured: bool = StandardField(default=False, description="Whether post is featured", json_schema_extra={"ui_width": 1, "ui_index": 6})
    author_id: str = KeyField(description="Author user ID", json_schema_extra={"ui_width": 1, "ui_index": 7})

    content_blocks: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Structured content blocks (text, image, code, quote)",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 8}
    )

    meta_keywords: List[str] = StandardField(
        default_factory=list,
        description="SEO keywords",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 9}
    )
    meta_description: Optional[str] = DescriptionField(
        default=None,
        description="SEO meta description",
        json_schema_extra={"ui_width": 3, "ui_index": 10}
    )

    categories: List[str] = StandardField(
        default_factory=list,
        description="Category IDs",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 11}
    )
    tags: List[str] = StandardField(
        default_factory=list,
        description="Tag names",
        json_schema_extra={"ui_component": "TagsInput", "ui_width": 3, "ui_index": 12}
    )

    translations: Dict[str, Dict[str, str]] = StandardField(
        default_factory=dict,
        description="Multi-language translations",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 13}
    )

    social_stats: Dict[str, int] = StandardField(
        default_factory=lambda: {"views": 0, "likes": 0, "shares": 0, "comments": 0},
        description="Social interaction statistics",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 14}
    )

    comments: List[Dict[str, Any]] = StandardField(
        default_factory=list,
        description="Comments on this post",
        json_schema_extra={"ui_component": "JsonEditor", "ui_index": 15}
    )

    reading_time_minutes: int = StandardField(default=0, description="Estimated reading time", json_schema_extra={"ui_width": 2, "ui_index": 16})
`,
  },
]

// ==================== Help Content ====================

function HelpPanel() {
  return (
    <ScrollArea h="calc(100vh - 260px)" offsetScrollbars>
      <Stack gap="md">
        <Alert variant="light" color="teal" title="PersistedObject Model Definition" icon={<IconBook size={18} />}>
          <Text size="sm">
            A PersistedObject model is a Python class that defines your data structure.
            Primary key and indexed fields become real database columns for fast queries.
            Everything else is stored as JSON — supporting arrays, nested objects, any structure.
          </Text>
        </Alert>

        <Accordion variant="separated" radius="md" defaultValue="structure">
          {/* Class Structure */}
          <Accordion.Item value="structure">
            <Accordion.Control icon={<IconCode size={18} />}>
              <Text fw={600} size="sm">Class Structure</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm">Every model must inherit from <Code>PersistedObject</Code> and define these class variables:</Text>
                <Code block>{`class MyModel(PersistedObject):
    """Model description (becomes API documentation)."""
    __table_name__ = "my_table"          # Database table name
    __primary_key__ = "id"               # Primary key field name
    __indexed_fields__ = ["id", "name"]  # Fields that become DB columns
    __unique_fields__ = ["name"]         # Optional: fields with UNIQUE constraint
    # __encrypt_json__ = True            # Optional: encrypt JSON data

    id: str = IDField(description="Unique ID")
    name: str = KeyField(description="Name")`}</Code>
                <List size="sm" spacing={4}>
                  <List.Item><Code>__table_name__</Code> — Database table name (snake_case, plural)</List.Item>
                  <List.Item><Code>__primary_key__</Code> — Which field is the primary key</List.Item>
                  <List.Item><Code>__indexed_fields__</Code> — Fields stored as real DB columns (for queries)</List.Item>
                  <List.Item><Code>__unique_fields__</Code> — Fields with UNIQUE constraint (optional)</List.Item>
                  <List.Item><Code>__encrypt_json__</Code> — Encrypt the JSON data column (optional, needs <Code>cryptography</Code> package)</List.Item>
                </List>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Field Helpers */}
          <Accordion.Item value="field-helpers">
            <Accordion.Control icon={<IconDatabase size={18} />}>
              <Text fw={600} size="sm">Field Helpers</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="sm">
                <Text size="sm">PersistedObject provides field helper functions that set appropriate defaults:</Text>

                <SimpleGrid cols={2} spacing="xs">
                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="yellow"><IconKey size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">KeyField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Short indexed strings (max 200 chars). For IDs, slugs, categories.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="blue"><IconTextCaption size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">TitleField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Display titles and names (max 500 chars).</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="grape"><IconFileDescription size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">DescriptionField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Descriptions (max 2000 chars). Stored in JSON.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="teal"><IconBraces size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">StandardField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">General purpose. No max_length. Use for any type.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="orange"><IconArticle size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">ContentField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Long content (max 50K chars). For articles, markdown.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="indigo"><IconId size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">IDField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Auto-generated ULID. Use for primary keys.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="red"><IconLock size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">PasswordField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Sensitive data. Renders as password input in forms.</Text>
                  </Card>

                  <Card withBorder padding="xs" radius="sm">
                    <Group gap={4} mb={2}>
                      <ThemeIcon size="xs" variant="light" color="cyan"><IconLink size={10} /></ThemeIcon>
                      <Text size="xs" fw={600} ff="monospace">ReferenceIDField</Text>
                    </Group>
                    <Text size="xs" c="dimmed">Foreign key reference to another model.</Text>
                  </Card>
                </SimpleGrid>

                <Text size="xs" c="dimmed" mt={4}>
                  You can also use the Pydantic <Code>Field()</Code> directly for full control.
                </Text>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Python Types */}
          <Accordion.Item value="types">
            <Accordion.Control icon={<IconBraces size={18} />}>
              <Text fw={600} size="sm">Python Types & Storage</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Simple types (can be DB columns when indexed):</Text>
                <Code block>{`name: str          # String → TEXT column
count: int         # Integer → INTEGER column
is_active: bool    # Boolean → BOOLEAN column
created: datetime  # DateTime → TEXT column (ISO format)`}</Code>

                <Text size="sm" fw={600} mt="xs">Complex types (always stored in JSON):</Text>
                <Code block>{`tags: List[str]                    # Array of strings
config: Dict[str, Any]             # Nested JSON object
members: List[Dict[str, Any]]      # Array of objects`}</Code>

                <Text size="sm" fw={600} mt="xs">Optional fields:</Text>
                <Code block>{`name: Optional[str] = Field(default=None)
tags: List[str] = StandardField(default_factory=list)`}</Code>

                <Alert variant="light" color="blue" mt="xs">
                  <Text size="xs">
                    <strong>Rule:</strong> Fields in <Code>__indexed_fields__</Code> become real DB columns
                    (for WHERE, ORDER BY, indexes). Everything else goes into a single JSON column — 
                    perfect for flexible, schema-free data.
                  </Text>
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* UI Customization */}
          <Accordion.Item value="ui">
            <Accordion.Control icon={<IconTemplate size={18} />}>
              <Text fw={600} size="sm">UI Customization (json_schema_extra)</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm">
                  Use <Code>json_schema_extra</Code> to control how fields appear in auto-generated forms and tables:
                </Text>
                <Code block>{`name: str = KeyField(
    description="User name",
    json_schema_extra={
        "ui_width": 3,          # Grid width (1-12)
        "ui_index": 0,          # Display order
        "ui_component": "...",  # Custom component name
        "ui_props": { ... },    # Props passed to component
    }
)`}</Code>

                <Text size="sm" fw={600} mt="xs">Built-in UI Components:</Text>
                <List size="sm" spacing={4}>
                  <List.Item><Code>"ColorPicker"</Code> — Color picker with hex input</List.Item>
                  <List.Item><Code>"TagsInput"</Code> — Tag editor for <Code>List[str]</Code> fields</List.Item>
                  <List.Item><Code>"JsonEditor"</Code> — JSON editor for <Code>Dict</Code> / <Code>List[Dict]</Code> fields</List.Item>
                  <List.Item><Code>"StatusBadge"</Code> — Colored badge selector (needs <Code>ui_props.options</Code>)</List.Item>
                  <List.Item><Code>"PriorityIndicator"</Code> — Priority levels with icons (needs <Code>ui_props.levels</Code>)</List.Item>
                </List>

                <Text size="sm" fw={600} mt="xs">StatusBadge example:</Text>
                <Code block>{`status: str = KeyField(
    default="draft",
    json_schema_extra={
        "ui_component": "StatusBadge",
        "ui_props": {
            "options": [
                {"value": "draft", "label": "Draft", "color": "gray"},
                {"value": "active", "label": "Active", "color": "green"},
            ]
        }
    }
)`}</Code>

                <Text size="sm" fw={600} mt="xs">PriorityIndicator example:</Text>
                <Code block>{`priority: int = StandardField(
    default=0,
    json_schema_extra={
        "ui_component": "PriorityIndicator",
        "ui_props": {
            "levels": [
                {"value": 0, "label": "Low", "color": "green"},
                {"value": 1, "label": "Medium", "color": "yellow"},
                {"value": 2, "label": "High", "color": "red"},
            ]
        }
    }
)`}</Code>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Available Imports */}
          <Accordion.Item value="imports">
            <Accordion.Control icon={<IconSearch size={18} />}>
              <Text fw={600} size="sm">Available in Script Sandbox</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm">These are pre-imported and available in your script:</Text>
                <Code block>{`# Core
PersistedObject          # Base class
Field                    # Pydantic Field

# Field helpers
KeyField                 # Short indexed strings
TitleField               # Display titles
DescriptionField         # Descriptions
StandardField            # General purpose
ContentField             # Long content (50K)
LargeContentField        # Larger content (200K)
MaxContentField          # Maximum content (1M)
IDField                  # Auto-generated ULID
ReferenceIDField         # Foreign key reference
PasswordField            # Sensitive data
VersionField             # Version tracking

# Python typing
Optional, List, Dict, Any
datetime`}</Code>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </ScrollArea>
  )
}

// ==================== Main Component ====================

export default function ModelBuilder({ onCreated, registerModelScript }: ModelBuilderProps) {
  const colorScheme = useComputedColorScheme('dark')
  const isDark = colorScheme === 'dark'
  const [script, setScript] = useState(TEMPLATES[0].script)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string | null>('editor')

  const handleSubmit = async () => {
    setError(null)

    if (!script.trim()) {
      setError('Script is empty')
      return
    }

    try {
      setSubmitting(true)
      const result = await registerModelScript(script)
      onCreated(result.name)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ThemeIcon size="lg" variant="light" color="teal"><IconCode size={22} /></ThemeIcon>
          <div>
            <Title order={3}>Create New Model</Title>
            <Text size="xs" c="dimmed">
              Define a PersistedObject class → get a DB table + full CRUD API + auto UI
            </Text>
          </div>
        </Group>
      </Group>

      {error && (
        <Alert color="red" variant="light" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="editor" leftSection={<IconCode size={16} />}>
            Script Editor
          </Tabs.Tab>
          <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
            Templates
          </Tabs.Tab>
          <Tabs.Tab value="help" leftSection={<IconHelp size={16} />}>
            Help & Reference
          </Tabs.Tab>
        </Tabs.List>

        {/* ==================== Script Editor Tab ==================== */}
        <Tabs.Panel value="editor" pt="md">
          <Stack gap="md">
            <Paper withBorder p={0} radius="md" style={{ overflow: 'hidden' }}>
              <Group
                px="md"
                py={6}
                justify="space-between"
                style={{
                  borderBottom: '1px solid var(--mantine-color-default-border)',
                  backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)',
                }}
              >
                <Group gap="xs">
                  <Badge size="xs" variant="light" color="teal">Python</Badge>
                  <Text size="xs" c="dimmed">PersistedObject class definition</Text>
                </Group>
                <CopyButton value={script}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy script'}>
                      <ActionIcon variant="subtle" size="sm" onClick={copy} color={copied ? 'teal' : 'gray'}>
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <textarea
                value={script}
                onChange={e => setScript(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: 450,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: 16,
                  border: 'none',
                  backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)',
                  color: isDark ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-dark-7)',
                  resize: 'vertical',
                  tabSize: 4,
                  outline: 'none',
                }}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault()
                    const target = e.currentTarget
                    const start = target.selectionStart
                    const end = target.selectionEnd
                    const val = target.value
                    target.value = val.substring(0, start) + '    ' + val.substring(end)
                    target.selectionStart = target.selectionEnd = start + 4
                    setScript(target.value)
                  }
                }}
              />
            </Paper>

            <Group justify="flex-end">
              <Button
                leftSection={<IconPlayerPlay size={18} />}
                onClick={handleSubmit}
                loading={submitting}
                size="md"
              >
                Create Model
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* ==================== Templates Tab ==================== */}
        <Tabs.Panel value="templates" pt="md">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Click a template to load it into the editor. Each template demonstrates different PersistedObject features.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {TEMPLATES.map((t) => (
                <Card
                  key={t.name}
                  withBorder
                  padding="sm"
                  radius="md"
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => {
                    setScript(t.script)
                    setActiveTab('editor')
                  }}
                >
                  <Group gap="xs" mb={4} justify="space-between">
                    <Group gap="xs">
                      <Badge size="sm" variant="light" color={t.color}>{t.name}</Badge>
                    </Group>
                    <Tooltip label="Load into editor">
                      <ActionIcon variant="subtle" size="sm" color={t.color}>
                        <IconCode size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Text size="xs" c="dimmed">{t.description}</Text>
                  <Box
                    mt="xs"
                    p="xs"
                    style={{
                      borderRadius: 6,
                      backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      lineHeight: 1.4,
                      maxHeight: 80,
                      overflow: 'hidden',
                      color: isDark ? 'var(--mantine-color-dimmed)' : 'var(--mantine-color-dark-4)',
                    }}
                  >
                    {t.script.split('\n').slice(0, 5).join('\n')}...
                  </Box>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        {/* ==================== Help Tab ==================== */}
        <Tabs.Panel value="help" pt="md">
          <HelpPanel />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
