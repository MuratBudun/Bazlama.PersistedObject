/**
 * PersistedObjectCrud - The ultimate component for zero-boilerplate CRUD UIs.
 * 
 * This is the Django-Admin equivalent for PersistedObject.
 * Just provide an API endpoint, and get a full CRUD interface automatically:
 * - List view with DataTable (search, sort, pagination)
 * - Create form (from JSON Schema)
 * - Edit form (from JSON Schema)
 * - Detail view
 * - Export/Import
 * 
 * Usage:
 *   <PersistedObjectCrud api="/api/settings" />
 * 
 * That's it! No manual forms, no manual tables, no manual API calls.
 * Everything is generated from the backend's Router Factory endpoints.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Group, Title, Box } from '@mantine/core';
import { IconEdit, IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { DataTable, DataTableColumn } from '../DataTable';
import { useCrudList } from '../../hooks/useCrudList';
import { useCrudMutation } from '../../hooks/useCrudMutation';
import { useCrudGet } from '../../hooks/useCrudGet';
import { useCrudSchema } from '../../hooks/useCrudSchema';
import { JsonSchemaForm } from '../JsonSchemaForm';

export interface PersistedObjectCrudProps {
  /** API endpoint (e.g., "/api/settings") */
  api: string;
  
  /** Page title */
  title?: string;
  
  /** Page description */
  description?: string;
  
  /** Primary key field name (default: auto-detected from schema) */
  primaryKey?: string;
  
  /** Title field for display (default: primaryKey) */
  titleField?: string;
  
  /** Columns to show in table (default: all from schema) */
  columns?: string[] | DataTableColumn[];
  
  /** Columns that can be sorted */
  sortableColumns?: string[];
  
  /** Items per page */
  pageSize?: number;
  
  /** Allow import from JSON */
  allowImport?: boolean;
  
  /** Allow export to JSON */
  allowExport?: boolean;
  
  /** Custom column renderers */
  columnRender?: (column: string, value: any, row: any) => React.ReactNode;
  
  /** Height of table in pixels */
  tableHeight?: number;
  
  /** Show primary key as clickable link to detail */
  primaryKeyAsLink?: boolean;
  
  /** Show title field as clickable link to detail */
  titleFieldAsLink?: boolean;
  
  /** Enable/disable CRUD operations */
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  
  /** View mode: 'modal' | 'page' */
  viewMode?: 'modal' | 'page';
  
  /** Initial view state (for routing) */
  initialView?: ViewState;
  
  /** Initial item ID (for detail/edit views) */
  initialItemId?: string;
  
  /** Custom handlers */
  onCreateSuccess?: (item: any) => void;
  onUpdateSuccess?: (item: any) => void;
  onDeleteSuccess?: (item: any) => void;
  onCancel?: () => void;
}

type ViewState = 'list' | 'create' | 'edit' | 'detail';

