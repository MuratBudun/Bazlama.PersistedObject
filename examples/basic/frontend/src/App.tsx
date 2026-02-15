import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, Burger, Group, Text, Button, Container, useMantineColorScheme, Divider, Title, Card, SimpleGrid, Table, Code, Badge, Stack, Anchor, Box, ThemeIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSettings, IconCategory, IconTags, IconSun, IconMoon, IconUsers, IconFolder, IconKey, IconNews, IconCalendarEvent, IconWebhook, IconPuzzle, IconDatabase, IconApi } from '@tabler/icons-react'
import SettingsPage from './pages/SettingsPage'
import CategoriesPage from './pages/CategoriesPage'
import TagsPage from './pages/TagsPage'
import UsersPage from './pages/UsersPage'
import ProjectsPage from './pages/ProjectsPage'
import EventsPage from './pages/EventsPage'
import ApiKeysPage from './pages/ApiKeysPage'
import BlogPostsPage from './pages/BlogPostsPage'

function HomePage() {
  const navigate = useNavigate()

  return (
    <Stack gap="xl" py="md">
      <div>
        <Title order={2} mb={4}>PersistedObject -- Example Application</Title>
        <Text c="dimmed">
          This application demonstrates how PersistedObject eliminates boilerplate for CRUD operations.
          8 models, 80 API endpoints, auto-generated forms and tables -- all with minimal code.
        </Text>
      </div>

      {/* Models Overview */}
      <div>
        <Title order={4} mb="sm">Models</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/settings')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconSettings size={14} /></ThemeIcon>
              <Text fw={600} size="sm">AppSettings</Text>
            </Group>
            <Text size="xs" c="dimmed">Key-value configuration store. Primary key: key field. Indexed by key and category.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/categories')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconCategory size={14} /></ThemeIcon>
              <Text fw={600} size="sm">Category</Text>
            </Group>
            <Text size="xs" c="dimmed">Boolean (is_active), Integer (sort_order), unique slug constraint. Auto-slug via CrudHooks.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/tags')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconTags size={14} /></ThemeIcon>
              <Text fw={600} size="sm">Tag</Text>
            </Group>
            <Text size="xs" c="dimmed">Minimal model. ColorPicker custom component for hex color. Name normalized to lowercase via hook.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconUsers size={14} /></ThemeIcon>
              <Text fw={600} size="sm">User</Text>
            </Group>
            <Text size="xs" c="dimmed">Composite unique (email + username), DateTime (last_login), arrays (tags, permissions), nested Dict (profile, settings).</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconFolder size={14} /></ThemeIcon>
              <Text fw={600} size="sm">Project</Text>
            </Group>
            <Text size="xs" c="dimmed">Array of objects (members with roles), milestones. member_count auto-synced via hook. StatusBadge component.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/events')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconCalendarEvent size={14} /></ThemeIcon>
              <Text fw={600} size="sm">Event</Text>
            </Group>
            <Text size="xs" c="dimmed">DateTime column (event_date), PriorityIndicator custom component. Auto-priority based on date proximity.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/apikeys')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconKey size={14} /></ThemeIcon>
              <Text fw={600} size="sm">ApiKey</Text>
            </Group>
            <Text size="xs" c="dimmed">Encrypted JSON storage (__encrypt_json__). PasswordField for secure_value. Rate limiting config, usage history.</Text>
          </Card>

          <Card shadow="xs" padding="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/blogposts')}>
            <Group gap="xs" mb={4}>
              <ThemeIcon variant="light" size="sm"><IconNews size={14} /></ThemeIcon>
              <Text fw={600} size="sm">BlogPost</Text>
            </Group>
            <Text size="xs" c="dimmed">Content blocks array, translations Dict, SEO keywords. Auto-slug, reading time, publish workflow via hooks.</Text>
          </Card>
        </SimpleGrid>
      </div>

      {/* CrudHooks */}
      <div>
        <Group gap="xs" mb="sm">
          <ThemeIcon variant="light" color="violet"><IconWebhook size={18} /></ThemeIcon>
          <Title order={4}>CrudHooks</Title>
        </Group>
        <Text size="sm" c="dimmed" mb="sm">
          Lifecycle hooks injected into CRUD operations via <Code>create_crud_router(hooks=...)</Code>.
          Each hook class overrides before/after methods to add custom logic without modifying the router.
        </Text>
        <Card shadow="xs" padding="md" radius="md" withBorder>
          <Table striped highlightOnHover withTableBorder={false} fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Hook Class</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Behavior</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td><Code>CategoryHooks</Code></Table.Td>
                <Table.Td>Category</Table.Td>
                <Table.Td>Auto-generates slug from title on create. Re-generates slug on title change during update.</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Code>TagHooks</Code></Table.Td>
                <Table.Td>Tag</Table.Td>
                <Table.Td>Normalizes tag name to lowercase and trims whitespace to prevent duplicates.</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Code>UserHooks</Code></Table.Td>
                <Table.Td>User</Table.Td>
                <Table.Td>Normalizes email/username to lowercase. Ensures default settings object exists on create.</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Code>ProjectHooks</Code></Table.Td>
                <Table.Td>Project</Table.Td>
                <Table.Td>Auto-generates slug. Keeps member_count (Integer column) in sync with members array length.</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Code>EventHooks</Code></Table.Td>
                <Table.Td>Event</Table.Td>
                <Table.Td>Sets priority based on date proximity: 3 days or less = High, 14 days or less = Medium.</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Code>BlogPostHooks</Code></Table.Td>
                <Table.Td>BlogPost</Table.Td>
                <Table.Td>Auto-slug, reading time estimation from content blocks, auto-sets published_at on publish.</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </div>

      {/* Custom Components */}
      <div>
        <Group gap="xs" mb="sm">
          <ThemeIcon variant="light" color="teal"><IconPuzzle size={18} /></ThemeIcon>
          <Title order={4}>Custom UI Components</Title>
        </Group>
        <Text size="sm" c="dimmed" mb="sm">
          Components registered via <Code>UiComponentProvider</Code> on the frontend.
          The backend declares which component to use through <Code>json_schema_extra={`{"ui_component": "..."}`}</Code> on each field.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>StatusBadge</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Renders a Select with colored badges in forms, and a colored Badge in table cells.
              Options (value, label, color) are defined in backend ui_props.
            </Text>
            <Text size="xs" c="dimmed">Used by: Project (status), User (role), BlogPost (status)</Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>PriorityIndicator</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Renders a Select with directional arrow icons and colored pills in forms.
              In tables, displays a compact colored badge with priority icon.
            </Text>
            <Text size="xs" c="dimmed">Used by: Event (priority)</Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>ColorPicker</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Renders a color swatch input for selecting hex color codes.
              Displays the color preview inline in table cells.
            </Text>
            <Text size="xs" c="dimmed">Used by: Tag (color)</Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>TagsInput</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Multi-value tag input for List[str] fields. Supports adding and removing items freely.
            </Text>
            <Text size="xs" c="dimmed">Used by: User (tags, permissions), Project (tags), BlogPost (categories, tags, meta_keywords)</Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>JsonEditor</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Code editor for Dict and complex nested fields. Validates JSON before saving.
            </Text>
            <Text size="xs" c="dimmed">Used by: User (profile, settings), Project (members, milestones), Event (location)</Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>PasswordField</Text>
            <Text size="xs" c="dimmed" mb={4}>
              Masked input with show/hide toggle for sensitive string fields.
            </Text>
            <Text size="xs" c="dimmed">Used by: ApiKey (secure_value)</Text>
          </Card>
        </SimpleGrid>
      </div>

      {/* Architecture */}
      <div>
        <Group gap="xs" mb="sm">
          <ThemeIcon variant="light" color="orange"><IconDatabase size={18} /></ThemeIcon>
          <Title order={4}>Architecture</Title>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>Backend (Python)</Text>
            <Text size="xs" c="dimmed">
              FastAPI + SQLAlchemy (async). Models defined as PersistedObject subclasses.
              Each model gets a Store and a router via create_crud_router().
              10 endpoints per model: list, get, create, update, delete, schema, schema/create, schema/edit, export, import.
            </Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>Frontend (React)</Text>
            <Text size="xs" c="dimmed">
              @persisted-object/react package. Uses useCrudList, useCrudSchema, useCrudMutation hooks.
              PersistedObjectRoutes renders a full CRUD page from a single API URL.
              Custom components are registered through UiComponentProvider context.
            </Text>
          </Card>
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Text fw={600} size="sm" mb={4}>Data Flow</Text>
            <Text size="xs" c="dimmed">
              Backend model defines fields with json_schema_extra (ui_component, ui_props).
              Frontend fetches /schema and auto-renders the correct form fields and table columns.
              CrudHooks run server-side on create/update/delete to enforce business rules.
            </Text>
          </Card>
        </SimpleGrid>
      </div>

      {/* API info */}
      <Card shadow="xs" padding="md" radius="md" withBorder>
        <Group gap="xs" mb="xs">
          <ThemeIcon variant="light" color="blue"><IconApi size={18} /></ThemeIcon>
          <Text fw={600} size="sm">API Documentation</Text>
        </Group>
        <Text size="xs" c="dimmed">
          The backend is running at <Anchor href="http://localhost:8000" target="_blank" size="xs">http://localhost:8000</Anchor>.
          Interactive API docs (Swagger UI) available at <Anchor href="http://localhost:8000/docs" target="_blank" size="xs">http://localhost:8000/docs</Anchor>.
          8 models with 80 endpoints, generated from 24 lines of router configuration.
        </Text>
      </Card>
    </Stack>
  )
}

