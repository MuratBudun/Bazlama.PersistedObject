/**
 * StatusBadge - Custom UI component for status/role fields.
 *
 * Renders a Select in forms (with colored options)
 * and a Badge in table cells (with matching colors).
 *
 * Backend usage:
 *   status: str = KeyField(
 *       default="draft",
 *       description="Status",
 *       json_schema_extra={
 *           "ui_component": "StatusBadge",
 *           "ui_props": {
 *               "options": [
 *                   {"value": "draft", "label": "Draft", "color": "gray"},
 *                   {"value": "active", "label": "Active", "color": "green"},
 *               ]
 *           }
 *       }
 *   )
 */

import { Select, Badge, Text } from '@mantine/core';
import type { UiComponentProps, UiCellProps } from '@persisted-object/react';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

/**
 * Form field component: renders a Select with colored indicators.
 */
export function StatusBadgeField({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
  uiProps,
}: UiComponentProps) {
  const options: StatusOption[] = uiProps?.options ?? [];

  const selectData = options.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <Select
      label={label}
      description={description}
      value={value || ''}
      onChange={(val) => onChange(val || '')}
      data={selectData}
      disabled={disabled}
      required={required}
      error={error}
      allowDeselect={false}
      renderOption={({ option, checked }) => {
        const opt = options.find((o) => o.value === option.value);
        return (
          <Badge
            variant={checked ? 'filled' : 'light'}
            color={opt?.color ?? 'gray'}
            size="sm"
          >
            {option.label}
          </Badge>
        );
      }}
    />
  );
}

/**
 * Cell renderer component: renders a colored Badge in the table.
 */
export function StatusBadgeCell({ value, uiProps }: UiCellProps) {
  const options: StatusOption[] = uiProps?.options ?? [];
  const matched = options.find((o) => o.value === value);

  if (!value) return <Text size="sm" c="dimmed">—</Text>;

  return (
    <Badge
      variant="light"
      color={matched?.color ?? 'gray'}
      size="sm"
    >
      {matched?.label ?? value}
    </Badge>
  );
}
