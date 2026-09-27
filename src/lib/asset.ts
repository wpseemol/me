/** Sub-path the site is served from (e.g. "/me" on GitHub Pages), or "". */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

/** Prefix a root-relative public file with BASE_PATH. next/image and metadata icons don't do this. */
export const asset = (path: string) =>
  path.startsWith('http') ? path : `${BASE_PATH}${path.startsWith('/') ? '' : '/'}${path}`;
