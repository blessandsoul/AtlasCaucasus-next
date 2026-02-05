'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr: false to ensure client-only rendering
// This prevents hydration errors since Agentation requires browser DOM access
const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
);

/**
 * AgentationProvider - Development-only component for UI annotation
 *
 * Provides visual feedback tool for AI coding agents. Allows developers to:
 * - Annotate UI elements visually
 * - Generate precise CSS selectors
 * - Copy structured feedback to clipboard
 *
 * Only renders in development mode. Fully tree-shaken in production builds.
 */
export function AgentationProvider() {
  // Return null in production - Next.js will tree-shake this entire component
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Optional: Check for explicit disable flag
  if (process.env.NEXT_PUBLIC_ENABLE_AGENTATION === 'false') {
    return null;
  }

  return (
    <Agentation
      copyToClipboard={true}
    />
  );
}
