import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from './lib/auth';
import { Role } from '@prisma/client';

// Define route permissions
const routePermissions: Record<string, Role[]> = {
  '/api/orders': [Role.ADMIN, Role.VENDEDOR, Role.JEFE_TALLER, Role.ALMACENERO],
  '/api/inventory': [Role.ADMIN, Role.ALMACENERO, Role.JEFE_TALLER, Role.VENDEDOR],
  '/api/inventory/authorize': [Role.ADMIN, Role.JEFE_TALLER],
  '/api/materia-prima': [Role.ADMIN, Role.ALMACENERO, Role.JEFE_TALLER],
  '/api/stages': [Role.ADMIN, Role.JEFE_TALLER],
  '/api/reports': [Role.ADMIN],
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public routes: login, logout, me, external
  if (
    path.startsWith('/api/login') ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/external') ||
    path === '/'
  ) {
    return NextResponse.next();
  }

  // Check token
  const token = req.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload: JWTPayload | null = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check permissions for protected routes
  for (const [routePath, allowedRoles] of Object.entries(routePermissions)) {
    if (path.startsWith(routePath)) {
      if (!allowedRoles.includes(payload.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      break;
    }
  }

  // Add user info to headers for use in route handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-name', payload.name);
  requestHeaders.set('x-user-email', payload.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
