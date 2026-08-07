/**
 * Server-side feature flags.
 * These are NEVER exposed to the browser — never prefix with NEXT_PUBLIC_.
 *
 * MULTI_PROFILE_ENABLED:
 *   When false (default): single-profile behavior is completely unchanged.
 *   When true: multi-profile UI is shown, card profile-switching is enabled,
 *              and persistent /p/[slug] routes are active.
 */
export function isMultiProfileEnabled(): boolean {
  return process.env.MULTI_PROFILE_ENABLED === 'true';
}
