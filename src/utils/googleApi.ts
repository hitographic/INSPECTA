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
  if (data && data.error) {
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
  if (data && data.error) {
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
 * Get a direct view URL for a Google Drive file.
 * Uses lh3.googleusercontent.com format for more reliable embedding.
 */
export function getDriveDirectUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';

  // If it's already a direct URL or thumbnail URL, return as-is
  if (fileIdOrUrl.includes('lh3.googleusercontent.com')) {
    return fileIdOrUrl;
  }

  // Extract file ID from various URL formats
  let fileId = fileIdOrUrl;

  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  const matchUc = fileIdOrUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchUc) {
    fileId = matchUc[1];
  } else {
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const matchD = fileIdOrUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) {
      fileId = matchD[1];
    }
  }

  // If it's a plain file ID (long alphanumeric string), build the URL
  if (fileId.length > 20 && !fileId.includes('/') && !fileId.includes(':') && !fileId.includes('.')) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // If it already looks like a full URL but we couldn't extract, return as-is
  if (fileIdOrUrl.includes('drive.google.com')) {
    return fileIdOrUrl;
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

/**
 * Extract Google Drive file ID from various URL formats.
 * Returns null if not a Drive URL or file ID.
 */
export function extractDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Format: https://lh3.googleusercontent.com/d/FILE_ID
  const matchLh3 = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3) return matchLh3[1];
  
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID or thumbnail?id=FILE_ID
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  
  // If it looks like a plain file ID (long alphanumeric)
  if (url.length > 20 && !/[\/\:\.?&]/.test(url)) return url;
  
  return null;
}

/**
 * Fetch a Drive image as base64 data URL via Apps Script proxy.
 * This bypasses CORS restrictions that prevent direct loading of Drive images.
 * Includes in-memory caching to avoid redundant requests.
 */
const _photoBase64Cache = new Map<string, string>();

export async function fetchDriveImageAsBase64(urlOrFileId: string): Promise<string | null> {
  if (!urlOrFileId) return null;
  
  // If already base64, return as-is
  if (urlOrFileId.startsWith('data:image')) return urlOrFileId;
  
  // Check cache
  const cacheKey = urlOrFileId;
  if (_photoBase64Cache.has(cacheKey)) {
    return _photoBase64Cache.get(cacheKey)!;
  }
  
  const fileId = extractDriveFileId(urlOrFileId);
  if (!fileId) return null;

  const cacheResult = (result: string) => {
    if (_photoBase64Cache.size > 100) {
      const firstKey = _photoBase64Cache.keys().next().value;
      if (firstKey) _photoBase64Cache.delete(firstKey);
    }
    _photoBase64Cache.set(cacheKey, result);
    return result;
  };
  
  // Method 1: Try Apps Script proxy (server-side, most reliable)
  try {
    const data = await gGet('getPhotoBase64', { fileId });
    if (data && data.success && data.base64) {
      return cacheResult(data.base64);
    }
  } catch (error) {
    console.warn('[GOOGLE API] Proxy getPhotoBase64 failed, trying fallback:', error);
  }
  
  // Method 2: Fallback - Google Drive thumbnail URL (supports cross-origin in img tags)
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  try {
    const response = await fetch(thumbnailUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const result = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (result) {
        return cacheResult(result);
      }
    }
  } catch (error) {
    console.warn('[GOOGLE API] Thumbnail fallback failed:', error);
  }
  
  // Method 3: Fallback - lh3 direct URL
  const lh3Url = `https://lh3.googleusercontent.com/d/${fileId}`;
  try {
    const response = await fetch(lh3Url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const result = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (result) {
        return cacheResult(result);
      }
    }
  } catch (error) {
    console.warn('[GOOGLE API] lh3 fallback failed:', error);
  }
  
  console.error('[GOOGLE API] All methods failed for file:', fileId);
  return null;
}

/**
 * Normalize a date value to yyyy-MM-dd format.
 * Handles ISO strings (2026-03-03T17:00:00.000Z), Date objects, and plain yyyy-MM-dd strings.
 */
export function normalizeDate(val: any): string {
  if (!val) return '';
  const s = String(val);
  // Already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO string like 2026-03-03T17:00:00.000Z — extract the date part directly
  if (s.includes('T')) {
    const parts = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
  }
  // Try parsing as date
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s;
}

/**
 * Normalize all 'tanggal' fields in an array of records.
 * Also stringify fields that Google Sheets may return as numbers (line, shift, pengamatan_ke, data_number).
 */
export function normalizeDatesInRecords<T extends Record<string, any>>(records: T[]): T[] {
  const STRINGIFY_FIELDS = ['line', 'shift', 'pengamatan_ke', 'data_number', 'regu'];
  return records.map(r => {
    const patched: any = { ...r };
    if (patched.tanggal) {
      patched.tanggal = normalizeDate(patched.tanggal);
    }
    for (const f of STRINGIFY_FIELDS) {
      if (patched[f] !== undefined && patched[f] !== null) {
        patched[f] = String(patched[f]);
      }
    }
    return patched as T;
  });
}
