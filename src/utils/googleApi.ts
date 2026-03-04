/**
 * Google API Client - replaces Supabase client
 * Communicates with Google Apps Script Web App backend
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

if (!APPS_SCRIPT_URL) {
  console.error('[GOOGLE API] Missing VITE_GOOGLE_APPS_SCRIPT_URL environment variable!');
}

console.log('[GOOGLE API] Initialized with URL:', APPS_SCRIPT_URL ? 'Set' : 'Missing');

/**
 * Make a GET request to the Apps Script backend
 */
export async function gGet(action: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  console.log(`[GOOGLE API] GET ${action}`, params);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Make a POST request to the Apps Script backend
 */
export async function gPost(action: string, body: Record<string, any> = {}): Promise<any> {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  console.log(`[GOOGLE API] POST ${action}`, Object.keys(body));

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script doesn't parse application/json correctly via doPost
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Upload a photo to Google Drive via Apps Script
 * @param base64Data - base64 string (without data:image/... prefix)
 * @param fileName - desired file name
 * @param folder - subfolder name (sanitation, kliping, monitoring)
 * @param mimeType - image mime type
 * @returns Object with fileId, viewUrl, directUrl
 */
export async function uploadPhoto(
  base64Data: string,
  fileName: string,
  folder: string = 'photos',
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; fileId?: string; viewUrl?: string; directUrl?: string; error?: string }> {
  return gPost('uploadPhoto', {
    photo: base64Data,
    fileName,
    folder,
    mimeType,
  });
}

/**
 * Convert a data URL (data:image/jpeg;base64,...) to just the base64 string
 */
export function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  // If already plain base64
  return { mimeType: 'image/jpeg', base64: dataUrl };
}

/**
 * Upload a photo from data URL (data:image/jpeg;base64,...)
 */
export async function uploadPhotoFromDataUrl(
  dataUrl: string,
  fileName: string,
  folder: string = 'photos'
): Promise<{ success: boolean; fileId?: string; viewUrl?: string; directUrl?: string; error?: string }> {
  const { base64, mimeType } = dataUrlToBase64(dataUrl);
  return uploadPhoto(base64, fileName, folder, mimeType);
}

/**
 * Get a direct view URL for a Google Drive file
 */
export function getDriveDirectUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';

  // If it's already a direct URL
  if (fileIdOrUrl.includes('drive.google.com/uc?')) {
    return fileIdOrUrl;
  }

  // Extract file ID from various URL formats
  let fileId = fileIdOrUrl;

  const match = fileIdOrUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    fileId = match[1];
  }

  // If it's already a plain file ID
  if (fileId.length > 20 && !fileId.includes('/') && !fileId.includes(':')) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return fileIdOrUrl;
}

/**
 * Check if a string is a Google Drive URL
 */
export function isDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}
