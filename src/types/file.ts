export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  uploadDate: Date;
  uploadedBy?: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  total: number;
}

export interface FileUploadResponse {
  success: boolean;
  file?: FileItem;
  error?: string;
  rateLimit?: RateLimitInfo;
}

export interface FileListResponse {
  success: boolean;
  files: FileItem[];
  total: number;
  error?: string;
}

export interface FileUploadProgress {
  filename: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export type FileValidationError = {
  type: "size" | "type" | "general";
  message: string;
  filename: string;
};

export type SupportedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/svg+xml"
  | "text/plain"
  | "text/markdown"
  | "text/csv";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
  "image/jpeg",
  "image/png", 
  "image/gif",
  "image/svg+xml",
  "text/plain",
  "text/markdown",
  "text/csv",
];
