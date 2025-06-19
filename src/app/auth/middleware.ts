import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { fileActivityLogger } from "@/utils/logging";

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestStartTime = Date.now();

  // Log middleware execution
  fileActivityLogger.logApiRequest("AuthMiddleware", "MIDDLEWARE", pathname, {
    details: {
      pathname,
      userAgent: request.headers.get("user-agent"),
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
      timestamp: new Date().toISOString(),
    },
  });

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/api/auth"];

  // Check if the current path is a public route or starts with a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    const requestDuration = Date.now() - requestStartTime;

    // Log public route access
    fileActivityLogger.logApiResponse(
      "AuthMiddleware",
      "MIDDLEWARE",
      pathname,
      200,
      {
        details: {
          routeType: "public",
          allowed: true,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      },
    );

    return NextResponse.next();
  }

  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const requestDuration = Date.now() - requestStartTime;

    // If no session exists, redirect to login
    if (!session) {
      // Log session validation failure
      fileActivityLogger.logApiResponse(
        "AuthMiddleware",
        "MIDDLEWARE",
        pathname,
        401,
        {
          details: {
            routeType: "protected",
            sessionValid: false,
            redirectTo: "/login",
            callbackUrl: pathname,
            duration: requestDuration,
            timestamp: new Date().toISOString(),
          },
        },
      );

      // Log authentication middleware event
      fileActivityLogger.logActivity(
        "user_permission_check",
        "AuthMiddleware",
        {
          level: "warn",
          details: {
            pathname,
            result: "denied",
            reason: "no_session",
            redirectTo: "/login",
            timestamp: new Date().toISOString(),
          },
        },
      );

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Log successful session validation
    fileActivityLogger.logApiResponse(
      "AuthMiddleware",
      "MIDDLEWARE",
      pathname,
      200,
      {
        userId: session.user?.id,
        details: {
          routeType: "protected",
          sessionValid: true,
          userId: session.user?.id,
          userEmail: session.user?.email,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      },
    );

    // Log session validation success
    fileActivityLogger.logActivity("user_permission_check", "AuthMiddleware", {
      level: "info",
      userId: session.user?.id,
      details: {
        pathname,
        result: "allowed",
        userId: session.user?.id,
        userEmail: session.user?.email,
        timestamp: new Date().toISOString(),
      },
    });

    // If session exists, allow access
    return NextResponse.next();
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime;

    // Log middleware error
    fileActivityLogger.logApiError(
      "AuthMiddleware",
      "MIDDLEWARE",
      pathname,
      error instanceof Error ? error : String(error),
      {
        details: {
          routeType: "protected",
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          redirectTo: "/login",
          callbackUrl: pathname,
          duration: requestDuration,
          timestamp: new Date().toISOString(),
        },
      },
    );

    // Log authentication failure
    fileActivityLogger.logActivity("user_permission_check", "AuthMiddleware", {
      level: "error",
      error: error instanceof Error ? error : String(error),
      details: {
        pathname,
        result: "error",
        reason: "middleware_exception",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    });

    console.error("Auth middleware error:", error);
    // On error, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Helper function to check if user is authenticated on the server side
export async function getServerSession(request: NextRequest) {
  const sessionStartTime = Date.now();

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const sessionDuration = Date.now() - sessionStartTime;

    if (session) {
      // Log successful session retrieval
      fileActivityLogger.logActivity("user_session_start", "ServerSession", {
        level: "info",
        userId: session.user?.id,
        details: {
          userId: session.user?.id,
          userEmail: session.user?.email,
          duration: sessionDuration,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Log session not found
      fileActivityLogger.logActivity("user_session_end", "ServerSession", {
        level: "warn",
        details: {
          reason: "session_not_found",
          duration: sessionDuration,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return session;
  } catch (error) {
    const sessionDuration = Date.now() - sessionStartTime;

    // Log session retrieval error
    fileActivityLogger.logActivity("user_session_end", "ServerSession", {
      level: "error",
      error: error instanceof Error ? error : String(error),
      details: {
        reason: "session_error",
        error: error instanceof Error ? error.message : String(error),
        duration: sessionDuration,
        timestamp: new Date().toISOString(),
      },
    });

    console.error("Failed to get server session:", error);
    return null;
  }
}

// Helper function for protecting API routes
export function withAuth(
  handler: (request: NextRequest, session: any) => Promise<Response>,
) {
  return async (request: NextRequest) => {
    const authStartTime = Date.now();
    const url = new URL(request.url);

    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      const authDuration = Date.now() - authStartTime;

      if (!session) {
        // Log unauthorized API access attempt
        fileActivityLogger.logApiResponse(
          "APIAuth",
          request.method,
          url.pathname,
          401,
          {
            details: {
              error: "Unauthorized",
              reason: "no_session",
              duration: authDuration,
              userAgent: request.headers.get("user-agent"),
              origin: request.headers.get("origin"),
              timestamp: new Date().toISOString(),
            },
          },
        );

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Log successful API authentication
      fileActivityLogger.logActivity("user_permission_check", "APIAuth", {
        level: "info",
        userId: session.user?.id,
        details: {
          method: request.method,
          pathname: url.pathname,
          result: "authorized",
          userId: session.user?.id,
          userEmail: session.user?.email,
          duration: authDuration,
          timestamp: new Date().toISOString(),
        },
      });

      return handler(request, session);
    } catch (error) {
      const authDuration = Date.now() - authStartTime;

      // Log API authentication error
      fileActivityLogger.logApiError(
        "APIAuth",
        request.method,
        url.pathname,
        error instanceof Error ? error : String(error),
        {
          details: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            duration: authDuration,
            userAgent: request.headers.get("user-agent"),
            origin: request.headers.get("origin"),
            timestamp: new Date().toISOString(),
          },
        },
      );

      console.error("Auth protection error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }
  };
}
