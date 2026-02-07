/**
 * Settings Page - Basic key-value model
 * 
 * This page demonstrates:
 * - Simple key-value storage
 * - Category organization
 * - Basic field types (string, description)
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function SettingsPage() {
  return (
    <PersistedObjectRoutes
      api="/api/settings"
      title="App Settings"
      description="Basic key-value configuration storage - the simplest PersistedObject example"
    />
  )
}
