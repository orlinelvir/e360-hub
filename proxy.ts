import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("e360_token")?.value;
  const authHeader = request.headers.get("authorization");
  const isAuthenticated = Boolean(token || authHeader);

  const { pathname } = request.nextUrl;

  // Si la ruta pertenece al portal privado /hub y no hay token, redirigir a login
  const isProtectedHub = pathname.startsWith("/hub");
  const isLoginPage = pathname === "/hub/broker-onboarding";

  if (isProtectedHub && !isAuthenticated && !isLoginPage) {
    const loginUrl = new URL("/hub/broker-onboarding", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*"],
};
