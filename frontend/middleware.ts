import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_TOKEN = process.env.KANCLAW_AUTH_TOKEN;
const IS_PUBLIC = process.env.KANCLAW_PUBLIC === 'true';

export function middleware(request: NextRequest) {
  // Skip auth if KANCLAW_PUBLIC=true
  if (IS_PUBLIC) {
    return addSecurityHeaders(request);
  }

  // Require auth if KANCLAW_AUTH_TOKEN is set
  if (AUTH_TOKEN) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== AUTH_TOKEN) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer',
        },
      });
    }
  }

  return addSecurityHeaders(request);
}

function addSecurityHeaders(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const headers = {
    // Prevent XSS attacks
    'X-XSS-Protection': '1; mode=block',
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: http: https:",
      "frame-ancestors 'none'",
    ].join('; '),
    // Permissions Policy (modern browsers)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
    ].join(', '),
  };

  // Apply headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HSTS (only on production)
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
