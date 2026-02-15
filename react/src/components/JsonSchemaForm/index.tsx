/**
 * JsonSchemaForm - Dynamic form generator from JSON Schema.
 * 
 * Performance-optimized: Each form field is a memoized component that only 
 * re-renders when its own value/error changes, not on every keystroke.
 * 
 * Key optimizations:
 * - React.memo on every field component (FormField, ArrayFormField, ObjectFormField)
 * - useCallback with functional state updater for handleChange (no closure over values)
 * - useMemo for row layout computation (only recalculates when schema/isMobile changes)
 * - Stable per-field onChange callbacks via useCallback inside memoized components
 */

import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback, useMemo, memo } from 'react';
import { Stack, TextInput, Textarea, Checkbox, NumberInput, Button, Group, Text, ActionIcon, Box, Paper } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useUiComponents } from '../../context/UiComponentContext';

export interface JsonSchemaFormProps {
  schema: any;
  initialValues?: any;
  onSubmit?: (values: any) => void | Promise<void>;
  onCancel?: () => void;
  readOnly?: boolean;
  loading?: boolean;
  hideButtons?: boolean;
}

export interface JsonSchemaFormRef {
  submit: () => void;
}

// ============================================================
// Helper functions (module-level, not recreated per render)
// ============================================================

/** Detect field type from JSON Schema property */
function detectFieldType(property: any): string {
  if (property.type === 'boolean') return 'boolean';
  if (property.type === 'number' || property.type === 'integer') return 'number';
  if (property.type === 'array') return 'array';
  if (property.type === 'object') return 'object';
  if (property.maxLength && property.maxLength > 500) return 'textarea';
  if (Array.isArray(property.anyOf)) {
    for (const option of property.anyOf) {
      if (option.type === 'boolean') return 'boolean';
      if (option.type === 'number' || option.type === 'integer') return 'number';
      if (option.type === 'array') return 'array';
      if (option.type === 'object') return 'object';
    }
  }
  return 'string';
}

/** Format label from field name */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/** Get default value for array item based on type */
function getDefaultArrayItem(itemType: string): any {
  if (itemType === 'string') return '';
  if (itemType === 'object') return {};
  if (itemType === 'number' || itemType === 'integer') return 0;
  if (itemType === 'boolean') return false;
  return '';
}

// ============================================================
// Memoized Field Components
// ============================================================

interface FormFieldProps {
  fieldKey: string;
  prop: any;
  value: any;
  error: string | undefined;
  isRequired: boolean;
  readOnly: boolean;
  onChange: (field: string, value: any) => void;
  resolveComponent: (name: string) => any;
}

/**
 * ArrayFormField - Memoized array field with add/remove items.
 * Only re-renders when its specific value or error changes.
 */
