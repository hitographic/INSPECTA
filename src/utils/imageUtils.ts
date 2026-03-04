import { getDriveDirectUrl, isDriveUrl } from './googleApi';

/**
 * Fetch an image URL as a blob URL for reliable cross-origin loading.
 * Converts Drive URLs to lh3 format first for CORS support.
 */
const fetchAsObjectUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    // Ensure we use the lh3 direct URL for Drive images
    const url = isDriveUrl(imageUrl) ? getDriveDirectUrl(imageUrl) : imageUrl;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
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

    // For Drive URLs, fetch as blob first to avoid CORS issues
    if (isDriveUrl(imageUrl) || (imageUrl.startsWith('https://') && !imageUrl.startsWith('data:'))) {
      const objectUrl = await fetchAsObjectUrl(imageUrl);
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
        // Fallback: try direct URL
        img.src = getDriveDirectUrl(imageUrl);
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
