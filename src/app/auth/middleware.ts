import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/api/auth",
  ];

  // Check if the current path is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // If no session exists, redirect to login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If session exists, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    // On error, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Helper function to check if user is authenticated on the server side
export async function getServerSession(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session;
  } catch (error) {
    console.error("Failed to get server session:", error);
    return null;
  }
}

// Helper function for protecting API routes
export function withAuth(handler: (request: NextRequest, session: any) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      return handler(request, session);
    } catch (error) {
      console.error("Auth protection error:", error);
      return NextResponse.json(

        { error: "Authentication failed" },
        { status: 401 }
      );
    }
  };
}