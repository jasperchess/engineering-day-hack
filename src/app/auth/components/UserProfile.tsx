"use client";

import { useSession, signOut } from "../client";
import { fileActivityLogger } from "@/utils/logging";
import { useEffect } from "react";

export default function UserProfile() {
  const { data: session, isPending: isLoading } = useSession();

  // Log session status and user profile view
  useEffect(() => {
    if (session) {
      // Log successful session validation and user profile view
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_session_start",
          "info",
          "UserProfile",
          {
            userId: session.user.id,
            details: {
              email: session.user.email,
              name: session.user.name,
              hasImage: !!session.user.image,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );

      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_profile_view",
          "info",
          "UserProfile",
          {
            userId: session.user.id,
            details: {
              email: session.user.email,
              name: session.user.name,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );
    } else if (!isLoading) {
      // Log session validation failure
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_session_end",
          "warn",
          "UserProfile",
          {
            details: {
              reason: "no_valid_session",
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    const logoutStartTime = Date.now();
    const userId = session?.user.id;
    const userEmail = session?.user.email;

    // Log logout attempt
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("user_logout", "info", "UserProfile", {
        userId: userId,
        details: {
          email: userEmail,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    try {
      const result = await signOut({
        fetchOptions: {
          onSuccess: () => {
            const logoutDuration = Date.now() - logoutStartTime;

            // Log successful logout
            fileActivityLogger.addLog(
              fileActivityLogger.createLogEntry(
                "user_logout",
                "info",
                "UserProfile",
                {
                  userId: userId,
                  details: {
                    email: userEmail,
                    success: true,
                    duration: logoutDuration,
                    timestamp: new Date().toISOString(),
                  },
                },
              ),
            );

            // Log session end
            fileActivityLogger.addLog(
              fileActivityLogger.createLogEntry(
                "user_session_end",
                "info",
                "UserProfile",
                {
                  userId: userId,
                  details: {
                    email: userEmail,
                    reason: "user_logout",
                    duration: logoutDuration,
                    timestamp: new Date().toISOString(),
                  },
                },
              ),
            );

            // Log navigation event
            fileActivityLogger.addLog(
              fileActivityLogger.createLogEntry(
                "navigation",
                "info",
                "UserProfile",
                {
                  userId: userId,
                  details: {
                    from: window.location.pathname,
                    to: "page_reload",
                    reason: "successful_logout",
                    timestamp: new Date().toISOString(),
                  },
                },
              ),
            );

            window.location.reload();
          },
        },
      });

      if (result.error) {
        const logoutDuration = Date.now() - logoutStartTime;

        // Log logout error
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry(
            "user_logout",
            "error",
            "UserProfile",
            {
              userId: userId,
              error: result.error,
              details: {
                email: userEmail,
                error: result.error.message || "Unknown logout error",
                duration: logoutDuration,
                timestamp: new Date().toISOString(),
              },
            },
          ),
        );

        console.error("Sign out error:", result.error);
      }
    } catch (error) {
      const logoutDuration = Date.now() - logoutStartTime;

      // Log logout exception
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_logout",
          "error",
          "UserProfile",
          {
            userId: userId,
            error: error instanceof Error ? error : String(error),
            details: {
              email: userEmail,
              error: error instanceof Error ? error.message : String(error),
              duration: logoutDuration,
              exceptionThrown: true,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );

      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {session.user.name?.charAt(0).toUpperCase() ||
              session.user.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {session.user.name || session.user.email}
          </p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