const ArrayFormField = memo(function ArrayFormField({
  fieldKey, prop, value, error, isRequired, readOnly, onChange,
}: Omit<FormFieldProps, 'resolveComponent'>) {
  const label = prop?.title || formatLabel(fieldKey);
  const description = prop?.description;
  const arrayValue = Array.isArray(value) ? value : [];
  const itemType = prop?.items?.type || 'string';

  const handleFieldChange = useCallback((val: any) => {
    onChange(fieldKey, val);
  }, [fieldKey, onChange]);

  const addItem = useCallback(() => {
    handleFieldChange([...arrayValue, getDefaultArrayItem(itemType)]);
  }, [arrayValue, itemType, handleFieldChange]);

  const removeItem = useCallback((index: number) => {
    handleFieldChange(arrayValue.filter((_: any, i: number) => i !== index));
  }, [arrayValue, handleFieldChange]);

  const updateItem = useCallback((index: number, itemValue: any) => {
    const newValue = [...arrayValue];
    newValue[index] = itemValue;
    handleFieldChange(newValue);
  }, [arrayValue, handleFieldChange]);

  return (
    <Box>
      <Group justify="space-between" align="flex-end" mb="xs">
        <div>
          <Text fw={500} size="sm">
            {label} {isRequired && <Text component="span" c="red">*</Text>}
          </Text>
          {description && (
            <Text size="xs" c="dimmed" mt={2}>
              {description}
            </Text>
          )}
        </div>
        {!readOnly && (
          <ActionIcon variant="subtle" color="blue" onClick={addItem} size="sm">
            <IconPlus size={16} />
          </ActionIcon>
        )}
      </Group>

      <Stack gap="xs">
        {arrayValue.map((item: any, index: number) => (
          <Paper key={index} p="sm" withBorder>
            <Group align="flex-start" gap="xs">
              <Box style={{ flex: 1 }}>
                {itemType === 'string' && (
                  <TextInput
                    placeholder={`${label} item ${index + 1}`}
                    value={item || ''}
                    onChange={(e) => updateItem(index, e.target.value)}
                    readOnly={readOnly}
                    variant={readOnly ? 'filled' : 'default'}
                  />
                )}
                {(itemType === 'number' || itemType === 'integer') && (
                  <NumberInput
                    placeholder={`${label} item ${index + 1}`}
                    value={item || 0}
                    onChange={(val) => updateItem(index, val)}
                    readOnly={readOnly}
                    variant={readOnly ? 'filled' : 'default'}
                  />
                )}
                {itemType === 'boolean' && (
                  <Checkbox
                    label={`${label} item ${index + 1}`}
                    checked={!!item}
                    onChange={readOnly ? undefined : (e) => updateItem(index, e.currentTarget.checked)}
                    styles={readOnly ? { input: { pointerEvents: 'none' } } : undefined}
                  />
                )}
                {itemType === 'object' && (
                  <Textarea
                    placeholder={`${label} item ${index + 1} (JSON)`}
                    value={typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                    onChange={(e) => {
                      try {
                        updateItem(index, JSON.parse(e.target.value));
                      } catch {
                        updateItem(index, e.target.value);
                      }
                    }}
                    readOnly={readOnly}
                    variant={readOnly ? 'filled' : 'default'}
                    rows={3}
                  />
                )}
              </Box>
              {!readOnly && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => removeItem(index)}
                  size="sm"
                  mt="xs"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              )}
            </Group>
          </Paper>
        ))}

        {arrayValue.length === 0 && (
          <Text size="sm" c="dimmed" style={{ textAlign: 'center', padding: '20px' }}>
            No items yet. Click the + button to add one.
          </Text>
        )}
      </Stack>

      {error && (
        <Text size="sm" c="red" mt="xs">
          {error}
        </Text>
      )}
    </Box>
  );
});

/**
 * ObjectFormField - Memoized object/JSON field.
 * Only re-renders when its specific value or error changes.
 */
const ObjectFormField = memo(function ObjectFormField({
  fieldKey, prop, value, error, isRequired, readOnly, onChange,
}: Omit<FormFieldProps, 'resolveComponent'>) {
  const label = prop?.title || formatLabel(fieldKey);
  const description = prop?.description;
  const objectValue = typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : '';

  const handleFieldChange = useCallback((val: any) => {
    onChange(fieldKey, val);
  }, [fieldKey, onChange]);

  return (
    <Box>
      <Textarea
        label={label}
        description={description}
        placeholder="Enter JSON object"
        value={objectValue}
        onChange={(e) => {
          try {
            handleFieldChange(JSON.parse(e.target.value));
          } catch {
            handleFieldChange(e.target.value);
          }
        }}
        readOnly={readOnly}
        variant={readOnly ? 'filled' : 'default'}
        required={isRequired}
        error={error}
        rows={6}
        styles={{
          input: {
            fontFamily: 'monospace',
            fontSize: '13px'
          }
        }}
      />
    </Box>
  );
});

/**
 * FormField - Memoized form field component.
 * This is the core optimization: each field only re-renders when its own 
 * value or error changes, not when any other field in the form changes.
 */
