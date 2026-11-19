/**
 * Résumé availability (PRD FR-10, architecture §4): the one rule every
 * résumé link on the site follows. The résumé is downloadable once the owner
 * puts `resume.pdf` in `public/`; until then `/resume` says it is available
 * on request, and no other page links to it.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { site } from '../site.config.ts';
import { resolveContentSource } from './content-source.ts';
import { visibleLinks, type Link, type SiteLinks } from './links.ts';

const PDF_FILE = 'resume.pdf';

export type ResumeAccess = { kind: 'pdf'; href: string } | { kind: 'on-request'; contacts: Link[] };

export function resumeAccess(pdfPresent: boolean, links: SiteLinks): ResumeAccess {
  if (pdfPresent) return { kind: 'pdf', href: `/${PDF_FILE}` };
  // A request goes through a contact channel (`links.ts`).
  return { kind: 'on-request', contacts: visibleLinks(links, 'contact') };
}

/**
 * Résumé links outside `/resume` (footer, homepage): one link to the résumé
 * page once the PDF is hosted, none before, so no link leads to a dead end.
 */
export function resumeLinks(access: ResumeAccess): Link[] {
  return access.kind === 'pdf' ? [{ label: 'Résumé', href: '/resume' }] : [];
}

/** Whether any public layer (see `ContentSource.publicDirs`) holds the PDF. */
export function resumePdfPresent(publicDirs: string[]): boolean {
  return publicDirs.some((dir) => existsSync(resolve(dir, PDF_FILE)));
}

/** Résumé access for the current build: call this from pages and components. */
export function siteResumeAccess(): ResumeAccess {
  return resumeAccess(resumePdfPresent(resolveContentSource(process.env).publicDirs), site.links);
}
