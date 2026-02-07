/**
 * Projects Page - Showcases complex arrays and nested data
 * 
 * This page demonstrates:
 * - Multiple array types (tags, members, milestones)  
 * - Nested objects within arrays
 * - Complex object fields (metadata)
 * - Status management
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function ProjectsPage() {
  return (
    <PersistedObjectRoutes
      api="/api/projects"
      title="Projects"
      description="Project management with complex arrays and nested member data"
    />
  )
}