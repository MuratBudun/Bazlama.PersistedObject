/**
 * Events Page - Date-based event management
 * 
 * This page demonstrates:
 * - DateTime fields for date-based queries
 * - PriorityIndicator custom component (form select + colored pill in table)
 * - JsonEditor for location data
 * - TagsInput for attendees
 * - Boolean fields (is_published, is_featured)
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function EventsPage() {
  return (
    <PersistedObjectRoutes
      api="/api/events"
      title="Events"
      description="Event management with DateTime fields, priority indicators and location data"
    />
  )
}
