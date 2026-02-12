/**
 * Simple CrudPage component demonstrating the concept.
 * 
 * This is a basic implementation. In production, this would be more sophisticated
 * with dynamic form generation from JSON Schema.
 */

import { useState, useCallback } from 'react';
import { 
  Container, 
  Title, 
  Table, 
  Button, 
  Group, 
  Loader, 
  Text,
  Badge,
  Modal,
  Stack,
  TextInput
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutation } from '../../hooks/useCrudMutation';

export interface CrudPageColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface CrudPageProps {
  endpoint: string;
  title: string;
  columns?: CrudPageColumn[];
  primaryKey?: string;
}

export function CrudPage({ 
  endpoint, 
  title,
  columns,
  primaryKey = 'id'
}: CrudPageProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data, isLoading, error, refetch } = useCrudList(endpoint);
  const { create, update, delete: deleteFn } = useCrudMutation(endpoint);

  const items = data?.items || [];

  // Auto-detect columns from first item
  const autoColumns: CrudPageColumn[] = items.length > 0 
    ? Object.keys(items[0]).map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
      }))
    : [];

  const displayColumns: CrudPageColumn[] = columns || autoColumns;

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setModalOpened(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpened(true);
  };

  // PERFORMANCE: Functional state updater - doesn't close over formData
  const handleFormChange = useCallback((key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    try {
      if (editingItem) {
        await update.mutate({ id: editingItem[primaryKey], ...formData });
      } else {
        await create.mutate(formData);
      }
      setModalOpened(false);
      refetch();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteFn.mutate(item[primaryKey]);
      refetch();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading {title.toLowerCase()}...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text c="red">Error: {error.message}</Text>
        </div>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>{title}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          New
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {displayColumns.map(col => (
              <Table.Th key={col.key}>{col.label}</Table.Th>
            ))}
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item: any) => (
            <Table.Tr key={item[primaryKey]}>
              {displayColumns.map(col => (
                <Table.Td key={col.key}>
                  {col.render 
                    ? col.render(item[col.key], item)
                    : typeof item[col.key] === 'boolean'
                      ? <Badge color={item[col.key] ? 'green' : 'gray'}>
                          {item[col.key] ? 'Yes' : 'No'}
                        </Badge>
                      : String(item[col.key] || '-')
                  }
                </Table.Td>
              ))}
              <Table.Td>
                <Group gap="xs">
                  <Button 
                    size="xs" 
                    variant="light" 
                    onClick={() => handleEdit(item)}
                  >
                    <IconEdit size={14} />
                  </Button>
                  <Button 
                    size="xs" 
                    variant="light" 
                    color="red"
                    onClick={() => handleDelete(item)}
                    loading={deleteFn.isLoading}
                  >
                    <IconTrash size={14} />
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No items found. Click "New" to create one.
        </div>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingItem ? `Edit ${title}` : `New ${title}`}
      >
        <Stack>
          {displayColumns.slice(0, 5).map(col => (
            <TextInput
              key={col.key}
              label={col.label}
              value={formData[col.key] || ''}
              onChange={(e) => handleFormChange(col.key, e.target.value)}
              disabled={col.key === primaryKey && !!editingItem}
            />
          ))}
          
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setModalOpened(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              loading={create.isLoading || update.isLoading}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
