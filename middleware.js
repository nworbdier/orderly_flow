import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request) {
  const sessionCookie = getSessionCookie(request);
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up");
  const isCreateOrgPage = request.nextUrl.pathname.startsWith(
    "/create-organization"
  );

  // If user is not authenticated and trying to access protected routes
  if (!sessionCookie && !isAuthPage && !isCreateOrgPage) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
