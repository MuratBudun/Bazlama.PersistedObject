/**
 * JsonEditor - Built-in UI component for JSON object/dict fields.
 * 
 * Renders a monospace textarea with live JSON validation.
 * Shows a validation indicator and formats JSON on blur.
 * Registered as "JsonEditor" in the UI component registry.
 * 
 * Backend usage:
 *   config: dict = StandardField(
 *       default_factory=dict,
 *       description="Configuration",
 *       json_schema_extra={"ui_component": "JsonEditor"}
 *   )
 */

import { useState, useEffect } from 'react';
import { Textarea, Text, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconCode } from '@tabler/icons-react';
import type { UiComponentProps } from '../context/UiComponentContext';

export function JsonEditorComponent({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
  uiProps,
}: UiComponentProps) {
  const rows = uiProps?.rows ?? 8;
  
  // Keep a text representation for editing
  const [text, setText] = useState(() => formatJson(value));
  const [isValid, setIsValid] = useState(true);

  // Sync from external value changes
  useEffect(() => {
    const formatted = formatJson(value);
    setText(formatted);
    setIsValid(true);
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    
    try {
      const parsed = JSON.parse(newText);
      setIsValid(true);
      onChange(parsed);
    } catch {
      setIsValid(false);
      // Don't update parent — keep last valid value
    }
  };

  const handleFormat = () => {
    if (!isValid) return;
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <Group justify="space-between" align="flex-end" mb={4}>
        <Text size="sm" fw={500}>
          {label} {required && <Text component="span" c="red">*</Text>}
        </Text>
        <Group gap={4}>
          {!disabled && (
            <Tooltip label="Format JSON">
              <ActionIcon 
                size="xs" 
                variant="subtle" 
                onClick={handleFormat}
                disabled={!isValid}
              >
                <IconCode size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {isValid ? (
            <IconCheck size={14} color="var(--mantine-color-green-6)" />
          ) : (
            <IconX size={14} color="var(--mantine-color-red-6)" />
          )}
        </Group>
      </Group>
      {description && (
        <Text size="xs" c="dimmed" mb={4}>
          {description}
        </Text>
      )}
      <Textarea
        value={text}
        onChange={(e) => handleChange(e.currentTarget.value)}
        disabled={disabled}
        required={required}
        error={error || (!isValid ? 'Invalid JSON' : undefined)}
        rows={rows}
        styles={{
          input: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: '13px',
            lineHeight: 1.5,
          },
        }}
      />
    </div>
  );
}

function formatJson(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}
