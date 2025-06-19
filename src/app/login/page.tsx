import LoginForm from "../auth/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 blur-3xl"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center space-x-2 mb-8">
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
        </div>
        <h1 className="text-center text-3xl font-extrabold text-white mb-8">
          Welcome Back
        </h1>

        <LoginForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:from-blue-300 hover:to-purple-300"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
