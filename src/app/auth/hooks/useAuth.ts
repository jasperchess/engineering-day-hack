"use client";

import { useSession, signOut as authSignOut } from "../client";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, isPending: isLoading, error } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isAuthenticated = !!session;

  const signOut = async () => {
    try {
      const result = await authSignOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
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

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return false;
    }
    return true;
  };

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    signOut,
    requireAuth,
  };
}
