/**
 * Converts a Blob to a Base64 string.
 * Provides a reliable way to embed images directly into the DOM.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader did not return a base64 string."));
      }
    };
    reader.onerror = () => {
      reject(new Error("FileReader failed to read the blob."));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Loads a list of image paths and returns a map of filename (no extension) to Base64 data.
 * This version is designed to be highly resilient:
 * 1. It skips individual failures instead of crashing the whole process.
 * 2. It handles 404s and network errors gracefully.
 * 3. It ensures the Promise always resolves so the app can continue to the game.
 */
export async function loadImagesAsBase64(paths: string[]): Promise<Record<string, string>> {
  const assetMap: Record<string, string> = {};

  // Create a pool of promises to load all images in parallel
  const promises = paths.map(async (path) => {
    try {
      // Fetch the asset from the local path
      const response = await fetch(path);
      
      // If the file doesn't exist (404) or there is a server error, 
      // we log it and move on without throwing.
      if (!response.ok) {
        console.warn(`Asset ignored: ${path} (Status: ${response.status})`);
        return; 
      }

      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      // Extract the filename (e.g., 'dirty_swan') to use as a key
      const filename = path.split('/').pop()?.split('.').shift();
      
      if (filename) {
        assetMap[filename] = base64;
      }
    } catch (error) {
      // This catches network errors (e.g., DNS failure, connection refused)
      console.warn(`Asset skipped due to network error at ${path}:`, error);
    }
  });

  // Wait for all attempts to finish (successful or not)
  await Promise.allSettled(promises);

  return assetMap;
}
