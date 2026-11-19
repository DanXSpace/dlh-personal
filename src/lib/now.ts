/**
 * The Now entry (PRD FR-08, architecture §5.3): one Markdown file,
 * `now/index.md`, whose body is a short introduction followed by `##` sections
 * for Building, Learning, Exploring, Training and Listening. The schema lives
 * here rather than inline in `content.config.ts` so it can be unit tested.
 */
import { z } from 'astro/zod';

const updatedMessage = 'Add an `updated` date in YYYY-MM-DD form: the day this snapshot was last revised.';

export const nowSchema = z.object({
  updated: z.coerce.date({ error: updatedMessage }),
  /** One or two sentences for the homepage's "In the present" section (ticket 14). */
  summary: z.string().trim().min(1).max(160).optional(),
});
