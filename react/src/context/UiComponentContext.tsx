/**
 * UiComponentContext - Registry for custom UI components.
 * 
 * This context provides a way to register custom form field components
 * and table cell renderers that are resolved via the `ui_component` hint
 * in JSON Schema (set via Pydantic's `json_schema_extra`).
 * 
 * Usage:
 *   // 1. Define custom components
 *   const myComponents = {
 *     "PasswordField": PasswordInput,
 *     "ColorPicker": ColorPickerField,
 *   };
 * 
 *   // 2. Wrap your app
 *   <UiComponentProvider components={myComponents}>
 *     <App />
 *   </UiComponentProvider>
 * 
 *   // 3. Backend model defines ui_component in json_schema_extra:
 *   //    secret: str = PasswordField(description="API secret")
 *   //    → schema output: { "ui_component": "PasswordField" }
 *   //    → JsonSchemaForm auto-resolves to registered component
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props passed to every custom form field component.
 * All registered ui_component implementations must accept these props.
 */
export interface UiComponentProps {
  /** Current field value */
  value: any;
  /** Callback to update the field value */
  onChange: (value: any) => void;
  /** Field label (derived from schema title or field name) */
  label: string;
  /** Field description from schema */
  description?: string;
  /** Whether the field is disabled (readOnly mode) */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Validation error message */
  error?: string;
  /** The full JSON Schema property definition for this field */
  schema?: any;
  /** Extra props from json_schema_extra.ui_props */
  uiProps?: Record<string, any>;
}

/**
 * Props passed to custom table cell renderer components.
 * Used in DataTable to render cell values with custom components.
 */
export interface UiCellProps {
  /** The cell value */
  value: any;
  /** The full row data */
  row: Record<string, any>;
  /** The JSON Schema property definition for this column */
  schema?: any;
  /** Extra props from json_schema_extra.ui_props */
  uiProps?: Record<string, any>;
}

/** Map of component name → React component for form fields */
export type UiComponentMap = Record<string, React.ComponentType<UiComponentProps>>;

/** Map of component name → React component for table cells */
export type UiCellRendererMap = Record<string, React.ComponentType<UiCellProps>>;

// ============================================================
// Context
// ============================================================

interface UiComponentContextValue {
  /** Registered form field components */
  components: UiComponentMap;
  /** Registered table cell renderers */
  cellRenderers: UiCellRendererMap;
  /** Resolve a form component by name. Returns undefined if not found. */
  resolveComponent: (name: string) => React.ComponentType<UiComponentProps> | undefined;
  /** Resolve a cell renderer by name. Returns undefined if not found. */
  resolveCellRenderer: (name: string) => React.ComponentType<UiCellProps> | undefined;
}

const UiComponentContext = createContext<UiComponentContextValue>({
  components: {},
  cellRenderers: {},
  resolveComponent: () => undefined,
  resolveCellRenderer: () => undefined,
});

// ============================================================
// Provider
// ============================================================

export interface UiComponentProviderProps {
  /** Custom form field components to register */
  components?: UiComponentMap;
  /** Custom table cell renderers to register */
  cellRenderers?: UiCellRendererMap;
  children: ReactNode;
}

/**
 * Provider that makes custom UI components available throughout the app.
 * 
 * Components are resolved by the `ui_component` key in JSON Schema properties.
 * If a component is not found in the registry, the default rendering is used.
 * 
 * @example
 * ```tsx
 * import { UiComponentProvider, defaultUiComponents } from '@persisted-object/react';
 * import { MyCustomEditor } from './components/MyCustomEditor';
 * 
 * <UiComponentProvider 
 *   components={{
 *     ...defaultUiComponents,           // built-in components
 *     "MyCustomEditor": MyCustomEditor,  // project-specific component
 *   }}
 * >
 *   <App />
 * </UiComponentProvider>
 * ```
 */
export function UiComponentProvider({
  components = {},
  cellRenderers = {},
  children,
}: UiComponentProviderProps) {
  const value = useMemo<UiComponentContextValue>(() => ({
    components,
    cellRenderers,
    resolveComponent: (name: string) => components[name],
    resolveCellRenderer: (name: string) => cellRenderers[name],
  }), [components, cellRenderers]);

  return (
    <UiComponentContext.Provider value={value}>
      {children}
    </UiComponentContext.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to access the UI component registry.
 * Used internally by JsonSchemaForm and DataTable.
 * 
 * @example
 * ```tsx
 * const { resolveComponent, resolveCellRenderer } = useUiComponents();
 * const CustomField = resolveComponent("PasswordField");
 * ```
 */
export function useUiComponents() {
  return useContext(UiComponentContext);
}
