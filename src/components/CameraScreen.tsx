'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore, getTemplateConfig } from '@/store/useStore';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Camera as CameraIcon, Music2, VolumeX, Volume2, Sun } from 'lucide-react';
import gsap from 'gsap';

const MUSIC_TRACKS = [
  { id: 'lofi',    label: '☕ Lo-Fi Chill',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'retro',   label: '🎞️ Retro Funk',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'pop',     label: '🌸 Dreamy Pop',   url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'indie',   label: '🎸 Indie Vibes',  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

export default function CameraScreen() {
  const { setStep, addPhoto, replacePhoto, photos, templateId, scrapbookPhotoCount, cameraFilter, setCameraFilter } = useStore();
  const baseMax = getTemplateConfig(templateId).maxPhotos;
  const maxPhotos = templateId === 'scrapbook-4' ? scrapbookPhotoCount : baseMax;
  const webcamRef = useRef<Webcam>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [ringlightOn, setRinglightOn] = useState(false);

  // Audio refs
  const shutterSound = useRef<HTMLAudioElement | null>(null);
  const beepSound = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Music state
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(MUSIC_TRACKS[0].id);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [showMusicPanel, setShowMusicPanel] = useState(false);

  useEffect(() => {
    shutterSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3');
    beepSound.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-beep-2586.mp3');
    return () => {
      bgMusicRef.current?.pause();
    };
  }, []);

  const playTrack = (trackId: string) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track) return;
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.src = '';
    }
    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = musicVolume;
    bgMusicRef.current = audio;
    audio.play().catch(() => {});
    setMusicPlaying(true);
    setActiveTrack(trackId);
  };

  const toggleMusic = () => {
    if (musicPlaying) {
      bgMusicRef.current?.pause();
      setMusicPlaying(false);
    } else {
      if (bgMusicRef.current?.src) {
        bgMusicRef.current.play().catch(() => {});
        setMusicPlaying(true);
      } else {
        playTrack(activeTrack);
      }
    }
  };

  const handleVolumeChange = (v: number) => {
    setMusicVolume(v);
    if (bgMusicRef.current) bgMusicRef.current.volume = v;
  };

  const triggerFlash = () => {
    if (flashRef.current) {
      gsap.fromTo(
        flashRef.current,
        { opacity: 1 },
        { opacity: 0, duration: 1.5, ease: 'power2.out' }
      );
    }
    if (shutterSound.current) {
      shutterSound.current.currentTime = 0;
      shutterSound.current.play().catch(e => console.log('Audio play blocked:', e));
    }
  };

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch(e) {
      console.log('AudioContext error', e);
    }
    if (beepSound.current) {
      // Fallback
      beepSound.current.currentTime = 0;
      beepSound.current.play().catch(() => {});
    }
  };

  const capturePhoto = (indexToReplace: number | null = null) => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        if (indexToReplace !== null) {
          replacePhoto(indexToReplace, imageSrc);
        } else {
          addPhoto(imageSrc);
          setPhotoCount(prev => prev + 1);
        }
      }
    }
  };

  const startSequence = () => {
    setIsCapturing(true);
    takePhotoSequence(0);
  };

  const takePhotoSequence = (currentCount: number) => {
    if (currentCount >= maxPhotos) {
      setTimeout(() => {
        setIsCapturing(false);
        setReviewMode(true);
      }, 1000);
      return;
    }

    let count = countdownDuration;
    setCountdown(count);
    playBeep();

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep();
      } else {
        clearInterval(interval);
        setCountdown(null);
        triggerFlash();
        capturePhoto();
        setTimeout(() => takePhotoSequence(currentCount + 1), 1000);
      }
    }, 1000);
  };

  const handleRetake = (index: number) => {
    setReviewMode(false);
    setRetakeIndex(index);
    setIsCapturing(true);

    let count = countdownDuration;
    setCountdown(count);
    playBeep();

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep();
      } else {
        clearInterval(interval);
        setCountdown(null);
        triggerFlash();
        capturePhoto(index);
        setTimeout(() => {
          setIsCapturing(false);
          setRetakeIndex(null);
          setReviewMode(true);
        }, 1000);
      }
    }, 1000);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {/* Ringlight Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none z-40 transition-all duration-500 ${
          ringlightOn ? 'border-[30px] md:border-[60px] border-white shadow-[inset_0_0_100px_rgba(255,255,255,0.8)] bg-white/10' : 'border-0 border-transparent'
        }`}
      />

      {/* Flash overlay */}
      <div 
        ref={flashRef}
        className="absolute inset-0 bg-white z-50 pointer-events-none opacity-0"
      />

      {/* ── FULL SCREEN WEBCAM ── */}
      <div className="absolute inset-0">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode, width: 1280, height: 960 }}
          className={`w-full h-full object-cover transition-all duration-300 ${
            cameraFilter === 'bw' ? 'grayscale contrast-125' :
            cameraFilter === 'sepia' ? 'sepia-[0.8] contrast-125 brightness-90' :
            cameraFilter === 'vintage' ? 'contrast-150 saturate-50 sepia-[0.4] brightness-110' :
            'contrast-110'
          }`}
          mirrored={facingMode === 'user'}
        />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-10" />
        
        {/* Vintage Effects */}
        <div className="film-grain z-20" />
        {cameraFilter === 'vintage' && <div className="light-leak z-20" />}
      </div>

      {/* ── TOP HUD BAR ── */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-5">
        {/* Left: Brand + template name */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-orange px-3 py-1 rounded font-black text-foreground text-xs uppercase tracking-widest">
            ● REC
          </div>
          <span className="text-white/60 text-sm font-bold uppercase tracking-widest">
            {maxPhotos} shot{maxPhotos > 1 ? 's' : ''}
          </span>
        </div>

        {/* Center: Film counter dots */}
        <div className="flex gap-2">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                i < photoCount
                  ? 'bg-brand-orange border-brand-orange shadow-[0_0_8px_#f26b21]'
                  : 'bg-transparent border-white/40'
              }`}
            />
          ))}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Virtual Ringlight */}
          <button
            onClick={() => setRinglightOn(prev => !prev)}
            disabled={isCapturing}
            title="Virtual Ringlight"
            className={`p-2 rounded-full transition backdrop-blur-sm border disabled:opacity-40 ${
              ringlightOn 
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' 
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
          >
            <Sun size={20} />
          </button>

          {/* Flip camera */}
          <button
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            disabled={isCapturing}
            className="p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition backdrop-blur-sm border border-white/20 disabled:opacity-40"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>


      {/* ── CAMERA HUD CORNERS ── */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Top-left */}
        <div className="absolute top-20 left-6 w-12 h-12 border-t-2 border-l-2 border-white/50" />
        {/* Top-right */}
        <div className="absolute top-20 right-6 w-12 h-12 border-t-2 border-r-2 border-white/50" />
        {/* Bottom-left */}
        <div className="absolute bottom-48 left-6 w-12 h-12 border-b-2 border-l-2 border-white/50" />
        {/* Bottom-right */}
        <div className="absolute bottom-48 right-6 w-12 h-12 border-b-2 border-r-2 border-white/50" />
        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 border border-white/40 rounded-full" />
        </div>
      </div>

      {/* ── 🎵 MUSIC PLAYER (floating, bottom-left) ── */}
      <div className="absolute bottom-36 left-4 z-30 flex flex-col items-start gap-2">
        <AnimatePresence>
          {showMusicPanel && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl p-4 w-56 shadow-xl"
            >
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">🎵 Pilih Musik</p>
              <div className="space-y-1 mb-3">
                {MUSIC_TRACKS.map(track => (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition ${
                      activeTrack === track.id && musicPlaying
                        ? 'bg-brand-orange text-background'
                        : 'text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {activeTrack === track.id && musicPlaying ? '▶ ' : ''}{track.label}
                  </button>
                ))}
              </div>
              {/* Volume slider */}
              <div className="flex items-center gap-2">
                <VolumeX size={12} className="text-white/40 shrink-0" />
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={musicVolume}
                  onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 h-1"
                  style={{ accentColor: '#f26b21' }}
                />
                <Volume2 size={12} className="text-white/40 shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Music pill button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowMusicPanel(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition shadow-lg backdrop-blur-md border ${
            musicPlaying
              ? 'bg-brand-orange border-brand-orange text-background'
              : 'bg-black/60 border-white/20 text-white/70 hover:bg-white/10'
          }`}
        >
          <Music2 size={14} className={musicPlaying ? 'animate-pulse' : ''} />
          {musicPlaying ? 'Musik ON' : 'Musik'}
        </motion.button>
      </div>

      {/* ── COUNTDOWN OVERLAY ── */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none"
          >
            <div className="relative">
              {/* Ring */}
              <svg width="200" height="200" className="absolute -inset-6 opacity-30">
                <circle cx="100" cy="100" r="90" stroke="#f26b21" strokeWidth="3" fill="none" strokeDasharray="565" strokeDashoffset={565 - (565 * (countdownDuration - countdown) / countdownDuration)} className="transition-all duration-1000" style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }} />
              </svg>
              <span className="text-[9rem] font-black text-white drop-shadow-[0_0_40px_rgba(242,107,33,0.8)]" style={{ WebkitTextStroke: '3px #f26b21' }}>
                {countdown}
              </span>
            </div>
            <span className="text-white/70 text-lg font-bold uppercase tracking-[0.4em] mt-2">
              Get Ready
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM CONTROL PANEL ── */}
      {!isCapturing && !reviewMode && (
        <div className="relative z-20 mt-auto">
          <div className="bg-black/70 backdrop-blur-md border-t border-white/10 px-6 py-5">
            <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
              
              {/* Filters */}
              <div className="flex flex-col gap-1.5">
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Filter</span>
                <div className="flex gap-1">
                  {[
                    { id: 'normal', label: 'Auto' },
                    { id: 'bw', label: 'B&W' },
                    { id: 'sepia', label: 'Sepia' },
                    { id: 'vintage', label: 'Retro' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCameraFilter(f.id)}
                      className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-all ${
                        cameraFilter === f.id
                          ? 'bg-brand-orange text-foreground'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shutter Button — center */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={startSequence}
                className="flex-shrink-0 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.3),0_0_0_8px_rgba(255,255,255,0.1)] transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-brand-orange flex items-center justify-center shadow-inner">
                  <CameraIcon size={26} className="text-white" />
                </div>
              </motion.button>

              {/* Timer */}
              <div className="flex flex-col gap-1.5 items-end">
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Timer</span>
                <div className="flex gap-1">
                  {[3, 5, 10].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setCountdownDuration(sec)}
                      className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-all ${
                        countdownDuration === sec
                          ? 'bg-brand-yellow text-foreground'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW MODE OVERLAY ── */}
      <AnimatePresence>
        {reviewMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <h2 className="text-white font-bebas text-4xl tracking-widest mb-2">Review Photos</h2>
            <p className="text-white/60 font-inter text-xs uppercase tracking-[0.2em] mb-8">Klik foto jika ingin mengulang</p>
            
            <div className={`grid gap-4 max-w-4xl w-full ${photos.length > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group overflow-hidden rounded-lg border-2 border-white/10 hover:border-brand-orange transition-all">
                  <img src={photo} alt={`Shot ${idx+1}`} className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <button 
                      onClick={() => handleRetake(idx)}
                      className="px-6 py-2 bg-brand-orange text-white font-black text-sm uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                      Retake
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold font-oswald tracking-widest">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => {
                  setReviewMode(false);
                  setPhotoCount(0);
                  setStep('START');
                }}
                className="px-8 py-3 rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white font-bold tracking-widest uppercase transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => setStep('EDIT')}
                className="px-10 py-3 rounded-full bg-white text-black font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                Selesai & Edit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

