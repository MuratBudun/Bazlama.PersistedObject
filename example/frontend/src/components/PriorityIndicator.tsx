/**
 * PriorityIndicator - Example custom UI component for priority/level fields.
 *
 * Demonstrates how to create a project-specific component that:
 * - Renders a Select in forms (with colored level indicators)
 * - Renders a colored pill with icon in table cells
 * - Reads level definitions from ui_props (defined in backend model)
 *
 * Backend usage:
 *   priority: int = StandardField(
 *       default=0,
 *       description="Priority level",
 *       json_schema_extra={
 *           "ui_component": "PriorityIndicator",
 *           "ui_props": {
 *               "levels": [
 *                   {"value": 0, "label": "Low", "color": "green"},
 *                   {"value": 1, "label": "Medium", "color": "yellow"},
 *                   {"value": 2, "label": "High", "color": "red"},
 *               ]
 *           }
 *       }
 *   )
 */

import { Select, Badge, Group, Text } from '@mantine/core';
import { IconArrowDown, IconArrowRight, IconArrowUp } from '@tabler/icons-react';
import type { UiComponentProps, UiCellProps } from '@persisted-object/react';

interface PriorityLevel {
  value: number;
  label: string;
  color: string;
}

const priorityIcons: Record<string, React.ReactNode> = {
  green: <IconArrowDown size={12} />,
  yellow: <IconArrowRight size={12} />,
  red: <IconArrowUp size={12} />,
};

/**
 * Form field component: renders a Select with priority levels.
 */
export function PriorityIndicatorField({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
  uiProps,
}: UiComponentProps) {
  const levels: PriorityLevel[] = uiProps?.levels ?? [];

  const selectData = levels.map((lvl) => ({
    value: String(lvl.value),
    label: lvl.label,
  }));

  return (
    <Select
      label={label}
      description={description}
      value={value !== undefined && value !== null ? String(value) : ''}
      onChange={(val) => onChange(val !== null ? Number(val) : 0)}
      data={selectData}
      disabled={disabled}
      required={required}
      error={error}
      allowDeselect={false}
      renderOption={({ option, checked }) => {
        const lvl = levels.find((l) => String(l.value) === option.value);
        const icon = priorityIcons[lvl?.color ?? 'gray'];
        return (
          <Group gap={8} wrap="nowrap">
            {icon}
            <Badge
              variant={checked ? 'filled' : 'light'}
              color={lvl?.color ?? 'gray'}
              size="sm"
            >
              {option.label}
            </Badge>
          </Group>
        );
      }}
    />
  );
}

/**
 * Cell renderer component: renders a colored priority pill in the table.
 */
export function PriorityIndicatorCell({ value, uiProps }: UiCellProps) {
  const levels: PriorityLevel[] = uiProps?.levels ?? [];
  const numVal = typeof value === 'number' ? value : Number(value);
  const matched = levels.find((l) => l.value === numVal);

  if (value === null || value === undefined) {
    return <Text size="sm" c="dimmed">—</Text>;
  }

  const icon = priorityIcons[matched?.color ?? 'gray'];

  return (
    <Badge
      variant="light"
      color={matched?.color ?? 'gray'}
      size="sm"
      leftSection={icon}
    >
      {matched?.label ?? String(value)}
    </Badge>
  );
}