export function PersistedObjectCrud({
  api,
  title,
  primaryKey: providedPrimaryKey,
  titleField,
  columns: providedColumns,
  sortableColumns,
  pageSize = 20,
  allowImport = true,
  allowExport = true,
  columnRender,
  tableHeight,
  primaryKeyAsLink = true,
  titleFieldAsLink = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canView = true,
  viewMode = 'modal',
  initialView = 'list',
  initialItemId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onCancel,
}: PersistedObjectCrudProps) {
  // Navigation (only used in page mode)
  const navigate = useNavigate();
  
  // Form refs - Always declare all hooks at the top level
  const createFormRef = useRef<{ submit: () => void }>(null);
  const editFormRef = useRef<{ submit: () => void }>(null);
  
  // State
  const [viewState, setViewState] = useState<ViewState>(initialView);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // API Hooks - Always call all hooks (React rules)
  const { data: listData, isLoading: listLoading, refetch } = useCrudList(api, {
    page,
    pageSize,
    search: search || undefined,
    orderBy: sortBy ? `${sortDirection === 'desc' ? '-' : ''}${sortBy}` : undefined,
    useModelOutput: false,  // Use plain dicts for better performance in list view
  });

  const { data: schema, isLoading: schemaLoading } = useCrudSchema(api, '/schema', { enabled: true });
  const { data: createSchema, isLoading: createSchemaLoading } = useCrudSchema(api, '/schema/create', { 
    enabled: viewState === 'create' 
  });
  const { data: editSchema, isLoading: editSchemaLoading } = useCrudSchema(api, '/schema/edit', { 
    enabled: viewState === 'edit' || viewState === 'detail'
  });
  
  const primaryKeyValue = initialItemId || selectedItem?.[providedPrimaryKey || detectPrimaryKey(schema)] || '';
  
  const { data: detailData, isLoading: detailLoading } = useCrudGet(
    api,
    primaryKeyValue,
    { enabled: !!primaryKeyValue && (viewState === 'edit' || viewState === 'detail') }
  );

  const { create, update, delete: deleteFn } = useCrudMutation(api);

  // Auto-detect primary key from schema
  const primaryKey = providedPrimaryKey || detectPrimaryKey(schema);
  const titleFieldName = titleField || primaryKey;

  // Auto-detect columns from schema
  const columns = buildColumns(providedColumns, schema, sortableColumns, columnRender);

  // Sync viewState with initialView prop (for URL routing)
  useEffect(() => {
    setViewState(initialView);
  }, [initialView]);

  // Sync selectedItem with initialItemId prop (for URL routing)
  useEffect(() => {
    if (initialItemId && viewMode === 'page') {
      setSelectedItem({ [primaryKey]: initialItemId });
    }
  }, [initialItemId, viewMode, primaryKey]);

  // Handlers
  const handleCreate = () => {
    if (viewMode === 'page') {
      navigate('create');
    } else {
      setSelectedItem(null);
      setViewState('create');
    }
  };

  const handleEdit = (row: any) => {
    if (viewMode === 'page') {
      navigate(`${row[primaryKey]}/edit`);
    } else {
      setSelectedItem(row);
      setViewState('edit');
    }
  };

  const handleDetail = (row: any) => {
    if (viewMode === 'page') {
      navigate(`${row[primaryKey]}`);
    } else {
      setSelectedItem(row);
      setViewState('detail');
    }
  };

  const handleDelete = async (row: any) => {
    await deleteFn.mutate(row[primaryKey]);
    refetch();
    if (onDeleteSuccess) onDeleteSuccess(row);
  };

  const handleSaveCreate = async (values: any) => {
    await create.mutate(values);
    refetch();
    if (onCreateSuccess) {
      onCreateSuccess(values);
    } else if (viewMode === 'page') {
      navigate('..');
    } else {
      setViewState('list');
    }
  };

  const handleSaveEdit = async (values: any) => {
    await update.mutate({ id: selectedItem[primaryKey], ...values });
    refetch();
    if (onUpdateSuccess) {
      onUpdateSuccess(values);
    } else if (viewMode === 'page') {
      navigate(`../${selectedItem[primaryKey]}`);
    } else {
      setViewState('list');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (viewMode === 'page') {
      if (viewState === 'edit' && selectedItem) {
        navigate(`../${selectedItem[primaryKey]}`);
      } else {
        navigate('..');
      }
    } else {
      setViewState('list');
      setSelectedItem(null);
    }
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExport = async (row: any) => {
    return row;
  };

  const handleExportAll = async () => {
    return listData?.items || [];
  };

  const handleImport = async (data: any) => {
    await create.mutate(data);
    refetch();
  };

  // Render list view
  if (viewState === 'list') {
    return (
      <div>
        {title && (
          <Group justify="space-between" mb="md">
            <Title order={2}>{title}</Title>
          </Group>
        )}
        
        <DataTable
          data={listData?.items || []}
          total={listData?.total || 0}
          loading={listLoading || schemaLoading}
          columns={columns}
          keyColumn={primaryKey}
          titleColumn={titleFieldName}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchValue={search}
          onSearch={handleSearch}
          onCreate={canCreate ? handleCreate : undefined}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onDetail={canView ? handleDetail : undefined}
          onExport={allowExport ? handleExport : undefined}
          onExportAll={allowExport ? handleExportAll : undefined}
          onImport={allowImport ? handleImport : undefined}
          keyColumnAsLink={primaryKeyAsLink && canView}
          titleColumnAsLink={titleFieldAsLink && canView}
          height={tableHeight}
        />
      </div>
    );
  }

  // Render create view
  if (viewState === 'create') {
    const schemaToUse = createSchema || schema;
    const isLoading = createSchemaLoading || !schemaToUse;
    
    const toolbar = (
      <Box 
        p="md" 
        style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Button variant="subtle" onClick={handleCancel} leftSection={<IconArrowLeft size={16} />}>
              Back
            </Button>
            <Title order={3}>{title} / <span style={{ fontWeight: 400 }}>New</span></Title>
          </Group>
          <Button 
            onClick={() => createFormRef.current?.submit()} 
            loading={create.isLoading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Save
          </Button>
        </Group>
      </Box>
    );
    
    const content = isLoading ? (
      <div style={{ padding: '40px', textAlign: 'center' }}>Loading schema...</div>
    ) : (
      <JsonSchemaForm
        ref={createFormRef}
        schema={schemaToUse}
        onSubmit={handleSaveCreate}
        loading={create.isLoading}
        hideButtons
      />
    );

    if (viewMode === 'modal') {
      return (
        <Modal
          opened={true}
          onClose={handleCancel}
          title={`Create ${title || 'Item'}`}
          size="xl"
        >
          {content}
        </Modal>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {toolbar}
        <Box p="md" style={{ flex: 1, overflow: 'auto' }}>
          {content}
        </Box>
      </div>
    );
  }

  // Render edit view
  if (viewState === 'edit') {
    const schemaToUse = editSchema || schema;
    const isLoading = editSchemaLoading || detailLoading || !schemaToUse || !detailData;
    
    const itemTitle = detailData?.[titleFieldName] || selectedItem?.[titleFieldName] || initialItemId;
    
    const toolbar = (
      <Box 
        p="md" 
        style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Button variant="subtle" onClick={handleCancel} leftSection={<IconArrowLeft size={16} />}>
              Back
            </Button>
            <Title order={3}>{title} / <span style={{ fontWeight: 400 }}>{itemTitle}</span></Title>
          </Group>
          <Button 
            onClick={() => editFormRef.current?.submit()} 
            loading={update.isLoading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Save
          </Button>
        </Group>
      </Box>
    );
    
    const content = isLoading ? (
      <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
    ) : (
      <JsonSchemaForm
        ref={editFormRef}
        schema={schemaToUse}
        initialValues={detailData || selectedItem}
        onSubmit={handleSaveEdit}
        loading={update.isLoading}
        hideButtons
      />
    );

    if (viewMode === 'modal') {
      return (
        <Modal
          opened={true}
          onClose={handleCancel}
          title={`Edit ${selectedItem?.[titleFieldName] || 'Item'}`}
          size="xl"
        >
          {content}
        </Modal>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {toolbar}
        <Box p="md" style={{ flex: 1, overflow: 'auto' }}>
          {content}
        </Box>
      </div>
    );
  }

  // Render detail view
  if (viewState === 'detail') {
    const schemaToUse = editSchema || schema;
    const isLoading = editSchemaLoading || detailLoading || !schemaToUse || !detailData;
    const itemTitle = detailData?.[titleFieldName] || selectedItem?.[titleFieldName] || initialItemId;
    
    const toolbar = (
      <Box 
        p="md" 
        style={{ 
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Button variant="subtle" onClick={handleCancel} leftSection={<IconArrowLeft size={16} />}>
              Back
            </Button>
            <Title order={3}>{title} / <span style={{ fontWeight: 400 }}>{itemTitle}</span></Title>
          </Group>
          {canEdit && (
            <Button 
              onClick={() => {
                if (viewMode === 'page') {
                  navigate('edit');
                } else {
                  setViewState('edit');
                }
              }} 
              leftSection={<IconEdit size={16} />}
            >
              Edit
            </Button>
          )}
        </Group>
      </Box>
    );
    
    const content = isLoading ? (
      <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
    ) : (
      <JsonSchemaForm
        schema={schemaToUse}
        initialValues={detailData || selectedItem}
        readOnly={true}
        loading={false}
        hideButtons
      />
    );

    if (viewMode === 'modal') {
      return (
        <Modal
          opened={true}
          onClose={handleCancel}
          title={selectedItem?.[titleFieldName] || 'Details'}
          size="xl"
        >
          {content}
        </Modal>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {toolbar}
        <Box p="md" style={{ flex: 1, overflow: 'auto' }}>
          {content}
        </Box>
      </div>
    );
  }

  return null;
}

// Helper: Detect primary key from schema
function detectPrimaryKey(schema: any): string {
  if (!schema?.properties) return 'id';
  
  // Look for common primary key names
  const candidates = ['id', 'key', 'name', 'slug'];
  for (const candidate of candidates) {
    if (schema.properties[candidate]) {
      return candidate;
    }
  }
  
  // Return first property as fallback
  return Object.keys(schema.properties)[0] || 'id';
}

// Helper: Build columns from schema
function buildColumns(
  providedColumns: string[] | DataTableColumn[] | undefined,
  schema: any,
  sortableColumns: string[] | undefined,
  columnRender?: (column: string, value: any, row: any) => React.ReactNode
): DataTableColumn[] {
  // If columns are explicitly provided as DataTableColumn[], use them
  if (providedColumns && providedColumns.length > 0 && typeof providedColumns[0] === 'object') {
    return providedColumns as DataTableColumn[];
  }
  
  // If columns are provided as string[], build from schema
  const columnKeys = (providedColumns as string[]) || 
    (schema?.properties ? Object.keys(schema.properties) : []);
  
  return columnKeys
    .filter(key => {
      // Only show indexed fields in list view
      const property = schema?.properties?.[key];
      return property?.index === true;
    })
    .map(key => {
      const property = schema?.properties?.[key];
      
      return {
        key,
        label: property?.title || formatLabel(key),
        type: detectType(property),
        sortable: sortableColumns ? sortableColumns.includes(key) : true,
        schema: property,
        render: columnRender ? (value: any, row: any) => columnRender(key, value, row) : undefined,
      };
    });
}

// Helper: Detect field type from JSON Schema
function detectType(property: any): 'string' | 'boolean' | 'number' | undefined {
  if (!property) return undefined;
  
  if (property.type === 'boolean') return 'boolean';
  if (property.type === 'number' || property.type === 'integer') return 'number';
  if (property.type === 'string') return 'string';
  
  // Handle anyOf (nullable fields)
  if (Array.isArray(property.anyOf)) {
    for (const option of property.anyOf) {
      if (option.type === 'boolean') return 'boolean';
      if (option.type === 'number' || option.type === 'integer') return 'number';
      if (option.type === 'string') return 'string';
    }
  }
  
  return 'string';
}

// Helper: Format label from field name
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
