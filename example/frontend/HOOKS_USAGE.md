## Example Frontend - Using @persisted-object/react

This example demonstrates how to use the `@persisted-object/react` hooks package.

### Key Changes

Instead of manual fetch():
```tsx
// ❌ Old way (manual fetch)
const [data, setData] = useState([])
useEffect(() => {
  fetch('/api/settings').then(...)
}, [])
```

We use our hooks:
```tsx
// ✅ New way (using hooks)
import { useCrudList, useCrudMutation } from '@persisted-object/react'

const { data, isLoading, refetch } = useCrudList('/api/settings')
const { create, update, delete } = useCrudMutation('/api/settings')
```

### Benefits

1. **Less boilerplate** - No manual state management
2. **Built-in loading states** - `isLoading` handled automatically
3. **Error handling** - `error` state included
4. **Refetch support** - Easy to reload data
5. **Type-safe** - Full TypeScript support

### Development Setup

The example uses Vite alias to link directly to the frontend package source:

```ts
// vite.config.ts
resolve: {
  alias: {
    '@persisted-object/react': path.resolve(__dirname, '../../frontend/src/index.ts')
  }
}
```

This allows hot-reloading during development without needing to rebuild the package!

### Run It

```bash
cd example/frontend
npm install
npm run dev
```

Open http://localhost:5173 and test the CRUD operations!
