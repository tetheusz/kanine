import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes
    const publicPaths = ['/', '/login', '/register'];
    const isPublic = publicPaths.includes(pathname);
    const isApiAuth = pathname.startsWith('/api/auth');
    const isApiRegister = pathname.startsWith('/api/register');
    const isCheckLatest = pathname.startsWith('/api/check-latest'); // TEMP FIX
    const isDebugDb = pathname.startsWith('/api/debug-db');
    const isFixSchema = pathname.startsWith('/api/fix-schema');
    const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.');

    if (isPublic || isApiAuth || isApiRegister || isCheckLatest || isDebugDb || isFixSchema || isStaticAsset) {
        return NextResponse.next();
    }

    // Check JWT token (edge-compatible, no fs dependency)
    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production'
    });

    console.log('[MW] Debug:', {
        path: pathname,
        hasToken: !!token,
        cookieNames: request.cookies.getAll().map(c => c.name),
        isProduction: process.env.NODE_ENV === 'production',
        url: request.url
    });

    if (!token) {
        console.log('[MW] Redirecting to login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
