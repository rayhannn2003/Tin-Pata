import { brand } from '@/styles/theme';

export const APP_NAME = brand.displayName;

export const ROUTES = {
  home: '/',
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  dashboard: '/dashboard',
  library: '/dashboard/library',
  reading: '/dashboard/reading',
  analytics: '/dashboard/analytics',
  settings: '/dashboard/settings',
  book: (id: string) => `/dashboard/library/${id}`,
  reader: (id: string) => `/dashboard/reader/${id}`,
} as const;

/** Paths that never require auth. */
export const PUBLIC_PATHS = [
  '/',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

/** Prefixes that require a signed-in user. */
export const PROTECTED_PREFIXES = ['/dashboard'] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith('/auth');
}

export const DASHBOARD_NAV = [
  { href: ROUTES.dashboard, label: 'Dashboard', match: 'exact' as const },
  { href: ROUTES.library, label: 'Library', match: 'prefix' as const },
  { href: ROUTES.reading, label: 'Reading', match: 'prefix' as const },
  { href: ROUTES.analytics, label: 'Analytics', match: 'prefix' as const },
  { href: ROUTES.settings, label: 'Settings', match: 'prefix' as const },
] as const;

export const SUPABASE_TABLES = {
  books: 'books',
  notes: 'notes',
  bookmarks: 'bookmarks',
  readingSessions: 'reading_sessions',
  profiles: 'profiles',
} as const;

export const MIN_PASSWORD_LENGTH = 6;
