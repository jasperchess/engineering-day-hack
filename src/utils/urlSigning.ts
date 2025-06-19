import { createHmac, randomBytes } from 'crypto';

// Configuration
const SECRET_KEY = process.env.URL_SIGNING_SECRET || 'default-secret-key-change-in-production';
const DEFAULT_EXPIRY_HOURS = 24;

export interface SignedUrlOptions {
  fileId: string;
  fileName?: string;
  expiresIn?: number; // hours
  permissions?: 'view' | 'download' | 'both';
  maxDownloads?: number;
}

export interface SignedUrlData {
  fileId: string;
  fileName?: string;
  permissions: 'view' | 'download' | 'both';
  maxDownloads?: number;
  expiresAt: number;
  nonce: string;
}

export interface VerifiedUrlData extends SignedUrlData {
  isValid: boolean;
  isExpired: boolean;
  remainingDownloads?: number;
}

/**
 * Generate a secure pre-signed URL for file access
 */
export function generatePresignedUrl(
  baseUrl: string,
  options: SignedUrlOptions
): string {
  const expiresAt = Date.now() + (options.expiresIn || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000;
  const nonce = randomBytes(16).toString('hex');

  const urlData: SignedUrlData = {
    fileId: options.fileId,
    fileName: options.fileName,
    permissions: options.permissions || 'both',
    maxDownloads: options.maxDownloads,
    expiresAt,
    nonce,
  };

  // Create the payload to sign
  const payload = JSON.stringify(urlData);
  const signature = createSignature(payload);

  // Encode the data
  const encodedData = Buffer.from(payload).toString('base64url');

  // Create the final URL
  const url = new URL(`${baseUrl}/api/shared/${options.fileId}`);
  url.searchParams.set('token', encodedData);
  url.searchParams.set('signature', signature);

  if (options.fileName) {
    url.searchParams.set('filename', options.fileName);
  }

  return url.toString();
}

/**
 * Verify a pre-signed URL and extract the data
 */
export function verifyPresignedUrl(
  token: string,
  signature: string,
  usageCount?: number
): VerifiedUrlData {
  try {
    // Verify the signature first
    const isSignatureValid = verifySignature(token, signature);
    if (!isSignatureValid) {
      return createInvalidResult();
    }

    // Decode and parse the token
    const payload = Buffer.from(token, 'base64url').toString('utf-8');
    const urlData: SignedUrlData = JSON.parse(payload);

    // Check expiration
    const isExpired = Date.now() > urlData.expiresAt;

    // Check download limits
    const remainingDownloads = urlData.maxDownloads
      ? Math.max(0, urlData.maxDownloads - (usageCount || 0))
      : undefined;

    const hasDownloadsRemaining = urlData.maxDownloads
      ? remainingDownloads! > 0
      : true;

    const isValid = isSignatureValid && !isExpired && hasDownloadsRemaining;

    return {
      ...urlData,
      isValid,
      isExpired,
      remainingDownloads,
    };
  } catch (error) {
    console.error('Error verifying pre-signed URL:', error);
    return createInvalidResult();
  }
}

/**
 * Create a signature for the given payload
 */
function createSignature(payload: string): string {
  return createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');
}

/**
 * Verify a signature for the given payload
 */
function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = createSignature(payload);
  return signature === expectedSignature;
}

/**
 * Create an invalid result object
 */
function createInvalidResult(): VerifiedUrlData {
  return {
    fileId: '',
    permissions: 'view',
    expiresAt: 0,
    nonce: '',
    isValid: false,
    isExpired: true,
  };
}

/**
 * Generate a short share code for easier sharing
 */
export function generateShareCode(): string {
  return randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Validate share code format
 */
export function isValidShareCode(code: string): boolean {
  return /^[A-F0-9]{16}$/.test(code);
}

/**
 * Get remaining time in human readable format
 */
export function getRemainingTime(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
  }

  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Create a shareable link with metadata
 */
export interface ShareableLink {
  url: string;
  shareCode: string;
  expiresAt: number;
  permissions: 'view' | 'download' | 'both';
  maxDownloads?: number;
  createdAt: number;
}

export function createShareableLink(
  baseUrl: string,
  options: SignedUrlOptions
): ShareableLink {
  const shareCode = generateShareCode();
  const url = generatePresignedUrl(baseUrl, options);

  return {
    url,
    shareCode,
    expiresAt: Date.now() + (options.expiresIn || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000,
    permissions: options.permissions || 'both',
    maxDownloads: options.maxDownloads,
    createdAt: Date.now(),
  };
}
