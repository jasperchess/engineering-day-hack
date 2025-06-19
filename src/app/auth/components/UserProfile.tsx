"use client";

import { useSession, signOut } from "../client";

export default function UserProfile() {
  const { data: session, isPending: isLoading } = useSession();

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
    try {
      const result = await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.reload();
          },
        },
      });

      if (result.error) {
        console.error("Sign out error:", result.error);
      }
    } catch (error) {
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
