/**
 * Built-in UI components and default registries.
 * 
 * This module exports:
 * - Individual built-in components
 * - defaultUiComponents: pre-built form field component map
 * - defaultCellRenderers: pre-built table cell renderer map
 * 
 * Usage:
 *   import { defaultUiComponents, defaultCellRenderers } from '@persisted-object/react';
 * 
 *   <UiComponentProvider
 *     components={{ ...defaultUiComponents, ...myCustomComponents }}
 *     cellRenderers={{ ...defaultCellRenderers, ...myCellRenderers }}
 *   >
 */

import { Text, Badge, Group, ColorSwatch } from '@mantine/core';

// Built-in form components
export { PasswordFieldComponent } from './PasswordField';
export { JsonEditorComponent } from './JsonEditor';
export { ColorPickerComponent } from './ColorPicker';
export { TagsInputComponent } from './TagsInput';

// Import for registry building
import { PasswordFieldComponent } from './PasswordField';
import { JsonEditorComponent } from './JsonEditor';
import { ColorPickerComponent } from './ColorPicker';
import { TagsInputComponent } from './TagsInput';

import type { UiComponentMap, UiCellRendererMap, UiCellProps } from '../context/UiComponentContext';

// ============================================================
// Default Form Component Registry
// ============================================================

/**
 * Pre-built form field components included with the package.
 * Merge with your own components when creating the provider:
 * 
 * ```tsx
 * <UiComponentProvider components={{
 *   ...defaultUiComponents,
 *   "MyCustomField": MyCustomField,
 * }} />
 * ```
 */
export const defaultUiComponents: UiComponentMap = {
  'PasswordField': PasswordFieldComponent,
  'JsonEditor': JsonEditorComponent,
  'ColorPicker': ColorPickerComponent,
  'TagsInput': TagsInputComponent,
};

// ============================================================
// Default Cell Renderers
// ============================================================

/** Password cell: shows masked dots */
function PasswordCell({ value }: UiCellProps) {
  if (!value) return <Text size="sm" c="dimmed">—</Text>;
  return <Text size="sm" ff="monospace">••••••••</Text>;
}

/** Color cell: shows color swatch + hex code */
function ColorCell({ value }: UiCellProps) {
  if (!value) return <Text size="sm" c="dimmed">—</Text>;
  return (
    <Group gap={6} wrap="nowrap">
      <ColorSwatch color={value} size={16} />
      <Text size="sm" ff="monospace">{value}</Text>
    </Group>
  );
}

/** Tags cell: shows badges */
function TagsCell({ value }: UiCellProps) {
  if (!Array.isArray(value) || value.length === 0) {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  return (
    <Group gap={4} wrap="wrap">
      {value.slice(0, 3).map((tag, i) => (
        <Badge key={i} size="xs" variant="light">{tag}</Badge>
      ))}
      {value.length > 3 && (
        <Badge size="xs" variant="outline" c="dimmed">+{value.length - 3}</Badge>
      )}
    </Group>
  );
}

/** JSON cell: shows compact summary */
function JsonCell({ value }: UiCellProps) {
  if (value === null || value === undefined) {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return <Text size="sm" c="dimmed">[{value.length} items]</Text>;
    }
    const keys = Object.keys(value);
    return <Text size="sm" c="dimmed">{`{${keys.length} keys}`}</Text>;
  }
  
  return <Text size="sm">{String(value)}</Text>;
}

/**
 * Pre-built table cell renderers included with the package.
 * Merge with your own renderers when creating the provider:
 * 
 * ```tsx
 * <UiComponentProvider cellRenderers={{
 *   ...defaultCellRenderers,
 *   "MyCustomField": MyCustomCellRenderer,
 * }} />
 * ```
 */
export const defaultCellRenderers: UiCellRendererMap = {
  'PasswordField': PasswordCell,
  'ColorPicker': ColorCell,
  'TagsInput': TagsCell,
  'JsonEditor': JsonCell,
};
