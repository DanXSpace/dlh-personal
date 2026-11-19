/**
 * Content dates. Frontmatter dates are calendar days that parse as UTC
 * midnight, so both forms read them in UTC: otherwise a build machine behind
 * UTC would show the previous day.
 */

const display = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

/** Human-readable, e.g. "November 19, 2026" (the design spec's own date style). */
export function formatDate(date: Date): string {
  return display.format(date);
}

/** Machine-readable `YYYY-MM-DD`, for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
