import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection proxy with cookie-based authentication
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, static files, and _next files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/players',
    '/games',
    '/tournaments',
    '/clubs',
    '/profile',
    '/settings',
    '/import-progress',
    '/sync-status',
    '/admin',
  ];

  // Define admin-only routes
  const adminRoutes = ['/admin', '/(admin)'];

  // Define public routes (don't need authentication)
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/error',
    '/expired',
    '/unauthorized',
    '/network-error',
    '/access-denied',
    '/admin/bootstrap', // Allow access to bootstrap page
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication by looking for auth token in cookies
  const authToken = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  // Check if route needs authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !authToken) {
    // Redirect to login with return URL
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Check if route is admin-only
  const isAdminRoute = adminRoutes.some(
    (route) =>
      pathname.startsWith(route) && !pathname.startsWith('/admin/bootstrap')
  );

  if (isAdminRoute && userRole !== 'admin') {
    // Redirect to unauthorized page
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
