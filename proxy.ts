import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "./lib/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page)
     * - api/auth (auth routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)",
  ],
};

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get("drive-planner-auth")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const verifiedToken = await verifyAuth(token);
    
    // If running an API route, continue
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    
    // Valid token, let them access the page
    return NextResponse.next();
  } catch (err) {
    // If token is invalid, redirect to login and clear cookie
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("drive-planner-auth");
    return response;
  }
}
