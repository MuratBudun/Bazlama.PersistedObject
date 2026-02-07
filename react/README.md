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

Register custom components for specific field types:

```tsx
import { JsonSchemaForm, registerCustomComponent } from '@persisted-object/react';

// Backend defines:
// actions: List[ActionConfig] = Field(
//   json_schema_extra={"ui_component": "ActionConfigList"}
// )

// Frontend registers component:
registerCustomComponent('ActionConfigList', ActionConfigListComponent);

// Now JsonSchemaForm will automatically use your custom component
```

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
