"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/app/auth/client";
import SearchBar from "./SearchBar";

interface HeaderProps {
  currentPage?: string;
  showUploadButton?: boolean;
  showSearchBar?: boolean;
}

export default function Header({ currentPage = "Files", showUploadButton = true, showSearchBar = true }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="relative z-10 backdrop-blur-sm bg-white/10 border-b border-white/20">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/files" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-white text-xl font-bold">File Vault</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent text-sm font-semibold">
                AI
              </span>
            </Link>
            <nav className="flex items-center space-x-4 text-sm">
              {currentPage === "Upload" ? (
                <>
                  <Link
                    href="/files"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Files
                  </Link>
                  <span className="text-gray-500">/</span>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                    Upload
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-medium">
                  {currentPage}
                </span>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            {showSearchBar && (
              <SearchBar 
                placeholder="Search by filename..." 
                className="max-w-md"
              />
            )}
            
            {/* User info */}
            {session?.user && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-white font-medium">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-xs text-gray-300">
                    {session.user.email}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Upload button */}
            {showUploadButton && currentPage !== "Upload" && (
              <Link
                href="/upload"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium inline-flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Upload Files
              </Link>
            )}

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 font-medium inline-flex items-center"
              title="Sign out"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
