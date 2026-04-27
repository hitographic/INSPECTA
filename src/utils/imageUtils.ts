import { getDriveDirectUrl, isDriveUrl, fetchDriveImageAsBase64 } from './googleApi';

/**
 * Fetch a Drive image as base64 data URL via Apps Script proxy.
 * For non-Drive URLs, fetch as blob and create object URL.
 */
const fetchAsBase64OrObjectUrl = async (imageUrl: string): Promise<string | null> => {
  // Use proxy for Drive URLs
  if (isDriveUrl(imageUrl)) {
    return fetchDriveImageAsBase64(imageUrl);
  }
  // For other URLs, try direct fetch as object URL
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};

/**
 * Compress a data URL image by reducing quality and resizing if needed
 * Used to reduce upload size for Drive
 */
export const compressImageDataUrl = (dataUrl: string, maxWidth = 1600, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Compress and return
      const compressed = canvas.toDataURL('image/jpeg', quality);
      console.log(`[COMPRESS] Original: ${dataUrl.length} bytes -> Compressed: ${compressed.length} bytes`);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
};

export const cropImageToSquare = (imageUrl: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;

      const xOffset = (img.width - size) / 2;
      const yOffset = (img.height - size) / 2;

      ctx.drawImage(
        img,
        xOffset,
        yOffset,
        size,
        size,
        0,
        0,
        size,
        size
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // For Drive URLs, fetch via proxy to get base64
    if (isDriveUrl(imageUrl)) {
      const base64 = await fetchAsBase64OrObjectUrl(imageUrl);
      if (base64) {
        img.src = base64;
      } else {
        // Fallback: try lh3 direct URL (may fail CORS)
        img.src = getDriveDirectUrl(imageUrl);
      }
    } else if (imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      const objectUrl = await fetchAsBase64OrObjectUrl(imageUrl);
      if (objectUrl) {
        img.src = objectUrl;
        // Clean up object URL after load
        const origOnload = img.onload;
        img.onload = function(e) {
          URL.revokeObjectURL(objectUrl);
          if (origOnload) (origOnload as any).call(this, e);
        };
        const origOnerror = img.onerror;
        img.onerror = function(e) {
          URL.revokeObjectURL(objectUrl);
          if (origOnerror) (origOnerror as any).call(this, e);
        };
      } else {
        img.src = imageUrl;
      }
    } else {
      img.src = imageUrl;
    }
  });
};

export const cropImageToSquareForExcel = async (imageUrl: string): Promise<ArrayBuffer> => {
  const croppedDataUrl = await cropImageToSquare(imageUrl);

  const response = await fetch(croppedDataUrl);
  const blob = await response.blob();
  return blob.arrayBuffer();
};
