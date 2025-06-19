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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 rounded-sm bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-300">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleGithubSignIn}
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-gray-300 hover:bg-white/20 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-2">GitHub</span>
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full inline-flex justify-center py-2 px-4 border border-white/20 rounded-md shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-gray-300 hover:bg-white/20 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="ml-2">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
