# @persisted-object/react

**React components and hooks for building CRUD interfaces with PersistedObject backend.**

## Installation

```bash
npm install @persisted-object/react
# or
pnpm add @persisted-object/react
```

### Peer Dependencies

```bash
npm install @mantine/core @mantine/hooks @tanstack/react-query react react-dom
```

## Quick Start

### 1. Setup React Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### 2. Use CrudPage Component

```tsx
import { CrudPage } from '@persisted-object/react';

function CategoriesPage() {
  return (
    <CrudPage
      endpoint="/api/categories"
      title="Categories"
    />
  );
}
```

That's it! You get a full CRUD interface with:
- List view with pagination
- Create modal with dynamic form
- Edit modal
- Delete confirmation
- Filtering and sorting
- Loading states
- Error handling

## Advanced Usage

### Custom Columns

```tsx
<CrudPage
  endpoint="/api/categories"
  title="Categories"
  columns={[
    { accessor: 'id', title: 'ID' },
    { accessor: 'title', title: 'Title' },
    { accessor: 'slug', title: 'Slug' },
  ]}
/>
```

### Custom Actions

```tsx
<CrudPage
  endpoint="/api/categories"
  title="Categories"
  actions={(row) => [
    {
      label: 'Publish',
      onClick: () => publishCategory(row.id),
      icon: <IconCheck />,
    },
  ]}
/>
```

### Using Hooks Directly

For more control, use the hooks directly:

```tsx
import { useCrudList, useCrudMutation } from '@persisted-object/react';

function CustomCategoriesList() {
  const { data, isLoading } = useCrudList('/api/categories', {
    page: 1,
    pageSize: 20,
  });
  
  const { create, update, delete: deleteFn } = useCrudMutation('/api/categories');
  
  return (
    <div>
      {isLoading && <Loader />}
      {data?.items.map(item => (
        <div key={item.id}>
          {item.title}
          <button onClick={() => deleteFn.mutate(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### `<CrudPage>`

Main component for full CRUD interface.

```tsx
interface CrudPageProps {
  endpoint: string;          // API endpoint (e.g., "/api/categories")
  title: string;             // Page title
  columns?: Column[];        // Custom column definitions
  actions?: ActionFn;        // Custom row actions
  createTitle?: string;      // Create modal title (default: "Create New")
  editTitle?: string;        // Edit modal title (default: "Edit")
  deleteMessage?: string;    // Delete confirmation message
  pageSize?: number;         // Items per page (default: 20)
  enableCreate?: boolean;    // Show create button (default: true)
  enableEdit?: boolean;      // Show edit button (default: true)
  enableDelete?: boolean;    // Show delete button (default: true)
}
```

### `useCrudList()`

Hook for fetching list of items with pagination.

```tsx
const { data, isLoading, error, refetch } = useCrudList(
  endpoint: string,
  options?: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    orderBy?: string;
    enabled?: boolean;
  }
);

