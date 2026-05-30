import { base } from '$app/paths';

/**
 * Prepend SvelteKit base path to an internal route.
 * Always use this for internal <a href> and goto() calls
 * so the app works correctly when deployed under a sub-path.
 */
export function route(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${base}${path}`;
}
