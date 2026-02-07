/**
 * Users Page - Showcases secure encrypted storage
 * 
 * This page demonstrates:
 * - Secure JSON encryption (__encrypt_json__ = True)
 * - Array fields (tags, permissions, favorite_categories)
 * - Complex objects (profile, settings)
 * - Timestamp fields
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function UsersPage() {
  return (
    <PersistedObjectRoutes
      api="/api/users"
      title="Users"
      description="User management with secure encrypted storage and array fields"
    />
  )
}