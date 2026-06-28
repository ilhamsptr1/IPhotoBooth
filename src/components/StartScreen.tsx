'use client';

import { useState, useRef } from 'react';
import { useStore, getTemplateConfig } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, LayoutGrid, Square, BookImage, ChevronRight, Check, Upload, X, Maximize, Minimize, Images, Download } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  'strip-2':    <Film size={28} strokeWidth={1.5} />,
  'strip-4':    <Film size={28} strokeWidth={1.5} />,
  'strip-6':    <Film size={28} strokeWidth={1.5} />,
  'grid-4':     <LayoutGrid size={28} strokeWidth={1.5} />,
  'polaroid':   <Square size={28} strokeWidth={1.5} />,
  'scrapbook-4':<BookImage size={28} strokeWidth={1.5} />,
};

const SCRAPBOOK_THEMES = [
  { name: 'Coquette',             url: '/frames/coquette.png',        accent: '#ffb6c1' },
  { name: 'Scrapbook',            url: '/frames/scrapbook.png',       accent: '#d2b48c' },
  { name: 'Minimal',              url: '/frames/minimal.png',         accent: '#ffffff' },
  { name: 'Dark Academia',        url: '/frames/darkacademia.png',    accent: '#4a3b32' },
  { name: 'Barcelona',            url: '/frames/Barcelona.png',       accent: '#a50044' },
  { name: 'Bayern Munich',        url: '/frames/Bayern Munich.png',   accent: '#dc052d' },
  { name: 'Brutalism',            url: '/frames/brutalism.png',       accent: '#555555' },
  { name: 'Brutalism 2',          url: '/frames/brutalism2.png',      accent: '#333333' },
  { name: 'BTS',                  url: '/frames/bts.png',             accent: '#6B46C1' },
  { name: 'Cigarettes After Sex', url: '/frames/cas.png',             accent: '#000000' },
  { name: 'Daniel Caesar',        url: '/frames/danielcesar.png',     accent: '#d2b48c' },
  { name: 'Dewa 19',              url: '/frames/dewa19.png',          accent: '#ffd700' },
  { name: 'Ed Sheeran',           url: '/frames/edsheeran.png',       accent: '#45b8ac' },
  { name: 'Ferrari',              url: '/frames/ferrari.png',         accent: '#ff2800' },
  { name: 'GTA V',                url: '/frames/gta v.png',           accent: '#518654' },
  { name: 'HIVI!',                url: '/frames/hivi.png',            accent: '#f9c74f' },
  { name: 'Indie Vibes',          url: '/frames/indie.png',           accent: '#a8785a' },
  { name: 'LANY',                 url: '/frames/lany.png',            accent: '#5b8dee' },
  { name: 'Liverpool',            url: '/frames/Liverpool.png',       accent: '#c8102e' },
  { name: 'McLaren',              url: '/frames/McLaren.png',         accent: '#ff8000' },
  { name: 'Mercedes',             url: '/frames/mercy.png',           accent: '#000000' },
  { name: 'Nirvana',              url: '/frames/nirvana.png',         accent: '#ffd600' },
  { name: 'Oasis',                url: '/frames/oasis.png',           accent: '#000000' },
  { name: 'Olivia Rodrigo',       url: '/frames/olivia.png',          accent: '#9b30ff' },
  { name: 'Paramore',             url: '/frames/paramore.png',        accent: '#f26b21' },
  { name: 'Radiohead',            url: '/frames/radiohead.png',       accent: '#1a1a2e' },
  { name: 'Real Madrid',          url: '/frames/RealMadrid.png',      accent: '#00529f' },
  { name: 'Red Bull',             url: '/frames/RedBull.png',         accent: '#001a30' },
  { name: 'Taylor Swift',         url: '/frames/taylor.png',          accent: '#c9a84c' },
  { name: 'The 1975',             url: '/frames/the1975.png',         accent: '#b0b0b0' },
  { name: 'TWICE',                url: '/frames/twice.png',           accent: '#ff69b4' },
  { name: 'Wali',                 url: '/frames/wali.png',            accent: '#008000' },
];

const SCRAPBOOK_LAYOUTS = [
  { count: 2, label: '2 Photos', desc: 'Duo Strip' },
  { count: 4, label: '4 Photos', desc: 'Classic Grid' },
  { count: 6, label: '6 Photos', desc: 'Full Strip' },
];

