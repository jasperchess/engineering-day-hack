"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "../client";
import { fileActivityLogger } from "@/utils/logging";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState("/files");

  useEffect(() => {
    // Log component mount and session start attempt
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry(
        "component_mount",
        "info",
        "LoginForm",
        {
          details: { timestamp: new Date().toISOString() },
        },
      ),
    );
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry(
        "user_session_start",
        "info",
        "LoginForm",
        {
          details: { loginPage: true, timestamp: new Date().toISOString() },
        },
      ),
    );
  }, []);

  useEffect(() => {
    // Check for callbackUrl parameter, default to /files
    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl) {
      setRedirectUrl(callbackUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const loginStartTime = Date.now();

    // Log login attempt start
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
        details: {
          email: email,
          loginMethod: "email",
          timestamp: new Date().toISOString(),
          redirectUrl: redirectUrl,
        },
      }),
    );

    try {
      const result = await signIn.email({
        email,
        password,
      });

      const loginDuration = Date.now() - loginStartTime;

      if (result.error) {
        const errorMessage =
          result.error.message || "Invalid email or password";
        setError(errorMessage);

        // Log failed login attempt
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry(
            "user_login_failed",
            "error",
            "LoginForm",
            {
              details: {
                email: email,
                error: errorMessage,
                loginMethod: "email",
                duration: loginDuration,
                timestamp: new Date().toISOString(),
              },
            },
          ),
        );
      } else {
        // Log successful login
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
            details: {
              email: email,
              loginMethod: "email",
              duration: loginDuration,
              success: true,
              redirectUrl: redirectUrl,
              timestamp: new Date().toISOString(),
            },
          }),
        );

        // Log navigation event
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry("navigation", "info", "LoginForm", {
            details: {
              from: "/login",
              to: redirectUrl,
              reason: "successful_login",
              timestamp: new Date().toISOString(),
            },
          }),
        );

        // Redirect to files page or callback URL
        window.location.href = redirectUrl;
      }
    } catch (error) {
      const loginDuration = Date.now() - loginStartTime;
      const errorMessage = "Invalid email or password";
      setError(errorMessage);

      // Log login exception
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_login_failed",
          "error",
          "LoginForm",
          {
            error: error instanceof Error ? error : errorMessage,
            details: {
              email: email,
              error: errorMessage,
              loginMethod: "email",
              duration: loginDuration,
              exceptionThrown: true,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    const socialLoginStartTime = Date.now();

    // Log social login attempt
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
        details: {
          loginMethod: "github",
          provider: "github",
          callbackURL: redirectUrl,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    try {
      await signIn.social({
        provider: "github",
        callbackURL: redirectUrl,
      });

      const loginDuration = Date.now() - socialLoginStartTime;

      // Log successful social login initiation
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
          details: {
            loginMethod: "github",
            provider: "github",
            duration: loginDuration,
            success: true,
            callbackURL: redirectUrl,
            timestamp: new Date().toISOString(),
          },
        }),
      );
    } catch (error) {
      const loginDuration = Date.now() - socialLoginStartTime;
      const errorMessage = "GitHub sign in failed";
      setError(errorMessage);

      // Log failed social login
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_login_failed",
          "error",
          "LoginForm",
          {
            error: error instanceof Error ? error : errorMessage,
            details: {
              loginMethod: "github",
              provider: "github",
              error: errorMessage,
              duration: loginDuration,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const socialLoginStartTime = Date.now();

    // Log social login attempt
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
        details: {
          loginMethod: "google",
          provider: "google",
          callbackURL: redirectUrl,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    try {
      await signIn.social({
        provider: "google",
        callbackURL: redirectUrl,
      });

      const loginDuration = Date.now() - socialLoginStartTime;

      // Log successful social login initiation
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("user_login", "info", "LoginForm", {
          details: {
            loginMethod: "google",
            provider: "google",
            duration: loginDuration,
            success: true,
            callbackURL: redirectUrl,
            timestamp: new Date().toISOString(),
          },
        }),
      );
    } catch (error) {
      const loginDuration = Date.now() - socialLoginStartTime;
      const errorMessage = "Google sign in failed";
      setError(errorMessage);

      // Log failed social login
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_login_failed",
          "error",
          "LoginForm",
          {
            error: error instanceof Error ? error : errorMessage,
            details: {
              loginMethod: "google",
              provider: "google",
              error: errorMessage,
              duration: loginDuration,
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-2xl border border-white/20">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Sign In
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-300 rounded backdrop-blur-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 backdrop-blur-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 backdrop-blur-sm"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
