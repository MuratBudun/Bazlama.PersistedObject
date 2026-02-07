/**
 * PasswordField - Built-in UI component for password/secret fields.
 * 
 * Renders a Mantine PasswordInput with show/hide toggle.
 * Registered as "PasswordField" in the UI component registry.
 * 
 * Backend usage:
 *   secret: str = PasswordField(description="API secret key")
 */

import { PasswordInput } from '@mantine/core';
import type { UiComponentProps } from '../context/UiComponentContext';

export function PasswordFieldComponent({
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  error,
}: UiComponentProps) {
  return (
    <PasswordInput
      label={label}
      description={description}
      value={value || ''}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
      required={required}
      error={error}
    />
  );
}
