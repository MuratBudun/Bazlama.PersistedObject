import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, Burger, Group, Text, Button, Container, useMantineColorScheme, Divider } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSettings, IconCategory, IconTags, IconSun, IconMoon, IconUsers, IconFolder, IconKey, IconNews } from '@tabler/icons-react'
import SettingsPage from './pages/SettingsPage'
import CategoriesPage from './pages/CategoriesPage'
import TagsPage from './pages/TagsPage'
import UsersPage from './pages/UsersPage'
import ProjectsPage from './pages/ProjectsPage'
import ApiKeysPage from './pages/ApiKeysPage'
import BlogPostsPage from './pages/BlogPostsPage'

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

      <AppShell.Navbar p="md">
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
          7 different models showcasing arrays, secure storage, and complex data structures.
          All managed with zero boilerplate!
        </Text>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid size="xl">
          <Routes>
            <Route path="/" element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Text size="xl" fw={700} mb="md">Welcome to PersistedObject Example</Text>
                <Text c="dimmed" mb="md">
                  This showcase demonstrates 7 different models with various complexity levels:
                </Text>
                <Text c="dimmed" size="sm" ta="left" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  • <strong>Basic Models:</strong> Simple key-value structures<br />
                  • <strong>Secure Models:</strong> Encrypted JSON storage for sensitive data<br />
                  • <strong>Array Models:</strong> Complex arrays with dynamic UI<br />
                  • <strong>Rich Models:</strong> Nested objects and content blocks<br /><br />
                  Select a model from the sidebar to explore the auto-generated CRUD interface!
                </Text>
              </div>
            } />
            <Route path="/settings/*" element={<SettingsPage />} />
            <Route path="/categories/*" element={<CategoriesPage />} />
            <Route path="/tags/*" element={<TagsPage />} />
            <Route path="/users/*" element={<UsersPage />} />
            <Route path="/projects/*" element={<ProjectsPage />} />
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
