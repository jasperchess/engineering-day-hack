// Authentication configuration
export { auth } from "./auth";
export type { Session, User } from "./auth";

// Client-side authentication utilities
export { authClient, signIn, signUp, signOut, useSession, getSession } from "./client";

// Database and schema
export { db } from "./db";
export * from "./schema";

// Middleware and server utilities
export { authMiddleware, getServerSession, withAuth } from "./middleware";

// Components
export { default as LoginForm } from "./components/LoginForm";
export { default as SignUpForm } from "./components/SignUpForm";
export { default as UserProfile } from "./components/UserProfile";
export { default as Navigation } from "./components/Navigation";

// Hooks
export { useAuth } from "./hooks/useAuth";
