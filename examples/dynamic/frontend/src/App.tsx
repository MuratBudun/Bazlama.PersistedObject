import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell, Burger, Group, Text, Button, Container,
  useMantineColorScheme, Divider, Stack, Loader, Center,
  ActionIcon, Badge, ThemeIcon, Tooltip, Title, Card,
  Alert
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconSun, IconMoon, IconPlus, IconDatabase, IconTrash,
  IconTable, IconBolt
} from '@tabler/icons-react'
import { PersistedObjectRoutes } from '@persisted-object/react'
import { useModels } from './hooks/useModels'
import ModelBuilder from './components/ModelBuilder'
import { DynamicModel } from './types'

function HomePage() {
  return (
    <Stack gap="xl" py="md">
      <div>
        <Title order={2} mb={4}>PersistedObject -- Dynamic Example</Title>
        <Text c="dimmed">
          Create PersistedObject models at runtime through the UI.
          Each model gets a database table and full CRUD API automatically.
        </Text>
      </div>

      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="sm">
          <ThemeIcon variant="light" size="lg"><IconBolt size={20} /></ThemeIcon>
          <Title order={4}>How it works</Title>
        </Group>
        <Stack gap="xs">
          <Text size="sm">1. Click <Badge variant="light">+ New Model</Badge> in the sidebar to define a new model</Text>
          <Text size="sm">2. Add fields -- simple types (String, Integer, Boolean) become DB columns when indexed</Text>
          <Text size="sm">3. Add complex fields -- arrays, nested objects are stored in JSON automatically</Text>
          <Text size="sm">4. Click <Badge variant="light">Create Model</Badge> to create it</Text>
          <Text size="sm">5. The model appears in the sidebar -- click it to manage its data with full CRUD</Text>
        </Stack>
      </Card>

      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Group gap="xs" mb="sm">
          <ThemeIcon variant="light" color="violet" size="lg"><IconDatabase size={20} /></ThemeIcon>
          <Title order={4}>The PersistedObject approach</Title>
        </Group>
        <Stack gap="xs">
          <Text size="sm">Complex objects live in an RDBMS -- the entire object is stored as JSON.</Text>
          <Text size="sm">Primary key and indexed fields are promoted to real DB columns for fast queries.</Text>
          <Text size="sm">Everything else (arrays, nested objects, any structure) stays in the JSON column.</Text>
          <Text size="sm" fw={600} mt="xs">For each model, you automatically get:</Text>
          <Text size="sm" pl="md">-- A Pydantic PersistedObject class with full validation</Text>
          <Text size="sm" pl="md">-- A SQLite database table with proper column types and indexes</Text>
          <Text size="sm" pl="md">-- 10 REST API endpoints (list, get, create, update, delete, schema, export, import...)</Text>
          <Text size="sm" pl="md">-- Auto-generated forms and data tables in the UI</Text>
        </Stack>
      </Card>
    </Stack>
  )
}

function DynamicCrudPage({ model }: { model: DynamicModel }) {
  return (
    <PersistedObjectRoutes
      api={model.endpoint}
      title={model.name}
      description={model.description || `Manage ${model.name} records`}
    />
  )
}

function AppContent() {
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()
  const location = useLocation()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { models, loading, deleteModel, registerModel, fetchModels } = useModels()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleModelCreated = (modelName: string) => {
    const model = models.find(m => m.name === modelName)
    // Navigate to the newly created model's table after a brief delay
    // so the models list refreshes first
    setTimeout(() => {
      fetchModels().then(() => {
        navigate(`/model/${modelName}`)
      })
    }, 100)
  }

  const handleDeleteModel = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation()
    if (confirm(`Delete model "${name}"? The database table will be preserved.`)) {
      await deleteModel(name)
      if (location.pathname.startsWith(`/model/${name}`)) {
        navigate('/')
      }
    }
  }

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
            <Text size="xl" fw={700}>Dynamic Models</Text>
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
        <Button
          variant={isActive('/create') ? 'light' : 'filled'}
          leftSection={<IconPlus size={18} />}
          onClick={() => navigate('/create')}
          fullWidth
          mb="md"
        >
          New Model
        </Button>

        <Divider mb="sm" />

        {loading ? (
          <Center py="md"><Loader size="sm" /></Center>
        ) : models.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No models defined yet.
          </Text>
        ) : (
          <>
            <Text size="xs" fw={700} c="dimmed" mb="xs">MODELS</Text>
            {models.map(model => (
              <Group key={model.name} gap={4} wrap="nowrap" mb={4}>
                <Button
                  variant={isActive(`/model/${model.name}`) ? 'light' : 'subtle'}
                  leftSection={<IconTable size={18} />}
                  onClick={() => navigate(`/model/${model.name}`)}
                  fullWidth
                  justify="flex-start"
                  size="sm"
                  style={{ flex: 1 }}
                >
                  {model.name}
                </Button>
                <Tooltip label="Delete model">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={(e) => handleDeleteModel(e, model.name)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ))}
          </>
        )}

        <Text size="xs" c="dimmed" mt="xl" px="sm">
          {models.length} model{models.length !== 1 ? 's' : ''} defined.
          Each model has 10 API endpoints.
        </Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid size="xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/create"
              element={
                <ModelBuilder
                  onCreated={handleModelCreated}
                  registerModel={registerModel}
                />
              }
            />
            {models.map(model => (
              <Route
                key={model.name}
                path={`/model/${model.name}/*`}
                element={<DynamicCrudPage model={model} />}
              />
            ))}
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
