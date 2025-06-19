import { NextRequest } from "next/server";
import { authMiddleware } from "./src/app/auth/middleware";
import { validateUploadSize } from "./src/utils/uploadMiddleware";

export async function middleware(request: NextRequest) {
  // First check upload size limits for file upload endpoints
  const uploadSizeCheck = await validateUploadSize(request);
  if (uploadSizeCheck) {
    return uploadSizeCheck; // Early termination for oversized uploads
  }

  // Then proceed with auth middleware
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
