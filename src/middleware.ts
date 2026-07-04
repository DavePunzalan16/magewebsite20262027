import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create a response to modify
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes — require authentication
  const protectedPaths = ["/dashboard", "/profile", "/feed"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin routes — require admin role
  if (pathname.startsWith("/dashboard/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
    // Check role from email (fast check) — DB check happens in the layout
    if (user.email !== "admin@gmail.com") {
      return NextResponse.redirect(new URL("/dashboard/member", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/auth/signin" || pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/feed/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
};
