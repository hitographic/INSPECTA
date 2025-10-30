export const cropImageToSquare = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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

    img.src = imageUrl;
  });
};

export const cropImageToSquareForExcel = async (imageUrl: string): Promise<ArrayBuffer> => {
  const croppedDataUrl = await cropImageToSquare(imageUrl);

  const response = await fetch(croppedDataUrl);
  const blob = await response.blob();
  return blob.arrayBuffer();
};
