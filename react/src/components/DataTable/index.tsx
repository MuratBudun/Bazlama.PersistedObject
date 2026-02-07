/**
 * DataTable - Advanced data table with sorting, filtering, pagination, and CRUD operations.
 * 
 * Adapted from qmex-ai project with enhancements for the PersistedObject module.
 * 
 * Features:
 * - Sorting (click column headers)
 * - Search with debounce
 * - Pagination
 * - CRUD operations (Create, Edit, Delete)
 * - Export/Import (JSON)
 * - Custom column renderers
 * - Action buttons per row
 * - Loading states
 */

import {
  Card,
  LoadingOverlay,
  Table,
  Group,
  Checkbox,
  Pagination,
  Text,
  Tooltip,
  ActionIcon,
  Button,
  FileButton,
  TextInput,
  Anchor,
  Modal,
  Stack,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconFileExport,
  IconFileImport,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import classes from './index.module.css';
import { useRef, useState } from 'react';
import { useUiComponents } from '../../context/UiComponentContext';

type RecordRow = Record<string, any>;

export type DataTableColumn = {
  key: string;
  label: string;
  description?: string;
  type?: 'string' | 'boolean' | 'number';
  sortable?: boolean;
  render?: (value: any, row: RecordRow) => React.ReactNode;
  /** JSON Schema property definition (used for ui_component cell rendering) */
  schema?: any;
};

export type DataTableAction = {
  label?: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: (row: RecordRow) => void | Promise<void>;
  color?: string;
  loading?: (row: RecordRow) => boolean;
};

export interface DataTableProps {
  // Data fetching
  data: RecordRow[];
  total: number;
  loading?: boolean;
  
  // Columns
  columns: DataTableColumn[];
  
  // Identification
  keyColumn: string;
  titleColumn?: string;
  
  // Pagination
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  
  // Sorting
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  
  // Search
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  
  // CRUD operations
  onCreate?: () => void;
  onEdit?: (row: RecordRow) => void;
  onDelete?: (row: RecordRow) => void | Promise<void>;
  onDetail?: (row: RecordRow) => void;
  
  // Export/Import
  onExport?: (row: RecordRow) => void | Promise<any>;
  onExportAll?: () => void | Promise<any>;
  onImport?: (data: any) => void | Promise<void>;
  
  // Customization
  extraActions?: DataTableAction[];
  height?: number;
  emptyMessage?: string;
  
  // Detail links
  keyColumnAsLink?: boolean;
  titleColumnAsLink?: boolean;
}

export function DataTable({
  data,
  total,
  loading = false,
  columns,
  keyColumn,
  titleColumn,
  page,
  pageSize,
  onPageChange,
  sortBy,
  sortDirection = 'asc',
  onSort,
  searchValue = '',
  onSearch,
  searchPlaceholder = 'Search...',
  onCreate,
  onEdit,
  onDelete,
  onDetail,
  onExport,
  onExportAll,
  onImport,
  extraActions,
  height,
  emptyMessage = 'No items found',
  keyColumnAsLink = false,
  titleColumnAsLink = false,
}: DataTableProps) {
  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [deleteConfirm, setDeleteConfirm] = useState<RecordRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportAllLoading, setExportAllLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const searchTimeout = useRef<number>(0);
  const importResetRef = useRef<() => void>(null);
  const { resolveCellRenderer } = useUiComponents();

  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    const isAsc = sortBy === columnKey && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return null;
    return sortDirection === 'asc' ? 
      <IconArrowUp size={14} /> : 
      <IconArrowDown size={14} />;
  };

  const renderColumnHeader = (column: DataTableColumn) => {
    const sortable = column.sortable !== false && !!onSort;

    return (
      <Table.Th
        key={column.key}
        className={sortable ? classes.columnHeader : undefined}
        onClick={sortable ? () => handleSort(column.key) : undefined}
      >
        <Group className={classes.columnHeaderInner}>
          <Text size="sm" fw={600}>{column.label}</Text>
          {sortable && renderSortIcon(column.key)}
        </Group>
      </Table.Th>
    );
  };

  const renderColumnValue = (column: DataTableColumn, row: RecordRow) => {
    const value = row[column.key];
    
    // Custom render function (explicit per-column override)
    if (column.render) {
      return <Table.Td key={column.key}>{column.render(value, row)}</Table.Td>;
    }

    // UI Component cell renderer (from schema's ui_component)
    const uiComponentName = column.schema?.ui_component;
    if (uiComponentName) {
      const CellRenderer = resolveCellRenderer(uiComponentName);
      if (CellRenderer) {
        return (
          <Table.Td key={column.key}>
            <CellRenderer
              value={value}
              row={row}
              schema={column.schema}
              uiProps={column.schema?.ui_props}
            />
          </Table.Td>
        );
      }
    }

    // Default rendering based on type
    let rendered: React.ReactNode;
    
    if (column.type === 'boolean') {
      rendered = <Checkbox checked={!!value} readOnly />;
    } else {
      rendered = String(value ?? '');
    }

    // Add link if configured
    const shouldLink = 
      (keyColumnAsLink && column.key === keyColumn) ||
      (titleColumnAsLink && column.key === titleColumn);
    
    if (shouldLink && (onDetail || onEdit)) {
      const handleClick = onDetail || onEdit;
      rendered = (
        <Anchor size="sm" onClick={() => handleClick!(row)}>
          {rendered}
        </Anchor>
      );
    }

    return <Table.Td key={column.key}>{rendered}</Table.Td>;
  };

  const handleDeleteClick = (row: RecordRow) => {
    setDeleteConfirm(row);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm || !onDelete) return;
    
    setDeleteLoading(deleteConfirm[keyColumn]);
    try {
      await onDelete(deleteConfirm);
    } finally {
      setDeleteLoading(null);
      setDeleteConfirm(null);
    }
  };

  const handleExport = async (row: RecordRow) => {
    if (!onExport) return;
    
    setExportLoading(row[keyColumn]);
    try {
      const data = await onExport(row);
      if (data) {
        exportJson(data, `${row[keyColumn]}_export`);
      }
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportAll = async () => {
    if (!onExportAll) return;
    
    setExportAllLoading(true);
    try {
      const data = await onExportAll();
      if (data) {
        exportJson(data, 'export_all');
      }
    } finally {
      setExportAllLoading(false);
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file || !onImport) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const record = JSON.parse(content);

        setImportLoading(true);
        await onImport(record);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        importResetRef.current?.();
        setImportLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleSearchClear = () => {
    setInternalSearch('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSearchImmediate = () => {
    clearTimeout(searchTimeout.current);
    if (onSearch) {
      onSearch(internalSearch);
    }
  };

  return (
    <div className={classes.root}>
      {/* Toolbar */}
      <Group gap="sm" py="xs" justify="space-between">
        <Group>
          {onSearch && (
            <TextInput
              className={classes.searchBar}
              placeholder={searchPlaceholder}
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchImmediate()}
              rightSection={
                <Group gap={0}>
                  {internalSearch && (
                    <ActionIcon size="sm" variant="subtle" onClick={handleSearchClear}>
                      <IconX size={14} />
                    </ActionIcon>
                  )}
                  <ActionIcon size="sm" variant="subtle" onClick={handleSearchImmediate}>
                    <IconSearch size={18} />
                  </ActionIcon>
                </Group>
              }
              rightSectionWidth={internalSearch ? 60 : 40}
            />
          )}
        </Group>
        
        <Group>
          {onImport && (
            <FileButton onChange={handleImport} accept=".json" resetRef={importResetRef}>
              {(props) => (
                <Button 
                  variant="default" 
                  loading={importLoading} 
                  leftSection={<IconFileImport size={18} />}
                  {...props}
                >
                  Import
                </Button>
              )}
            </FileButton>
          )}
          
          {onExportAll && (
            <Button
              variant="default"
              leftSection={<IconFileExport size={18} />}
              loading={exportAllLoading}
              onClick={handleExportAll}
            >
              Export All
            </Button>
          )}
          
          {onCreate && (
            <Button leftSection={<IconPlus size={18} />} onClick={onCreate}>
              Create
            </Button>
          )}
        </Group>
      </Group>

      {/* Table */}
      <Card withBorder shadow="sm" pos="relative">
        <Card.Section withBorder>
          <LoadingOverlay visible={loading} />
          <Table.ScrollContainer minWidth={350} h={height} type="native">
            <Table highlightOnHover withColumnBorders stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  {columns.map(renderColumnHeader)}
                  {(onEdit || onDelete || onExport || extraActions) && <Table.Th w={120}>Actions</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((row) => (
                  <Table.Tr key={row[keyColumn]}>
                    {columns.map((column) => renderColumnValue(column, row))}
                    
                    {/* Actions column */}
                    {(onEdit || onDelete || onExport || extraActions) && (
                      <Table.Td>
                        <Group gap={5} wrap="nowrap">
                          {onExport && (
                            <Tooltip label="Export">
                              <ActionIcon
                                variant="default"
                                loading={exportLoading === row[keyColumn]}
                                onClick={() => handleExport(row)}
                              >
                                <IconFileExport size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          
                          {onEdit && (
                            <Tooltip label="Edit">
                              <ActionIcon
                                variant="default"
                                color="blue"
                                onClick={() => onEdit(row)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          
                          {onDelete && (
                            <Tooltip label="Delete">
                              <ActionIcon
                                variant="default"
                                color="red"
                                loading={deleteLoading === row[keyColumn]}
                                onClick={() => handleDeleteClick(row)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          
                          {extraActions?.map((action, i) => (
                            <Tooltip label={action.label} key={i}>
                              <ActionIcon
                                variant="default"
                                color={action.color}
                                loading={action.loading?.(row)}
                                onClick={() => action.onClick(row)}
                              >
                                <action.icon size={16} />
                              </ActionIcon>
                            </Tooltip>
                          ))}
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
                
                {data.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                      <Text c="dimmed">{emptyMessage}</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card.Section>

        {/* Pagination */}
        <Group justify="space-between" pt="md">
          <Pagination 
            total={totalPages} 
            value={page} 
            onChange={onPageChange}
            withEdges
          />
          <Text size="sm" c="dimmed">
            Total: {total} items
          </Text>
        </Group>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        centered
      >
        <Stack>
          <Text size="sm">
            Are you sure you want to delete{' '}
            <strong>{deleteConfirm?.[titleColumn || keyColumn]}</strong>?
          </Text>
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={handleDeleteConfirm}
              loading={!!deleteLoading}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

// Helper function to export JSON
function exportJson(data: any, fileName: string) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', fileName + '.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