const FormField = memo(function FormField({
  fieldKey, prop, value, error, isRequired, readOnly, onChange, resolveComponent,
}: FormFieldProps) {
  if (!prop || typeof prop !== 'object') return null;

  const label = prop?.title || formatLabel(fieldKey);
  const description = prop?.description;
  const type = detectFieldType(prop);

  // Stable per-field change handler
  const handleFieldChange = useCallback((val: any) => {
    onChange(fieldKey, val);
  }, [fieldKey, onChange]);

  // === UI Component Resolution ===
  const uiComponentName = prop?.ui_component;
  if (uiComponentName) {
    const CustomComponent = resolveComponent(uiComponentName);
    if (CustomComponent) {
      return (
        <CustomComponent
          value={value}
          onChange={readOnly ? () => {} : handleFieldChange}
          label={label}
          description={description}
          disabled={false}
          readOnly={readOnly}
          required={isRequired}
          error={error}
          schema={prop}
          uiProps={prop?.ui_props}
        />
      );
    }
  }

  // Handle arrays - delegate to memoized ArrayFormField
  if (type === 'array') {
    return (
      <ArrayFormField
        fieldKey={fieldKey}
        prop={prop}
        value={value}
        error={error}
        isRequired={isRequired}
        readOnly={readOnly}
        onChange={onChange}
      />
    );
  }

  // Handle objects - delegate to memoized ObjectFormField
  if (type === 'object') {
    return (
      <ObjectFormField
        fieldKey={fieldKey}
        prop={prop}
        value={value}
        error={error}
        isRequired={isRequired}
        readOnly={readOnly}
        onChange={onChange}
      />
    );
  }

  // Boolean
  if (type === 'boolean') {
    return (
      <Checkbox
        label={label}
        description={description}
        checked={!!value}
        onChange={readOnly ? undefined : (e) => handleFieldChange(e.currentTarget.checked)}
        error={error}
        styles={readOnly ? { input: { pointerEvents: 'none' } } : undefined}
      />
    );
  }

  // Number / Integer
  if (type === 'number' || type === 'integer') {
    return (
      <NumberInput
        label={label}
        description={description}
        value={value || ''}
        onChange={handleFieldChange}
        readOnly={readOnly}
        variant={readOnly ? 'filled' : 'default'}
        required={isRequired}
        error={error}
      />
    );
  }

  // Textarea
  if (type === 'textarea') {
    return (
      <Textarea
        label={label}
        description={description}
        value={value || ''}
        onChange={(e) => handleFieldChange(e.target.value)}
        readOnly={readOnly}
        variant={readOnly ? 'filled' : 'default'}
        required={isRequired}
        error={error}
        rows={4}
      />
    );
  }

  // Default: TextInput
  return (
    <TextInput
      label={label}
      description={description}
      value={value || ''}
      onChange={(e) => handleFieldChange(e.target.value)}
      readOnly={readOnly}
      variant={readOnly ? 'filled' : 'default'}
      required={isRequired}
      error={error}
    />
  );
});

// ============================================================
// Main Form Component
// ============================================================

