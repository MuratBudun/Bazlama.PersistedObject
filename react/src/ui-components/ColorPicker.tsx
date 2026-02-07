/**
 * ColorPicker - Built-in UI component for color fields.
 * 
 * Renders a Mantine ColorInput with color swatch preview.
 * Registered as "ColorPicker" in the UI component registry.
 * 
 * Backend usage:
 *   color: str = KeyField(
 *       default="#3b82f6",
 *       description="Theme color",
 *       json_schema_extra={"ui_component": "ColorPicker"}
 *   )
 */

import { ColorInput } from '@mantine/core';
import type { UiComponentProps } from '../context/UiComponentContext';

export function ColorPickerComponent({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
  uiProps,
}: UiComponentProps) {
  const format = uiProps?.format ?? 'hex';
  const swatches = uiProps?.swatches ?? [
    '#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb',
    '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
    '#40c057', '#82c91e', '#fab005', '#fd7e14',
  ];

  return (
    <ColorInput
      label={label}
      description={description}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      required={required}
      error={error}
      format={format}
      swatches={swatches}
      swatchesPerRow={7}
    />
  );
}
