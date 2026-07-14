import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/config';
import { isAuthPath, isProtectedPath, ROUTES } from '@/utils/constants';

/**
 * Refreshes the auth session and enforces route protection.
 * - Protected paths require a user → redirect to /auth/sign-in
 * - Auth paths with a user → redirect to /dashboard (except reset-password)
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.signIn;
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Prefer getUser() over getSession() for secure server validation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Keep reset-password reachable while recovery session is active.
  const isResetPassword = pathname === ROUTES.resetPassword;
  if (isAuthPath(pathname) && user && !isResetPassword) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.dashboard;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