export const JsonSchemaForm = forwardRef<JsonSchemaFormRef, JsonSchemaFormProps>(({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  readOnly = false,
  loading = false,
  hideButtons = false,
}, ref) => {
  // Build default values from schema for create mode
  const buildDefaults = useCallback((s: any) => {
    if (!s?.properties) return {};
    const defaults: any = {};
    for (const [key, prop] of Object.entries(s.properties) as [string, any][]) {
      if (prop == null) continue;
      if (prop.default !== undefined) {
        defaults[key] = prop.default;
      } else {
        const type = detectFieldType(prop);
        if (type === 'boolean') defaults[key] = false;
        else if (type === 'number') defaults[key] = 0;
        else if (type === 'array') defaults[key] = [];
        else if (type === 'object') defaults[key] = {};
        else defaults[key] = '';
      }
    }
    return defaults;
  }, []);

  const safeInitialValues = initialValues && Object.keys(initialValues).length > 0
    ? initialValues
    : buildDefaults(schema);
  const [values, setValues] = useState<any>(safeInitialValues);
  const [errors, setErrors] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  const valuesRef = useRef(values);
  const { resolveComponent } = useUiComponents();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Keep valuesRef in sync for submit handler
  valuesRef.current = values;

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      formRef.current?.requestSubmit();
    }
  }));

  // Update values when initialValues changes (e.g., when data loads)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setValues(initialValues);
    }
  }, [initialValues]);

  // Initialize defaults from schema when in create mode (no initialValues)
  useEffect(() => {
    if ((!initialValues || Object.keys(initialValues).length === 0) && schema?.properties) {
      setValues((prev: any) => {
        const defaults = buildDefaults(schema);
        // Only update if current values are empty (don't overwrite user edits)
        if (Object.keys(prev).length === 0) {
          return defaults;
        }
        return prev;
      });
    }
  }, [schema, initialValues, buildDefaults]);

  // PERFORMANCE: Stable handleChange using functional state updater.
  // This callback never changes, so memoized child components won't re-render 
  // due to a new onChange reference.
  const handleChange = useCallback((field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }));
    setErrors((prev: any) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const currentValues = valuesRef.current;

    // Basic validation
    const newErrors: any = {};
    const requiredFields = schema?.required || [];

    for (const field of requiredFields) {
      if (!currentValues[field]) {
        newErrors[field] = 'This field is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(currentValues);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [schema?.required, onSubmit]);

  // PERFORMANCE: Memoize sorted properties and row layout.
  // Only recalculated when schema or isMobile changes, not on every keystroke.
  const rows = useMemo(() => {
    if (!schema?.properties) return [];

    const properties = schema.properties;
    const validProperties = Object.entries(properties).filter(([_, prop]) => prop != null);
    const sortedProperties = [...validProperties].sort((a, b) => {
      const indexA = (a[1] as any)?.ui_index ?? Infinity;
      const indexB = (b[1] as any)?.ui_index ?? Infinity;
      return indexA - indexB;
    });

    const result: { key: string; prop: any; width: number }[][] = [];
    let currentRow: { key: string; prop: any; width: number }[] = [];
    let currentRowWidth = 0;

    for (const [key, prop] of sortedProperties) {
      const width = isMobile ? 6 : Math.max(1, Math.min(6, (prop as any)?.ui_width ?? 6));

      if (currentRowWidth + width > 6 && currentRow.length > 0) {
        result.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
      currentRow.push({ key, prop, width });
      currentRowWidth += width;

      if (currentRowWidth >= 6) {
        result.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
    }
    if (currentRow.length > 0) {
      result.push(currentRow);
    }
    return result;
  }, [schema, isMobile]);

  const required = useMemo(() => schema?.required || [], [schema?.required]);

  if (!schema?.properties) {
    return <div>Loading schema...</div>;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Stack>
        {rows.map((row, rowIndex) => {
          // Single full-width field: no grid wrapper needed
          if (row.length === 1 && row[0].width === 6) {
            const { key, prop } = row[0];
            return (
              <FormField
                key={key}
                fieldKey={key}
                prop={prop}
                value={values?.[key]}
                error={errors?.[key]}
                isRequired={required.includes(key)}
                readOnly={readOnly}
                onChange={handleChange}
                resolveComponent={resolveComponent}
              />
            );
          }

          return (
            <div
              key={`row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 'var(--mantine-spacing-md)',
                alignItems: 'start',
              }}
            >
              {row.map(({ key, prop, width }) => {
                const isBooleanField = detectFieldType(prop) === 'boolean';
                return (
                  <div key={key} style={{
                    gridColumn: `span ${width}`,
                    ...(isBooleanField ? { alignSelf: 'center', paddingTop: 'var(--mantine-spacing-lg)' } : {})
                  }}>
                    <FormField
                      fieldKey={key}
                      prop={prop}
                      value={values?.[key]}
                      error={errors?.[key]}
                      isRequired={required.includes(key)}
                      readOnly={readOnly}
                      onChange={handleChange}
                      resolveComponent={resolveComponent}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {!hideButtons && !readOnly && (
          <Group justify="flex-end" mt="md">
            {onCancel && (
              <Button variant="subtle" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </Group>
        )}

        {!hideButtons && readOnly && onCancel && (
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onCancel}>
              Close
            </Button>
          </Group>
        )}
      </Stack>
    </form>
  );
});
