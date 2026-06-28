import { create } from 'zustand';

export type AppStep = 'START' | 'CAMERA' | 'EDIT' | 'EXPORT';

const TEMPLATES = {
  'strip-2': { id: 'strip-2', name: '2-Photo Strip', maxPhotos: 2 },
  'strip-4': { id: 'strip-4', name: '4-Photo Strip', maxPhotos: 4 },
  'strip-6': { id: 'strip-6', name: '6-Photo Strip', maxPhotos: 6 },
  'grid-4': { id: 'grid-4', name: '2x2 Grid', maxPhotos: 4 },
  'polaroid': { id: 'polaroid', name: 'Polaroid', maxPhotos: 1 },
  'scrapbook-4': { id: 'scrapbook-4', name: 'Scrapbook Theme', maxPhotos: 4 },
};

export const getTemplateConfig = (id: string) => {
  return TEMPLATES[id as keyof typeof TEMPLATES] || TEMPLATES['strip-4'];
}

interface AppState {
  step: AppStep;
  photos: string[];
  templateId: string;
  finalImage: string | null;
  frameTheme: string;
  scrapbookOverlay: string;
  scrapbookPhotoCount: number;
  cameraFilter: string;
  setStep: (step: AppStep) => void;
  addPhoto: (photo: string) => void;
  replacePhoto: (index: number, photo: string) => void;
  setPhotos: (photos: string[]) => void;
  setTemplateId: (id: string) => void;
  setFinalImage: (image: string | null) => void;
  setFrameTheme: (theme: string) => void;
  setScrapbookOverlay: (url: string) => void;
  setScrapbookPhotoCount: (count: number) => void;
  setCameraFilter: (filter: string) => void;
  resetPhotos: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  step: 'START',
  photos: [],
  templateId: 'strip-4', // default template
  finalImage: null,
  frameTheme: '#f4ebd8', // default Cream
  scrapbookOverlay: '/frames/paramore.png',
  scrapbookPhotoCount: 4,
  cameraFilter: 'normal',
  setStep: (step) => set({ step }),
  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
  replacePhoto: (index, photo) => set((state) => {
    const newPhotos = [...state.photos];
    newPhotos[index] = photo;
    return { photos: newPhotos };
  }),
  setPhotos: (photos) => set({ photos }),
  setTemplateId: (id) => set({ templateId: id }),
  setFinalImage: (image) => set({ finalImage: image }),
  setFrameTheme: (theme) => set({ frameTheme: theme }),
  setScrapbookOverlay: (url) => set({ scrapbookOverlay: url }),
  setScrapbookPhotoCount: (count) => set({ scrapbookPhotoCount: count }),
  setCameraFilter: (filter) => set({ cameraFilter: filter }),
  resetPhotos: () => set({ photos: [] }),
  reset: () => set({ step: 'START', photos: [], templateId: 'strip-4', finalImage: null, frameTheme: '#f4ebd8', scrapbookOverlay: '/frames/paramore.png', scrapbookPhotoCount: 4, cameraFilter: 'normal' }),
}));
