/**
 * Face API helpers – run only in browser. Models must be in /models.
 */
const MODELS_PATH = '/models';

let modelsLoaded = false;

export async function loadFaceModels(): Promise<void> {
  await loadFaceModelsWithProgress(() => {});
}

/**
 * Load models one-by-one with progress callback (e.g. for setup page log).
 */
export async function loadFaceModelsWithProgress(
  onProgress: (message: string) => void
): Promise<void> {
  if (typeof window === 'undefined') throw new Error('Face API runs only in browser');
  if (modelsLoaded) return;
  onProgress('Importing face-api.js (first time may take 10–30s)...');
  const faceapi = await import('face-api.js');
  onProgress('Loading detection model (SSD)...');
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH);
  onProgress('Loading landmark model...');
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH);
  onProgress('Loading recognition model...');
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH);
  modelsLoaded = true;
  onProgress('All models loaded.');
}

/**
 * Get 128-d face descriptor from an image element. Returns null if no face.
 */
export async function getDescriptorFromImage(img: HTMLImageElement): Promise<number[] | null> {
  const faceapi = await import('face-api.js');
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

/**
 * Get 128-d face descriptor from a video frame (canvas). Returns null if no face.
 */
export async function getDescriptorFromVideo(video: HTMLVideoElement): Promise<number[] | null> {
  const faceapi = await import('face-api.js');
  const detection = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

/**
 * Detect a single face in video (for live preview). Returns detection or null.
 */
export async function detectFaceInVideo(video: HTMLVideoElement) {
  const faceapi = await import('face-api.js');
  return faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();
}
