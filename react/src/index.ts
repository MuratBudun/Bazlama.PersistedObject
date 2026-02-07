/**
 * @persisted-object/react
 * 
 * React components and hooks for building CRUD interfaces with PersistedObject backend.
 */

// Export hooks
export { useCrudList } from './hooks/useCrudList';
export { useCrudGet } from './hooks/useCrudGet';
export { useCrudMutation } from './hooks/useCrudMutation';
export { useCrudSchema } from './hooks/useCrudSchema';

// Export components
export { CrudPage } from './components/CrudPage';
export type { CrudPageProps } from './components/CrudPage';

export { DataTable } from './components/DataTable';
export type { DataTableProps, DataTableColumn, DataTableAction } from './components/DataTable';

export { PersistedObjectCrud } from './components/PersistedObjectCrud';
export type { PersistedObjectCrudProps } from './components/PersistedObjectCrud';

export { PersistedObjectRoutes } from './components/PersistedObjectRoutes';
export type { PersistedObjectRoutesProps } from './components/PersistedObjectRoutes';

export { JsonSchemaForm } from './components/JsonSchemaForm';
export type { JsonSchemaFormProps } from './components/JsonSchemaForm';

// Export UI Component system (context + provider)
export { UiComponentProvider, useUiComponents } from './context/UiComponentContext';
export type {
  UiComponentProps,
  UiCellProps,
  UiComponentMap,
  UiCellRendererMap,
  UiComponentProviderProps,
} from './context/UiComponentContext';

// Export built-in UI components
export {
  PasswordFieldComponent,
  JsonEditorComponent,
  ColorPickerComponent,
  TagsInputComponent,
  defaultUiComponents,
  defaultCellRenderers,
} from './ui-components';

// Export API client
export { CrudApiClient, configureApiClient } from './api/CrudApiClient';
export type { ApiClientConfig } from './api/CrudApiClient';

// Export types
export type {
  CrudListOptions,
  CrudListResult,
  CrudMutationResult,
  CrudSchema,
} from './types';