type ScrapbookStep = 'theme' | 'photos';

export default function StartScreen() {
  const {
    setStep, templateId, setTemplateId,
    scrapbookOverlay, setScrapbookOverlay,
    scrapbookPhotoCount, setScrapbookPhotoCount,
  } = useStore();

  const templates = ['strip-2', 'strip-4', 'strip-6', 'grid-4', 'polaroid', 'scrapbook-4'];
  const [scrapbookStep, setScrapbookStep] = useState<ScrapbookStep>('theme');
  const [customFrames, setCustomFrames] = useState<{ name: string; url: string }[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const allThemes = [...SCRAPBOOK_THEMES, ...customFrames.map(f => ({ ...f, accent: '#f26b21' }))];
  const isScrapbook = templateId === 'scrapbook-4';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [historyPhotos, setHistoryPhotos] = useState<string[]>([]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    if (id === 'scrapbook-4') setScrapbookStep('theme');
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const name = file.name.replace(/\.[^.]+$/, '');
      setCustomFrames(prev => [...prev, { name, url }]);
      setScrapbookOverlay(url);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeCustomFrame = (url: string) => {
    setCustomFrames(prev => prev.filter(f => f.url !== url));
    if (scrapbookOverlay === url) setScrapbookOverlay(SCRAPBOOK_THEMES[0].url);
  };

  const canShoot = !isScrapbook || scrapbookStep === 'photos';

  const openGallery = () => {
    try {
      const hist = JSON.parse(localStorage.getItem('photobooth_history') || '[]');
      setHistoryPhotos(hist);
    } catch {
      setHistoryPhotos([]);
    }
    setShowGallery(true);
  };

  const clearGallery = () => {
    localStorage.removeItem('photobooth_history');
    setHistoryPhotos([]);
  };

  return (
    <div className="flex flex-col h-screen bg-leather text-white overflow-hidden font-inter">

      {/* ── TOP METAL PLATE ── */}
      <div className="w-full shrink-0 relative bg-metal z-10 border-b-[3px] border-[#2a201b] shadow-[0_6px_15px_rgba(0,0,0,0.6)] flex items-center justify-center" style={{ height: '80px' }}>
        {/* Corner screws */}
        {[
          'top-2.5 left-2.5 rotate-45',
          'top-2.5 right-2.5 -rotate-12',
          'bottom-2.5 left-2.5 rotate-90',
          'bottom-2.5 right-2.5 -rotate-45',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-3.5 h-3.5 rounded-full bg-metal border border-[#8b7a66] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] flex items-center justify-center ${cls}`}>
            <div className="w-full h-[1px] bg-[#8b7a66]" />
          </div>
        ))}

        {/* Hot shoe */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-5 bg-gradient-to-b from-[#e6d8c3] to-[#d8c6ac] border border-[#8b7a66] rounded-b-sm" />

        {/* ISO Dial */}
        <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-metal border border-[#8b7a66] shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.4)] items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#d8c6ac] border-dashed opacity-40" />
          <div className="w-8 h-8 rounded-full bg-[#2a201b] border border-[#e6d8c3] flex flex-col items-center justify-center">
            <span className="font-special text-[8px] text-white leading-none">400</span>
            <span className="font-special text-[7px] text-white/40 leading-none">ISO</span>
          </div>
        </div>

        {/* Shutter dial */}
        <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-metal border border-[#8b7a66] shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_2px_3px_rgba(255,255,255,0.4)] items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#d8c6ac] border-dashed opacity-40" />
          <div className="w-8 h-8 rounded-full bg-metal border border-[#8b7a66] flex flex-col items-center justify-center">
            <span className="font-special text-[8px] text-[#cc0000] font-bold leading-none">125</span>
            <span className="font-special text-[7px] text-white/40 leading-none">60</span>
          </div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-bebas tracking-widest text-center z-10 select-none"
          style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}
        >
          <span className="text-engraved">I Photo</span>
          <span className="text-engraved-red">Booth</span>
          <span className="font-inter text-[9px] font-bold tracking-[0.35em] text-[#8b7a66] ml-3 align-middle uppercase">Vintage</span>
        </motion.h1>

        {/* Gallery Toggle */}
        <button
          onClick={openGallery}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 border border-[#8b7a66]/50 text-[#8b7a66] hover:bg-black/20 hover:text-[#f4ebd8] transition z-20"
          title="Gallery / Riwayat"
        >
          <Images size={16} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 border border-[#8b7a66]/50 text-[#8b7a66] hover:bg-black/20 hover:text-[#f4ebd8] transition z-20"
          title="Toggle Fullscreen (Booth Mode)"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* Strap lugs */}
      <div className="absolute top-[54px] left-0 w-2.5 h-5 bg-metal rounded-r-md border border-[#8b7a66] z-20" />
      <div className="absolute top-[54px] right-0 w-2.5 h-5 bg-metal rounded-l-md border border-[#8b7a66] z-20" />

      {/* ── MAIN BODY ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 py-3 z-10">

        {/* Subtle lens decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55vmin] h-[55vmin] rounded-full pointer-events-none opacity-[0.07] border-[18px] border-[#111] shadow-[inset_0_0_60px_rgba(0,0,0,1)]" />

        <motion.div
          layout
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-xl z-20 flex flex-col items-center gap-4"
        >
          {/* FORMAT SELECTOR */}
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-[#5e4e43]" />
            <span className="font-inter text-[9px] font-bold uppercase tracking-[0.3em] text-[#8b7a66]">Format Selector</span>
            <div className="h-px flex-1 bg-[#5e4e43]" />
          </div>

          {/* Template Cards — 3-column grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {templates.map((id, index) => {
              const isSelected = templateId === id;
              return (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.055 }}
                  onClick={() => handleTemplateSelect(id)}
                  className={`group relative flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-md border transition-all duration-100 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#f26b21] to-[#d15111] border-[#c94c0b] shadow-[0_2px_0_#9c3804,0_3px_8px_rgba(0,0,0,0.5)] translate-y-[3px]'
                      : 'bg-gradient-to-b from-[#f4ebd8] to-[#e6d8c3] border-[#cbb89d] shadow-[0_5px_0_#bfa98b,0_6px_10px_rgba(0,0,0,0.4)] hover:brightness-105 active:translate-y-[5px] active:shadow-[0_0_0_#bfa98b]'
                  }`}
                >
                  <div className={`${isSelected ? 'text-[#f4ebd8]' : 'text-[#8b7a66] group-hover:text-[#4a3b32]'} transition-colors`}>
                    {icons[id]}
                  </div>
                  <span className={`font-oswald text-xs tracking-wide text-center leading-tight ${isSelected ? 'text-[#f4ebd8] font-bold' : 'text-[#4a3b32]'}`}>
                    {getTemplateConfig(id).name}
                  </span>
                  {isSelected && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#f4ebd8] shadow-[0_0_6px_rgba(244,235,216,0.8)]" />}
                </motion.button>
              );
            })}
          </div>

          {/* ── SCRAPBOOK PANEL ── */}
          <AnimatePresence mode="wait">
            {isScrapbook && (
              <motion.div
                key="scrapbook-panel"
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-hidden"
              >
                <div className="w-full p-4 bg-gradient-to-b from-[#2a201b] to-[#1a1511] rounded-sm border-2 border-[#5e4e43] shadow-[inset_0_6px_18px_rgba(0,0,0,0.8)] relative">
                  {/* Corner screws */}
                  {[
                    'top-1.5 left-1.5 rotate-45',
                    'top-1.5 right-1.5 -rotate-12',
                    'bottom-1.5 left-1.5 rotate-90',
                    'bottom-1.5 right-1.5 -rotate-45',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-2.5 h-2.5 rounded-full bg-metal border border-[#8b7a66] flex items-center justify-center opacity-50 ${cls}`}>
                      <div className="w-full h-[1px] bg-[#8b7a66]" />
                    </div>
                  ))}

                  {/* Breadcrumb */}
                  <div className="flex items-center justify-center gap-2 mb-3 text-[9px] font-inter font-bold tracking-widest uppercase">
                    <button onClick={() => setScrapbookStep('theme')} className={`transition-colors ${scrapbookStep === 'theme' ? 'text-[#f26b21]' : 'text-[#5e4e43] hover:text-[#8b7a66]'}`}>
                      1. Bingkai
                    </button>
                    <div className="w-6 h-px bg-[#5e4e43]" />
                    <span className={`transition-colors ${scrapbookStep === 'photos' ? 'text-[#f26b21]' : 'text-[#5e4e43]'}`}>2. Jumlah Foto</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* STEP 1 — Frame Picker */}
                    {scrapbookStep === 'theme' && (
                      <motion.div key="theme" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#5e4e43 transparent' }}>
                          {allThemes.map(theme => {
                            const isSelected = scrapbookOverlay === theme.url;
                            const isCustom = customFrames.some(f => f.url === theme.url);
                            return (
                              <div
                                key={theme.url}
                                onClick={() => setScrapbookOverlay(theme.url)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && setScrapbookOverlay(theme.url)}
                                className={`relative flex flex-col items-center gap-1 p-1.5 rounded transition-all border-2 cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-[#3d3029] border-[#f26b21] shadow-[0_0_10px_rgba(242,107,33,0.3)]'
                                    : 'bg-[#1a1511] border-[#2a201b] hover:border-[#5e4e43]'
                                }`}
                              >
                                <div className={`w-full aspect-[3/4] rounded-sm overflow-hidden border ${isSelected ? 'border-[#f26b21]' : 'border-black/40'}`}>
                                  <img src={theme.url} alt={theme.name} className="w-full h-full object-cover" />
                                </div>
                                <span className={`text-[8px] font-oswald tracking-wide text-center leading-tight w-full truncate ${isSelected ? 'text-[#f4ebd8]' : 'text-[#8b7a66]'}`}>
                                  {theme.name}
                                </span>
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 bg-[#f26b21] rounded-full p-0.5 shadow">
                                    <Check size={8} strokeWidth={3} className="text-white" />
                                  </div>
                                )}
                                {isCustom && (
                                  <button
                                    onClick={e => { e.stopPropagation(); removeCustomFrame(theme.url); }}
                                    className="absolute -top-1 -left-1 bg-red-500 rounded-full p-0.5 hover:bg-red-600 transition z-10"
                                  >
                                    <X size={8} className="text-white" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFrameUpload} />

                        <div className="flex items-center justify-between mt-3 gap-2">
                          <button
                            onClick={() => uploadInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#5e4e43] text-[#8b7a66] hover:border-[#f26b21] hover:text-[#f26b21] font-oswald text-[10px] tracking-widest uppercase rounded-sm transition-all"
                          >
                            <Upload size={11} /> Upload Frame
                          </button>
                          <button
                            onClick={() => setScrapbookStep('photos')}
                            disabled={!scrapbookOverlay}
                            className="flex items-center gap-1.5 px-5 py-1.5 bg-gradient-to-b from-[#f4ebd8] to-[#e6d8c3] text-[#4a3b32] font-oswald text-xs tracking-widest uppercase rounded-sm border border-[#cbb89d] shadow-[0_3px_0_#bfa98b] hover:brightness-105 active:translate-y-[3px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Lanjut <ChevronRight size={13} />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2 — Photo Count */}
                    {scrapbookStep === 'photos' && (
                      <motion.div key="photos" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {SCRAPBOOK_LAYOUTS.map(layout => {
                            const isSel = scrapbookPhotoCount === layout.count;
                            return (
                              <button
                                key={layout.count}
                                onClick={() => setScrapbookPhotoCount(layout.count)}
                                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-md border-2 transition-all ${
                                  isSel
                                    ? 'bg-gradient-to-b from-[#f26b21] to-[#d15111] border-[#c94c0b] shadow-[0_2px_0_#9c3804] translate-y-[2px]'
                                    : 'bg-gradient-to-b from-[#f4ebd8] to-[#e6d8c3] border-[#cbb89d] shadow-[0_4px_0_#bfa98b] hover:brightness-105'
                                }`}
                              >
                                <div className="grid grid-cols-2 gap-1">
                                  {Array.from({ length: layout.count }).map((_, i) => (
                                    <div key={i} className={`w-3 h-3 rounded-sm border ${isSel ? 'bg-[#f4ebd8]/40 border-[#f4ebd8]' : 'bg-black/20 border-[#4a3b32]/30'}`} />
                                  ))}
                                </div>
                                <span className={`font-oswald text-lg tracking-widest leading-none ${isSel ? 'text-[#f4ebd8]' : 'text-[#4a3b32]'}`}>{layout.label}</span>
                                <span className={`text-[8px] tracking-widest uppercase font-inter ${isSel ? 'text-[#f4ebd8]/70' : 'text-[#4a3b32]/50'}`}>{layout.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setScrapbookStep('theme')}
                          className="text-[#8b7a66] hover:text-[#f26b21] text-[10px] font-bold uppercase tracking-widest transition-colors"
                        >
                          ← Kembali ke Frame
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SHOOT FILM BUTTON ── */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            {!canShoot ? (
              <div className="px-8 py-2.5 rounded-full border border-[#5e4e43] text-[#8b7a66] bg-black/20 cursor-not-allowed">
                <span className="font-bebas text-base tracking-widest opacity-60">Pilih Bingkai Dulu</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setStep('CAMERA')}
                className="relative flex items-center justify-center w-20 h-20 rounded-full border-[4px] border-[#d8c6ac]"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #f4ebd8, #c4b39b)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(74,59,50,0.4), inset 0 4px 8px rgba(255,255,255,0.9)',
                }}
              >
                <div
                  className="absolute inset-2 rounded-full border-2 border-[#4a3b32]/30"
                  style={{
                    background: 'radial-gradient(circle at 40% 40%, #ff8c4a, #d15111)',
                    boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.5)',
                  }}
                />
                <div className="absolute w-4 h-4 rounded-full bg-[#2a201b] border-2 border-[#f4ebd8]/50" style={{ boxShadow: 'inset 0 4px 8px rgba(0,0,0,1)' }} />
              </motion.button>
            )}
            <span className="font-bebas text-lg tracking-[0.4em] text-white/50 uppercase">Shoot Film</span>
          </motion.div>

          {/* Film Memo Holder */}
          <div className="w-[160px] h-[40px] bg-[#1a1511] border-2 border-[#5e4e43] rounded-sm shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 border-[3px] border-metal opacity-50 pointer-events-none" />
            <div className="w-[87%] h-[74%] bg-[#dccfba] flex flex-col items-center justify-center transform -rotate-1 border border-black/20">
              <span className="font-bebas text-base text-[#cc0000] tracking-widest leading-none">ISO 400</span>
              <span className="font-inter text-[6px] font-bold text-black uppercase tracking-[0.15em] opacity-60">I PhotoBooth Film</span>
            </div>
          </div>

        </motion.div>
      </div>

      {/* ── BOTTOM METAL PLATE ── */}
      <div className="w-full shrink-0 bg-metal z-10 border-t-[3px] border-[#2a201b] shadow-[0_-4px_10px_rgba(0,0,0,0.5)] flex justify-between items-center px-4" style={{ height: '46px' }}>
        <div className="w-3.5 h-3.5 rounded-full bg-metal border border-[#8b7a66] flex items-center justify-center rotate-90">
          <div className="w-full h-[1px] bg-[#8b7a66]" />
        </div>
        <div className="w-7 h-7 rounded-full bg-[#c4b39b] border-2 border-[#8b7a66] shadow-[inset_0_3px_5px_rgba(0,0,0,0.6)] flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#111] border border-black/50" />
        </div>
        <div className="w-3.5 h-3.5 rounded-full bg-metal border border-[#8b7a66] flex items-center justify-center -rotate-45">
          <div className="w-full h-[1px] bg-[#8b7a66]" />
        </div>
      </div>

      {/* ── GALLERY MODAL ── */}
      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-4xl flex justify-between items-center mb-6">
              <h2 className="text-white font-bebas text-4xl tracking-widest">Riwayat Foto</h2>
              <button onClick={() => setShowGallery(false)} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            {historyPhotos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <Images size={48} className="mb-4" />
                <p className="font-oswald tracking-widest text-lg">Belum ada foto yang disimpan</p>
              </div>
            ) : (
              <div className="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {historyPhotos.map((photoUrl, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/20">
                      <img src={photoUrl} alt={`History ${idx}`} className="w-full h-auto object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <a
                          href={photoUrl}
                          download={`photobooth-history-${Date.now()}.png`}
                          className="px-4 py-2 bg-brand-orange text-white font-black text-xs uppercase tracking-widest rounded-sm hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <button onClick={clearGallery} className="text-red-400 text-xs font-bold tracking-widest uppercase hover:text-red-300 transition underline underline-offset-4">
                    Hapus Semua Riwayat
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}