// Returns:
interface CrudListResult {
  data: {
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    fetch: number;  // Actual number of items returned (may be less than pageSize)
  } | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

### `useCrudGet()`

Hook for fetching a single item.

```tsx
const { data, isLoading, error } = useCrudGet(
  endpoint: string,
  id: string,
  options?: { enabled?: boolean }
);
```

### `useCrudMutation()`

Hook for create/update/delete operations.

```tsx
const { create, update, delete: deleteFn } = useCrudMutation(endpoint: string);

// Usage:
create.mutate({ title: 'New Item' });
update.mutate({ id: '123', title: 'Updated' });
deleteFn.mutate('123');

// Each mutation has:
// - mutate: (data) => void
// - mutateAsync: (data) => Promise
// - isLoading: boolean
// - error: Error | null
```

### `useCrudSchema()`

Hook for fetching JSON Schema for form generation.

```tsx
const { schema, isLoading } = useCrudSchema(
  endpoint: string,
  type?: 'create' | 'edit'  // default: 'create'
);
```

## Custom UI Components

PersistedObject supports a powerful custom UI component system. Backend models can specify which React component should render a field — both in forms and in table cells — using Pydantic's `json_schema_extra`.

### How It Works

1. **Backend** defines `ui_component` in the field's `json_schema_extra`
2. The hint appears in the JSON Schema served by the API
3. **Frontend** resolves the component name from a context-based registry
4. `JsonSchemaForm` renders the custom component in forms
5. `DataTable` renders the custom cell renderer in tables

### Setup

Wrap your app with `UiComponentProvider` and pass the component registries:

```tsx
import {
  UiComponentProvider,
  defaultUiComponents,
  defaultCellRenderers,
} from '@persisted-object/react';

// Merge built-in + your custom components
<UiComponentProvider
  components={{
    ...defaultUiComponents,
    'StatusBadge': StatusBadgeField,      // your custom form field
    'PriorityIndicator': PriorityField,   // your custom form field
  }}
  cellRenderers={{
    ...defaultCellRenderers,
    'StatusBadge': StatusBadgeCell,        // your custom cell renderer
    'PriorityIndicator': PriorityCell,     // your custom cell renderer
  }}
>
  <App />
</UiComponentProvider>
```

### Built-in Components

The package includes 4 built-in components ready to use:

| Component | Form Field | Table Cell | Use Case |
|-----------|-----------|------------|----------|
| `PasswordField` | Masked password input | `••••••••` dots | Secrets, API keys |
| `ColorPicker` | Color picker with swatches | Color swatch + hex | Theme colors, tags |
| `TagsInput` | Tag input with chips | Badge list | Arrays of strings |
| `JsonEditor` | Monospace editor with validation | `{3 keys}` summary | Dicts, complex objects |

### Backend: Define `ui_component`

```python
from persisted_object import KeyField, StandardField, PasswordField

@register_persisted_model
class User(PersistedObject):
    __table_name__ = "users"
    __primary_key__ = "id"

    # Built-in: PasswordField helper (adds ui_component automatically)
    api_secret: str = PasswordField(description="API secret key")

    # Built-in: ColorPicker
    theme_color: str = KeyField(
        default="#3b82f6",
        description="Theme color",
        json_schema_extra={"ui_component": "ColorPicker"}
    )

    # Built-in: TagsInput
    tags: List[str] = StandardField(
        default_factory=list,
        description="User tags",
        json_schema_extra={"ui_component": "TagsInput"}
    )

    # Built-in: JsonEditor
    settings: dict = StandardField(
        default_factory=dict,
        description="User settings",
        json_schema_extra={"ui_component": "JsonEditor"}
    )

    # Custom: project-specific component with ui_props
    role: str = KeyField(
        default="user",
        description="User role",
        json_schema_extra={
            "ui_component": "StatusBadge",
            "ui_props": {
                "options": [
                    {"value": "admin", "label": "Admin", "color": "red"},
                    {"value": "user", "label": "User", "color": "blue"},
                ]
            }
        }
    )
```

### Frontend: Create Custom Components

A custom component is a React component that implements `UiComponentProps` (for forms) or `UiCellProps` (for table cells):

```tsx
import { Select, Badge, Text } from '@mantine/core';
import type { UiComponentProps, UiCellProps } from '@persisted-object/react';

// Form field component
export function StatusBadgeField({
  value, onChange, label, description,
  disabled, required, error, uiProps,
}: UiComponentProps) {
  const options = uiProps?.options ?? [];
  return (
    <Select
      label={label}
      description={description}
      value={value || ''}
      onChange={(val) => onChange(val || '')}
      data={options.map((o: any) => ({ value: o.value, label: o.label }))}
      disabled={disabled}
      required={required}
      error={error}
    />
  );
}

// Table cell renderer
export function StatusBadgeCell({ value, uiProps }: UiCellProps) {
  const options = uiProps?.options ?? [];
  const matched = options.find((o: any) => o.value === value);
  if (!value) return <Text size="sm" c="dimmed">—</Text>;
  return (
    <Badge variant="light" color={matched?.color ?? 'gray'} size="sm">
      {matched?.label ?? value}
    </Badge>
  );
}
```

### Type Reference

```tsx
// Props for form field components
interface UiComponentProps {
  value: any;
  onChange: (value: any) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  schema?: any;           // Full JSON Schema property
  uiProps?: Record<string, any>;  // From json_schema_extra.ui_props
}

// Props for table cell renderers
interface UiCellProps {
  value: any;
  row: Record<string, any>;
  schema?: any;
  uiProps?: Record<string, any>;
}
```

### Using `ui_props` for Configuration

The `ui_props` field in `json_schema_extra` lets you pass configuration from the backend model directly to the React component, without the frontend needing to know about the model structure:

```python
# Backend — define options in the model
priority: int = StandardField(
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
)
```

```tsx
// Frontend — component reads ui_props
export function PriorityField({ value, onChange, uiProps, ...rest }: UiComponentProps) {
  const levels = uiProps?.levels ?? [];
  // levels = [{ value: 0, label: "Low", color: "green" }, ...]
}
```

Built-in components also support `ui_props`:

| Component | Supported `ui_props` |
|-----------|---------------------|
| `ColorPicker` | `format` (`"hex"`, `"rgba"`), `swatches` (string[]) |
| `TagsInput` | `maxTags`, `splitChars`, `placeholder`, `allowDuplicates` |
| `JsonEditor` | `rows` (textarea rows, default: 8) |

## Configuration

### Global API Client Config

```tsx
import { configureApiClient } from '@persisted-object/react';

configureApiClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token',
  },
  onError: (error) => {
    console.error('API Error:', error);
  },
});
```

## Examples

See the [example project](../example) for a complete working implementation with:
- SQLite backend
- Multiple models
- Custom UI components
- Authentication
- Filtering and sorting

## License

MIT
