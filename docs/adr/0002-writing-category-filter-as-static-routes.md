# Writing category filter uses prerendered routes, not client-side filtering

FR-05 requires category filtering on the writing archive. Rather than a script that hides rows on `/writing`, each category gets a prerendered page at `/writing/category/[category]`, and the filter chips are plain links. This keeps the archive zero-JavaScript, makes filtered views shareable and indexable, and makes keyboard access automatic. The cost is extra routes beyond the PRD's information architecture list. Decided by the owner on 2026-11-18.