function AppContent() {
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()
  const location = useLocation()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="xl" fw={700}>PersistedObject Example</Text>
          </Group>
          
          <Button
            variant="subtle"
            onClick={() => toggleColorScheme()}
            size="sm"
          >
            {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ justifyContent: 'flex-start' }}>
        <Text size="xs" fw={700} c="dimmed" mb="xs">BASIC MODELS</Text>
        
        <Button
          variant={isActive('/settings') ? 'light' : 'subtle'}
          leftSection={<IconSettings size={20} />}
          onClick={() => navigate('/settings')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          Settings
        </Button>
        
        <Button
          variant={isActive('/categories') ? 'light' : 'subtle'}
          leftSection={<IconCategory size={20} />}
          onClick={() => navigate('/categories')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          Categories
        </Button>
        
        <Button
          variant={isActive('/tags') ? 'light' : 'subtle'}
          leftSection={<IconTags size={20} />}
          onClick={() => navigate('/tags')}
          fullWidth
          justify="flex-start"
        >
          Tags
        </Button>

        <Divider my="md" />
        
        <Text size="xs" fw={700} c="dimmed" mb="xs">COMPLEX MODELS</Text>
        
        <Button
          variant={isActive('/users') ? 'light' : 'subtle'}
          leftSection={<IconUsers size={20} />}
          onClick={() => navigate('/users')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          Users (Secure)
        </Button>
        
        <Button
          variant={isActive('/projects') ? 'light' : 'subtle'}
          leftSection={<IconFolder size={20} />}
          onClick={() => navigate('/projects')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          Projects (Arrays)
        </Button>
        
        <Button
          variant={isActive('/events') ? 'light' : 'subtle'}
          leftSection={<IconCalendarEvent size={20} />}
          onClick={() => navigate('/events')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          Events (DateTime)
        </Button>
        
        <Button
          variant={isActive('/apikeys') ? 'light' : 'subtle'}
          leftSection={<IconKey size={20} />}
          onClick={() => navigate('/apikeys')}
          fullWidth
          justify="flex-start"
          mb="xs"
        >
          API Keys (Secure)
        </Button>
        
        <Button
          variant={isActive('/blogposts') ? 'light' : 'subtle'}
          leftSection={<IconNews size={20} />}
          onClick={() => navigate('/blogposts')}
          fullWidth
          justify="flex-start"
        >
          Blog Posts (Rich)
        </Button>

        <Text size="xs" c="dimmed" mt="xl" px="sm">
          8 different models showcasing arrays, secure storage, and complex data structures.
          All managed with zero boilerplate!
        </Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid size="xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
            <Route path="/categories/*" element={<CategoriesPage />} />
            <Route path="/tags/*" element={<TagsPage />} />
            <Route path="/users/*" element={<UsersPage />} />
            <Route path="/projects/*" element={<ProjectsPage />} />
            <Route path="/events/*" element={<EventsPage />} />
            <Route path="/apikeys/*" element={<ApiKeysPage />} />
            <Route path="/blogposts/*" element={<BlogPostsPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
