'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { AppStep } from '@/store/useStore';
import StartScreen from '@/components/StartScreen';
import CameraScreen from '@/components/CameraScreen';
import EditScreen from '@/components/EditScreen';
import ExportScreen from '@/components/ExportScreen';

const BACK_MAP: Partial<Record<AppStep, AppStep>> = {
  CAMERA: 'START',
  EDIT: 'CAMERA',
  EXPORT: 'EDIT',
};

import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.5
};

export default function Home() {
  const step = useStore((s) => s.step);
  const setStep = useStore((s) => s.setStep);

  useEffect(() => {
    // Push a dummy state so the user can't navigate away
    window.history.pushState({ step }, '', window.location.pathname);

    const handlePopState = () => {
      // Immediately push again to block leaving the site
      window.history.pushState({ step }, '', window.location.pathname);

      const prevStep = BACK_MAP[step];
      if (prevStep) {
        setStep(prevStep);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, setStep]);

  return (
    <main className="w-full min-h-screen bg-black selection:bg-brand-orange selection:text-white text-foreground font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full h-full min-h-screen"
        >
          {step === 'START' && <StartScreen />}
          {step === 'CAMERA' && <CameraScreen />}
          {step === 'EDIT' && <EditScreen />}
          {step === 'EXPORT' && <ExportScreen />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
