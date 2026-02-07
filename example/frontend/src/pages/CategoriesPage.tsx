/**
 * Categories Page - Structured content with validation
 * 
 * This page demonstrates:
 * - Unique field constraints (slug)
 * - Boolean fields (is_active)
 * - Indexed fields for performance
 * - Sort ordering and icons
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function CategoriesPage() {
  return (
    <PersistedObjectRoutes
      api="/api/categories"
      title="Categories"
      description="Content categories with unique slugs and structured metadata"
    />
  )
}
