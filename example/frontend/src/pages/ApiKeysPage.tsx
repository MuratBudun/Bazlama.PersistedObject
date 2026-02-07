/**
 * API Keys Page - Showcases secure key management
 * 
 * This page demonstrates:
 * - Secure encrypted storage for sensitive API keys
 * - Permission arrays (scopes, allowed_ips)
 * - Usage tracking with object arrays
 * - Expiration and rate limiting
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function ApiKeysPage() {
  return (
    <PersistedObjectRoutes
      api="/api/apikeys"
      title="API Keys"
      description="Secure API key management with encrypted storage and permission arrays"
    />
  )
}