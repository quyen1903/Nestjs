import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requireFrontendGuard = process.env.NEXT_PUBLIC_REQUIRE_DASHBOARD_AUTH === "true";
  const hasSessionMarker = request.cookies.has("qc_session");

  if (requireFrontendGuard && !hasSessionMarker) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
