/**
 * JsonSchemaForm - Dynamic form generator from JSON Schema.
 * 
 * This is a simplified version for the standalone package.
 * In production, you would use a more sophisticated JSON Schema form library
 * like @rjsf/core, react-jsonschema-form, or the PydanticForm from qmex-ai.
 * 
 * For now, this renders basic inputs for common field types.
 */

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
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

export const JsonSchemaForm = forwardRef<JsonSchemaFormRef, JsonSchemaFormProps>(({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  readOnly = false,
  loading = false,
  hideButtons = false,
}, ref) => {
  // Ensure initialValues is never null/undefined
  const safeInitialValues = initialValues || {};
  const [values, setValues] = useState<any>(safeInitialValues);
  const [errors, setErrors] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { resolveComponent } = useUiComponents();
  const isMobile = useMediaQuery('(max-width: 768px)');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: any = {};
    const requiredFields = schema?.required || [];
    
    for (const field of requiredFields) {
      if (!values[field]) {
        newErrors[field] = 'This field is required';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setValues({ ...values, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  if (!schema?.properties) {
    return <div>Loading schema...</div>;
  }

  const properties = schema.properties;
  const required = schema.required || [];
  
  // Filter out null/undefined properties before mapping
  const validProperties = Object.entries(properties).filter(([_, prop]) => prop != null);

  // Sort by ui_index if present (stable sort preserves original order for equal/missing values)
  const sortedProperties = [...validProperties].sort((a, b) => {
    const indexA = (a[1] as any)?.ui_index ?? Infinity;
    const indexB = (b[1] as any)?.ui_index ?? Infinity;
    return indexA - indexB;
  });

  // On mobile: all fields full width, no grid
  // On desktop: group fields into rows based on ui_width (6-column grid)
  const rows: { key: string; prop: any; width: number }[][] = [];
  let currentRow: { key: string; prop: any; width: number }[] = [];
  let currentRowWidth = 0;

  for (const [key, prop] of sortedProperties) {
    const width = isMobile ? 6 : Math.max(1, Math.min(6, (prop as any)?.ui_width ?? 6));

    if (currentRowWidth + width > 6 && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
    currentRow.push({ key, prop, width });
    currentRowWidth += width;

    if (currentRowWidth >= 6) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Stack>
        {rows.map((row, rowIndex) => {
          // If single field with full width, render without grid wrapper
          if (row.length === 1 && row[0].width === 6) {
            const { key, prop } = row[0];
            return renderField(key, prop, rowIndex);
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
                    {renderField(key, prop, rowIndex)}
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

  // Render a single field by key
  function renderField(key: string, prop: any, rowIndex: number) {
    if (!prop || typeof prop !== 'object') {
      return null;
    }

    const isRequired = required.includes(key);
    const label = prop?.title || formatLabel(key);
    const description = prop?.description;
    const value = values?.[key];
    const error = errors?.[key];

    // Detect field type
    const type = detectFieldType(prop);

    // === UI Component Resolution ===
    const uiComponentName = prop?.ui_component;
    if (uiComponentName) {
      const CustomComponent = resolveComponent(uiComponentName);
      if (CustomComponent) {
        return (
          <CustomComponent
            key={key}
            value={value}
            onChange={(val: any) => handleChange(key, val)}
            label={label}
            description={description}
            disabled={readOnly}
            required={isRequired}
            error={error}
            schema={prop}
            uiProps={prop?.ui_props}
          />
        );
      }
    }

    // Handle arrays
    if (type === 'array') {
      return renderArrayField(key, prop, label, description, value, error, isRequired);
    }

    // Handle objects
    if (type === 'object') {
      return renderObjectField(key, prop, label, description, value, error, isRequired);
    }

    // Render appropriate input based on type
    if (type === 'boolean') {
      return (
        <Checkbox
          key={key}
          label={label}
          description={description}
          checked={!!value}
          onChange={(e) => handleChange(key, e.currentTarget.checked)}
          disabled={readOnly}
          error={error}
        />
      );
    }

    if (type === 'number' || type === 'integer') {
      return (
        <NumberInput
          key={key}
          label={label}
          description={description}
          value={value || ''}
          onChange={(val) => handleChange(key, val)}
          disabled={readOnly}
          required={isRequired}
          error={error}
        />
      );
    }

    if (type === 'textarea') {
      return (
        <Textarea
          key={key}
          label={label}
          description={description}
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={readOnly}
          required={isRequired}
          error={error}
          rows={4}
        />
      );
    }

    // Default to text input
    return (
      <TextInput
        key={key}
        label={label}
        description={description}
        value={value || ''}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={readOnly}
        required={isRequired}
        error={error}
      />
    );
  }

  // Render array field with add/remove functionality
  function renderArrayField(key: string, prop: any, label: string, description: string, value: any[], error: string, isRequired: boolean) {
    const arrayValue = Array.isArray(value) ? value : [];
    const itemType = prop?.items?.type || 'string';
    
    const addItem = () => {
      const newValue = [...arrayValue];
      if (itemType === 'string') {
        newValue.push('');
      } else if (itemType === 'object') {
        newValue.push({});
      } else if (itemType === 'number' || itemType === 'integer') {
        newValue.push(0);
      } else if (itemType === 'boolean') {
        newValue.push(false);
      }
      handleChange(key, newValue);
    };
    
    const removeItem = (index: number) => {
      const newValue = arrayValue.filter((_, i) => i !== index);
      handleChange(key, newValue);
    };
    
    const updateItem = (index: number, itemValue: any) => {
      const newValue = [...arrayValue];
      newValue[index] = itemValue;
      handleChange(key, newValue);
    };
    
    return (
      <Box key={key}>
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
            <ActionIcon 
              variant="subtle" 
              color="blue" 
              onClick={addItem}
              size="sm"
            >
              <IconPlus size={16} />
            </ActionIcon>
          )}
        </Group>
        
        <Stack gap="xs">
          {arrayValue.map((item, index) => (
            <Paper key={index} p="sm" withBorder>
              <Group align="flex-start" gap="xs">
                <Box style={{ flex: 1 }}>
                  {itemType === 'string' && (
                    <TextInput
                      placeholder={`${label} item ${index + 1}`}
                      value={item || ''}
                      onChange={(e) => updateItem(index, e.target.value)}
                      disabled={readOnly}
                    />
                  )}
                  {(itemType === 'number' || itemType === 'integer') && (
                    <NumberInput
                      placeholder={`${label} item ${index + 1}`}
                      value={item || 0}
                      onChange={(val) => updateItem(index, val)}
                      disabled={readOnly}
                    />
                  )}
                  {itemType === 'boolean' && (
                    <Checkbox
                      label={`${label} item ${index + 1}`}
                      checked={!!item}
                      onChange={(e) => updateItem(index, e.currentTarget.checked)}
                      disabled={readOnly}
                    />
                  )}
                  {itemType === 'object' && (
                    <Textarea
                      placeholder={`${label} item ${index + 1} (JSON)`}
                      value={typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateItem(index, parsed);
                        } catch {
                          // Keep as string for now, will be validated on submit
                          updateItem(index, e.target.value);
                        }
                      }}
                      disabled={readOnly}
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
  }

  // Render object field as JSON textarea
  function renderObjectField(key: string, _prop: any, label: string, description: string, value: any, error: string, isRequired: boolean) {
    const objectValue = typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : '';
    
    return (
      <Box key={key}>
        <Textarea
          label={label}
          description={description}
          placeholder="Enter JSON object"
          value={objectValue}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleChange(key, parsed);
            } catch {
              // Keep as string for now, will be validated on submit
              handleChange(key, e.target.value);
            }
          }}
          disabled={readOnly}
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
  }
});

// Helper: Detect field type from JSON Schema property
function detectFieldType(property: any): string {
  // Check explicit type
  if (property.type === 'boolean') return 'boolean';
  if (property.type === 'number' || property.type === 'integer') return 'number';
  if (property.type === 'array') return 'array';
  if (property.type === 'object') return 'object';
  
  // Check for textarea hints (DescriptionField=800, ContentField=4000 → textarea)
  // TitleField=400 stays as text input
  if (property.maxLength && property.maxLength > 500) return 'textarea';
  
  // Check anyOf for nullable types
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

// Helper: Format label from field name
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
