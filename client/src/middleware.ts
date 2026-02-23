import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedPaths = [
    '/dashboard',
    '/chats',
];

// Routes that should redirect to dashboard if already authenticated
const authPaths = [
    '/login',
    '/register',
    '/register-company',
    '/forgot-password',
];

export function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies.get('has_session')?.value === '1';

    // Protected routes: redirect to login if no session
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
    if (isProtected && !hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Auth routes: redirect to dashboard if already has session
    const isAuthPath = authPaths.some((path) => pathname === path);
    if (isAuthPath && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/chats/:path*',
        '/login',
        '/register',
        '/register-company',
        '/forgot-password',
    ],
};
