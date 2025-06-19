"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import UserProfile from "./UserProfile";

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                Engineering Day
              </h1>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  href="/upload"
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Upload
                </Link>
                <Link
                  href="/files"
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Files
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-300 rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isAuthenticated && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
            <Link
              href="/upload"
              className="text-gray-900 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Upload
            </Link>
            <Link
              href="/files"
              className="text-gray-900 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium"
            >
              Files
            </Link>

          </div>
        </div>
      )}
    </nav>
  );
}