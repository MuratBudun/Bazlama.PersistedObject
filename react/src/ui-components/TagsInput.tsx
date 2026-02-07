/**
 * TagsInput - Built-in UI component for string array fields.
 * 
 * Renders a Mantine TagsInput for easy tag management.
 * Registered as "TagsInput" in the UI component registry.
 * 
 * Backend usage:
 *   tags: List[str] = StandardField(
 *       default_factory=list,
 *       description="Tags",
 *       json_schema_extra={"ui_component": "TagsInput"}
 *   )
 */

import { TagsInput } from '@mantine/core';
import type { UiComponentProps } from '../context/UiComponentContext';

export function TagsInputComponent({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
  uiProps,
}: UiComponentProps) {
  const placeholder = uiProps?.placeholder ?? 'Type and press Enter to add';
  const maxTags = uiProps?.maxTags;
  const allowDuplicates = uiProps?.allowDuplicates ?? false;
  const splitChars = uiProps?.splitChars ?? [','];

  return (
    <TagsInput
      label={label}
      description={description}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      disabled={disabled}
      required={required}
      error={error}
      placeholder={placeholder}
      maxTags={maxTags}
      allowDuplicates={allowDuplicates}
      splitChars={splitChars}
      clearable
    />
  );
}
