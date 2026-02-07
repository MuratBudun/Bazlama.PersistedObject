/**
 * Tags Page - Simple labeling system
 * 
 * This page demonstrates:
 * - Minimal model configuration
 * - Color fields for UI theming
 * - Usage tracking with counters
 * - Primary key on name field
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function TagsPage() {
  return (
    <PersistedObjectRoutes
      api="/api/tags"
      title="Tags"
      description="Simple tag system with color coding and usage tracking"
    />
  )
}
