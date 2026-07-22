import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy de autenticación para el portal privado /hub.
 * 
 * Rutas protegidas: cualquier sub-ruta de /hub/* EXCEPTO /hub/broker-onboarding,
 * que sirve como punto de entrada (login + onboarding).
 * 
 * La verificación completa del token (firma Firebase) la realiza el servidor
 * en cada API Route mediante verifyAuthToken() de firebase-admin.ts.
 * Aquí solo se verifica la PRESENCIA de la cookie de sesión como primera línea
 * de defensa para el ruteo en el Edge.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("e360_token")?.value;
  const authHeader = request.headers.get("authorization");
  const isAuthenticated = Boolean(token || authHeader);

  const { pathname } = request.nextUrl;

  // La página de onboarding/login es el único punto de entrada público del hub
  const isEntryPage = pathname === "/hub/broker-onboarding";

  // Proteger todas las rutas /hub/* excepto la página de entrada
  if (pathname.startsWith("/hub") && !isEntryPage && !isAuthenticated) {
    const loginUrl = new URL("/hub/broker-onboarding", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica el proxy a todas las rutas del hub
  matcher: ["/hub/:path*"],
};
