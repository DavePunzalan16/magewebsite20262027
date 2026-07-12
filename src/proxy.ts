import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes — let them handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // All other routes pass through — auth is handled client-side by AuthProvider
  // This middleware only adds security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|music|Officers).*)",
  ],
};
