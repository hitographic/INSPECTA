export class CameraManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;

  async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      this.video = videoElement;
      
      // Request camera with back camera preference
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' }, // Back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve) => {
        let resolved = false;
        
        const cleanup = () => {
          videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
          videoElement.removeEventListener('error', onError);
        };

        const onLoadedMetadata = async () => {
          if (resolved) return;
          cleanup();
          try {
            await videoElement.play();
            console.log('Video started playing successfully');
            resolved = true;
            resolve(true);
          } catch (error) {
            console.error('Error playing video:', error);
            resolved = true;
            resolve(false);
          }
        };

        const onError = () => {
          if (resolved) return;
          cleanup();
          console.error('Video error occurred');
          resolved = true;
          resolve(false);
        };

        // Set timeout
        setTimeout(() => {
          if (!resolved) {
            cleanup();
            console.error('Video not ready after timeout');
            resolved = true;
            resolve(false);
          }
        }, 5000);

        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        videoElement.addEventListener('error', onError);
      });
    } catch (error) {
      console.error('Error starting camera:', error);
      return false;
    }
  }

  async capturePhoto(): Promise<string | null> {
    console.log('Starting photo capture...');
    
    if (!this.video) {
      console.error('Video element not available');
      return null;
    }

    console.log('Video readyState:', this.video.readyState);
    console.log('Video dimensions:', this.video.videoWidth, 'x', this.video.videoHeight);

    // Wait for video to be ready with multiple attempts
    let attempts = 0;
    const maxAttempts = 10;
    
    while (this.video.readyState < 2 && attempts < maxAttempts) {
      console.log(`Waiting for video to be ready, attempt ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (this.video.readyState < 2) {
      console.error('Video still not ready after waiting');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Could not get canvas context');
        return null;
      }

      // Get video dimensions
      const videoWidth = this.video.videoWidth;
      const videoHeight = this.video.videoHeight;

      console.log('Video actual dimensions:', videoWidth, 'x', videoHeight);

      // Calculate 1:1 square aspect ratio with max size limit
      const MAX_DIMENSION = 1024; // Limit to 1024px for smaller file size
      let sourceWidth, sourceHeight, sourceX, sourceY;
      let finalWidth, finalHeight;

      if (videoWidth === 0 || videoHeight === 0) {
        // Fallback to client dimensions
        const clientWidth = this.video.clientWidth || 640;
        const clientHeight = this.video.clientHeight || 480;

        console.log('Using client dimensions:', clientWidth, 'x', clientHeight);

        const minDimension = Math.min(clientWidth, clientHeight);
        sourceWidth = minDimension;
        sourceHeight = minDimension;
        sourceX = (clientWidth - minDimension) / 2;
        sourceY = (clientHeight - minDimension) / 2;
        finalWidth = Math.min(minDimension, MAX_DIMENSION);
        finalHeight = Math.min(minDimension, MAX_DIMENSION);
      } else {
        // Use actual video dimensions and crop to square
        const minDimension = Math.min(videoWidth, videoHeight);
        sourceWidth = minDimension;
        sourceHeight = minDimension;
        sourceX = (videoWidth - minDimension) / 2;
        sourceY = (videoHeight - minDimension) / 2;
        finalWidth = Math.min(minDimension, MAX_DIMENSION);
        finalHeight = Math.min(minDimension, MAX_DIMENSION);
      }

      // Set canvas to 1:1 aspect ratio
      canvas.width = finalWidth;
      canvas.height = finalHeight;

      // Draw the centered square crop from video
      context.drawImage(
        this.video,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, finalWidth, finalHeight
      );

      // Convert to base64 with good quality (no timestamp yet)
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      if (dataURL === 'data:,' || dataURL.length < 100) {
        console.error('Canvas appears to be empty or invalid');
        return null;
      }
      
      console.log('Photo captured successfully, size:', dataURL.length);
      return dataURL;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  stopCamera(): void {
    console.log('Stopping camera...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      this.stream = null;
    }
    
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  async processUploadedImage(file: File): Promise<string | null> {
    try {
      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              if (!context) {
                resolve(null);
                return;
              }

              // Calculate 1:1 square aspect ratio with max size limit
              const MAX_DIMENSION = 1024;
              const minDimension = Math.min(img.width, img.height);
              const sourceX = (img.width - minDimension) / 2;
              const sourceY = (img.height - minDimension) / 2;

              const finalDimension = Math.min(minDimension, MAX_DIMENSION);
              canvas.width = finalDimension;
              canvas.height = finalDimension;

              // Draw the centered square crop
              context.drawImage(
                img,
                sourceX, sourceY, minDimension, minDimension,
                0, 0, finalDimension, finalDimension
              );

              // No timestamp overlay - will be added on save
              const dataURL = canvas.toDataURL('image/jpeg', 0.8);
              resolve(dataURL);
            } catch (error) {
              console.error('Error processing image:', error);
              resolve(null);
            }
          };

          img.onerror = () => {
            resolve(null);
          };

          img.src = e.target?.result as string;
        };

        reader.onerror = () => {
          resolve(null);
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async switchCamera(): Promise<boolean> {
    if (!this.video) return false;

    try {
      // Stop current stream
      this.stopCamera();

      // Try front camera
      const constraints = {
        video: {
          facingMode: { ideal: 'user' }, // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();

      return true;
    } catch (error) {
      console.error('Error switching camera:', error);
      return false;
    }
  }

  async addTimestampToImage(imageDataUrl: string, customDate?: string, customTime?: string): Promise<string | null> {
    try {
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
              resolve(null);
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            context.drawImage(img, 0, 0);

            const timestampDate = customDate && customTime
              ? new Date(`${customDate}T${customTime}`)
              : new Date();

            const day = timestampDate.getDate().toString().padStart(2, '0');
            const month = (timestampDate.getMonth() + 1).toString().padStart(2, '0');
            const year = timestampDate.getFullYear();
            const hours = timestampDate.getHours().toString().padStart(2, '0');
            const minutes = timestampDate.getMinutes().toString().padStart(2, '0');
            const seconds = timestampDate.getSeconds().toString().padStart(2, '0');

            const timestamp = `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;

            const fontSize = Math.max(24, Math.min(48, canvas.width / 20));
            context.font = `bold ${fontSize}px Arial`;

            const textMetrics = context.measureText(timestamp);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;

            const padding = 16;
            const backgroundWidth = textWidth + (padding * 2);
            const backgroundHeight = textHeight + (padding * 1.2);
            const backgroundX = padding;
            const backgroundY = canvas.height - backgroundHeight - padding;

            context.fillStyle = 'rgba(0, 0, 0, 1)';
            context.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

            context.fillStyle = '#FFFFFF';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(
              timestamp,
              backgroundX + padding,
              backgroundY + (backgroundHeight / 2)
            );

            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } catch (error) {
            console.error('Error adding timestamp:', error);
            resolve(null);
          }
        };

        img.onerror = () => {
          resolve(null);
        };

        img.src = imageDataUrl;
      });
    } catch (error) {
      console.error('Error adding timestamp to image:', error);
      return null;
    }
  }
}

export const capturePhoto = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
};

export const uploadPhoto = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
};