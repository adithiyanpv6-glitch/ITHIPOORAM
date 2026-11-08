import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected administrative and sensitive financial routes
const SENSITIVE_ROUTES = ['/reports', '/users', '/audit', '/api/admin/day-close', '/api/audit'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const isExternalCloudflareTunnel = Boolean(cfConnectingIp) || host.includes('trycloudflare.com');

  // Safety Shield: Block external tunnel traffic from accessing back-office financials & staff PINs
  if (isExternalCloudflareTunnel) {
    const isSensitive = SENSITIVE_ROUTES.some((route) => pathname.startsWith(route));
    if (isSensitive) {
      // Check if request has a valid staff session cookie
      const staffSession = request.cookies.get('staff_session')?.value;
      if (!staffSession) {
        // Redirect external customer to customer ordering portal safely
        return NextResponse.redirect(new URL('/qr', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|woff2|woff|ttf)).*)'],
};
