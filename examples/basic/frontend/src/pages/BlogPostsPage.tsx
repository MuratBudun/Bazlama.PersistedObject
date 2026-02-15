/**
 * Blog Posts Page - Showcases rich content and arrays
 * 
 * This page demonstrates:
 * - Rich content blocks as arrays
 * - Multi-language support with nested objects
 * - SEO arrays (meta_keywords)
 * - Social interaction tracking
 * - Complex nested translation objects
 */

import { PersistedObjectRoutes } from '@persisted-object/react'

export default function BlogPostsPage() {
  return (
    <PersistedObjectRoutes
      api="/api/blogposts"
      title="Blog Posts"
      description="Rich blog content management with structured content blocks and multi-language support"
    />
  )
}