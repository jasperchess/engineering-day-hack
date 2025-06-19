"use client";

import { useState, useEffect } from "react";
import { signUp, signIn } from "../client";
import { fileActivityLogger } from "@/utils/logging";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Log component mount and signup page access
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry(
        "component_mount",
        "info",
        "SignUpForm",
        {
          details: { timestamp: new Date().toISOString() },
        },
      ),
    );
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("page_view", "info", "SignUpForm", {
        details: {
          page: "/signup",
          timestamp: new Date().toISOString(),
        },
      }),
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const signupStartTime = Date.now();

    // Log signup attempt start
    fileActivityLogger.addLog(
      fileActivityLogger.createLogEntry("user_signup", "info", "SignUpForm", {
        details: {
          email: email,
          name: name,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match";
      setError(errorMessage);

      // Log form validation error
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "form_validation_error",
          "warn",
          "SignUpForm",
          {
            details: {
              email: email,
              error: errorMessage,
              validationType: "password_match",
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );

      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      const errorMessage = "Password must be at least 8 characters long";
      setError(errorMessage);

      // Log form validation error
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "form_validation_error",
          "warn",
          "SignUpForm",
          {
            details: {
              email: email,
              error: errorMessage,
              validationType: "password_length",
              timestamp: new Date().toISOString(),
            },
          },
        ),
      );

      setIsLoading(false);
      return;
    }

    try {
      // First, create the account
      const signUpResult = await signUp.email({
        email,
        password,
        name,
      });

      if (signUpResult.error) {
        const signupDuration = Date.now() - signupStartTime;
        const errorMessage =
          signUpResult.error.message || "Failed to create account";
        setError(errorMessage);

        // Log failed signup
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry(
            "user_signup_failed",
            "error",
            "SignUpForm",
            {
              details: {
                email: email,
                name: name,
                error: errorMessage,
                duration: signupDuration,
                timestamp: new Date().toISOString(),
              },
            },
          ),
        );

        return;
      }

      const signupDuration = Date.now() - signupStartTime;

      // Log successful signup
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("user_signup", "info", "SignUpForm", {
          details: {
            email: email,
            name: name,
            success: true,
            duration: signupDuration,
            timestamp: new Date().toISOString(),
          },
        }),
      );

      // If signup successful, automatically sign in
      const loginStartTime = Date.now();

      // Log automatic login attempt after signup
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("user_login", "info", "SignUpForm", {
          details: {
            email: email,
            loginMethod: "email",
            autoLoginAfterSignup: true,
            timestamp: new Date().toISOString(),
          },
        }),
      );

      const signInResult = await signIn.email({
        email,
        password,
      });

      if (signInResult.error) {
        const loginDuration = Date.now() - loginStartTime;
        const errorMessage =
          "Account created but failed to sign in. Please try signing in manually.";
        setError(errorMessage);

        // Log failed auto-login after signup
        fileActivityLogger.addLog(
          fileActivityLogger.createLogEntry(
            "user_login_failed",
            "error",
            "SignUpForm",
            {
              details: {
                email: email,
                loginMethod: "email",
                autoLoginAfterSignup: true,
                error: errorMessage,
                duration: loginDuration,
                timestamp: new Date().toISOString(),
              },
            },
          ),
        );

        return;
      }

      const loginDuration = Date.now() - loginStartTime;

      // Log successful auto-login after signup
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("user_login", "info", "SignUpForm", {
          details: {
            email: email,
            loginMethod: "email",
            autoLoginAfterSignup: true,
            success: true,
            duration: loginDuration,
            timestamp: new Date().toISOString(),
          },
        }),
      );

      // Log navigation event
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry("navigation", "info", "SignUpForm", {
          details: {
            from: "/signup",
            to: "/files",
            reason: "successful_signup_and_login",
            timestamp: new Date().toISOString(),
          },
        }),
      );

      // Redirect to files page after successful login
      window.location.href = "/files";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const signupDuration = Date.now() - signupStartTime;
      const errorMessage = err.message || "Failed to create account";
      setError(errorMessage);

      // Log signup exception
      fileActivityLogger.addLog(
        fileActivityLogger.createLogEntry(
          "user_signup_failed",
          "error",
          "SignUpForm",
          {
            error: err,
            details: {
              email: email,
              name: name,
              error: errorMessage,
              duration: signupDuration,
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

  return (
    <div className="max-w-md mx-auto p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-2xl border border-white/20">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">
        Create Account
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-300 rounded backdrop-blur-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 backdrop-blur-sm"
            disabled={isLoading}
          />
        </div>

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
            minLength={8}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 backdrop-blur-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
