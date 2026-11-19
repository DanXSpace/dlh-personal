/**
 * The writing archive (PRD FR-05, design-spec §4 `/writing`): published
 * articles in reverse chronological order, grouped by year.
 */
import { categories, type Category } from './categories.ts';

interface Dated {
  data: { published: Date };
}

export interface ArchiveYear<T> {
  year: number;
  articles: T[];
}

/**
 * Newest year first, newest article first within each year. Years are read in
 * UTC, like every content date (see `dates.ts`), so an article published on
 * January 1 never lands in the previous year on a build machine behind UTC.
 */
export function archiveByYear<T extends Dated>(articles: readonly T[]): ArchiveYear<T>[] {
  const newestFirst = [...articles].sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
  const years: ArchiveYear<T>[] = [];
  for (const article of newestFirst) {
    const year = article.data.published.getUTCFullYear();
    const current = years.at(-1);
    if (current?.year === year) current.articles.push(article);
    else years.push({ year, articles: [article] });
  }
  return years;
}

/**
 * Categories with at least one article, in the canonical order from
 * `categories.ts`. Only these get a filter link and a prerendered page
 * (ADR-0002), so no filter ever leads to an empty list.
 */
export function categoriesWithArticles(articles: readonly { data: { category: Category } }[]): Category[] {
  const used = new Set(articles.map((article) => article.data.category));
  return categories.filter((category) => used.has(category));
}
