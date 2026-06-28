import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if config is provided
let app;
let storage: ReturnType<typeof getStorage> | null = null;

if (firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  storage = getStorage(app);
}

export const uploadPhoto = async (dataUrl: string): Promise<string> => {
  if (!storage) {
    console.warn('Firebase is not configured. Returning mock URL.');
    return new Promise((resolve) => setTimeout(() => resolve('https://mock-url.com/photostrip.png'), 1500));
  }

  try {
    const filename = `photobooth-${uuidv4()}.png`;
    const storageRef = ref(storage, `photobooth/${filename}`);
    
    // Upload base64 string
    await uploadString(storageRef, dataUrl, 'data_url');
    
    // Get download URL
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};
