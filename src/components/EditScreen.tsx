'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Canvas, FabricImage, IText, Rect, filters } from 'fabric';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, ImageIcon, Sticker, Pen, Palette, RotateCcw, Glasses, Calendar, Layers, Sparkles, SlidersHorizontal, Undo2, Redo2, Trash2, Share2, ChevronDown } from 'lucide-react';
import * as fabric from 'fabric';

export default function EditScreen() {
  const { photos, setStep, templateId, frameTheme, setFrameTheme, scrapbookOverlay, setScrapbookOverlay, cameraFilter, resetPhotos } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [showFrames, setShowFrames] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBrushStyles, setShowBrushStyles] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#f26b21');
  const [brushStyle, setBrushStyle] = useState<'standard' | 'neon' | 'chalk'>('standard');
  const [activeTexture, setActiveTexture] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const textureObjRef = useRef<fabric.FabricImage | null>(null);
  const photoObjectsRef = useRef<FabricImage[]>([]);
  // Undo/Redo history
  const historyStack = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isRestoringRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Courier New');
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const FONTS = [
    { label: '✏️ Typewriter',  value: 'Courier New' },
    { label: '🖋️ Serif',       value: 'Georgia, serif' },
    { label: '🔠 Sans',        value: 'Arial, sans-serif' },
    { label: '🎸 Bebas',       value: 'Impact, fantasy' },
    { label: '🌸 Handwriting', value: 'Comic Sans MS, cursive' },
    { label: '🎞️ Cinematic',   value: 'Palatino Linotype, serif' },
  ];
  
  const emojis = [
    '❤️', '⭐', '📸', '🦋', '📼', '✨', '🔥', '🎉', '🎈', '🎵',
    '🎸', '🎧', '💿', '✏️', '📌', '💋', '🖤', '🛹', '🎫', '☕'
  ];

  const WASHI_TAPES = [
    { id: 'pink',   emoji: '🌸', label: 'Pink Floral',   color: '#ffb7c5', pattern: 'floral' },
    { id: 'mint',   emoji: '🟢', label: 'Mint Dots',     color: '#a8e6cf', pattern: 'dots'   },
    { id: 'kraft',  emoji: '🟫', label: 'Kraft Paper',   color: '#c8a882', pattern: 'plain'  },
    { id: 'yellow', emoji: '⭐', label: 'Star Yellow',   color: '#fff176', pattern: 'stars'  },
    { id: 'blue',   emoji: '💙', label: 'Sky Blue',      color: '#90caf9', pattern: 'plain'  },
    { id: 'lavender', emoji: '💜', label: 'Lavender',   color: '#ce93d8', pattern: 'plain'  },
  ];

  const BRUSH_STYLES = [
    { id: 'standard', label: '✏️ Pensil', width: 8,  shadow: null,                         opacity: 1   },
    { id: 'neon',     label: '💡 Neon',   width: 6,  shadow: { blur: 20, color: '' },       opacity: 0.9 },
    { id: 'chalk',    label: '🖍️ Kapur',  width: 18, shadow: { blur: 3,  color: '#ffffff55' }, opacity: 0.65 },
  ];

  const TEXTURES = [
    { id: 'grain',   label: '🎞️ Film Grain',   css: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3CfeColorMatrix type=\'saturate\' values=\'0\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")', color: '#1a1a1a22' },
    { id: 'warm',    label: '🌅 Warm Tint',    css: null, color: '#f26b2144' },
    { id: 'cool',    label: '🌊 Cool Tint',    css: null, color: '#1e40af33' },
    { id: 'fade',    label: '🌫️ Vintage Fade',  css: null, color: '#ffffff33' },
  ];

  const PROPS = [
    { id: 'sunglasses', label: '🕶️ Kacamata', url: '/props/sunglasses.png' },
    { id: 'mustache',   label: '👨 Kumis',     url: '/props/mustache.png'   },
    { id: 'crown',      label: '👑 Mahkota',   url: '/props/crown.png'      },
    { id: 'cat_ears',   label: '🐱 Kuping',    url: '/props/cat_ears.png'   },
    { id: 'party_hat',  label: '🎉 Topi Pesta', url: '/props/party_hat.png' },
  ];

  const PALETTE = [
    '#f26b21', // orange
    '#ffb500', // yellow
    '#ffffff', // white
    '#000000', // black
    '#ef4444', // red
    '#3b82f6', // blue
    '#22c55e', // green
    '#a855f7', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
  ];

  const frameColors = [
    { name: 'Cream', hex: '#f4ebd8' },
    { name: 'Dark Film', hex: '#1a1a1a' },
    { name: 'Kodak Orange', hex: '#f26b21' },
    { name: 'Kodak Yellow', hex: '#ffb500' },
    { name: 'Pure White', hex: '#ffffff' },
    { name: 'Soft Pink', hex: '#ffc0cb' },
    { name: 'Retro Teal', hex: '#217b7e' },
  ];

  const scrapbookFrames = [
    { name: 'BTS',                  url: '/frames/bts.png'         },
    { name: 'Cigarettes After Sex', url: '/frames/cas.png'         },
    { name: 'Daniel Caesar',        url: '/frames/danielcesar.png' },
    { name: 'Dewa 19',              url: '/frames/dewa19.png'      },
    { name: 'Ed Sheeran',           url: '/frames/edsheeran.png'   },
    { name: 'HIVI!',                url: '/frames/hivi.png'        },
    { name: 'Indie Vibes',          url: '/frames/indie.png'       },
    { name: 'LANY',                 url: '/frames/lany.png'        },
    { name: 'Nirvana',              url: '/frames/nirvana.png'     },
    { name: 'Olivia Rodrigo',       url: '/frames/olivia.png'      },
    { name: 'Paramore',             url: '/frames/paramore.png'    },
    { name: 'Radiohead',            url: '/frames/radiohead.png'   },
    { name: 'Taylor Swift',         url: '/frames/taylor.png'      },
    { name: 'The 1975',             url: '/frames/the1975.png'     },
    { name: 'TWICE',                url: '/frames/twice.png'       },
    { name: 'Wali',                 url: '/frames/wali.png'        },
  ];

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvasElement = canvasRef.current;
    
    const initCanvas = async () => {
      let canvasWidth = 400;
      let canvasHeight = 800;
      const padding = 20;
      const photoHeight = 270;

      // Layout calculations
      if (templateId.startsWith('strip')) {
        canvasWidth = 400;
        canvasHeight = padding + photos.length * (photoHeight + padding);
      } else if (templateId === 'grid-4') {
        canvasWidth = 800;
        canvasHeight = 800;
      } else if (templateId === 'polaroid') {
        canvasWidth = 600;
        canvasHeight = 750;
      } else if (templateId === 'scrapbook-4') {
        canvasWidth = 1280;
        canvasHeight = 1024;
      }

      const canvas = new Canvas(canvasElement, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: frameTheme,
      });
      fabricRef.current = canvas;

      const applyPhotoFilter = (img: FabricImage) => {
        // Camera filter (applied once on load)
        if (cameraFilter === 'bw') {
          img.filters.push(new filters.Grayscale());
        } else if (cameraFilter === 'sepia') {
          img.filters.push(new filters.Sepia());
        } else if (cameraFilter === 'vintage') {
          img.filters.push(new filters.Sepia());
          img.filters.push(new filters.Contrast({ contrast: 0.15 }));
        }
        img.applyFilters();
        // Track this image for later adjustment
        photoObjectsRef.current.push(img);
      };

      // ── SCRAPBOOK: overlay first, then photos on top ──
      if (templateId === 'scrapbook-4') {
        // 1) Add frame overlay as background layer
        try {
          const overlayImg = await FabricImage.fromURL(scrapbookOverlay);
          const scaleX = canvasWidth / overlayImg.width!;
          const scaleY = canvasHeight / overlayImg.height!;
          overlayImg.set({
            scaleX,
            scaleY,
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
          });
          canvas.add(overlayImg);
        } catch (e) {
          console.log('Overlay image not found', e);
        }

        // 2) Add photos ON TOP of the overlay using per-frame precise slot positions
        const numPhotos = photos.length;

        // Slot definitions for frames with hardcoded white boxes (Paramore, The 1975)
        const FRAME_SLOTS: Record<string, { left: number; top: number; width: number; height: number }[]> = {
          '/frames/paramore.png': [
            { left: 160, top: 193, width: 236, height: 500 },
            { left: 402, top: 193, width: 236, height: 500 },
            { left: 644, top: 193, width: 236, height: 500 },
            { left: 886, top: 193, width: 236, height: 500 },
          ],
          '/frames/the1975.png': [
            { left: 133, top: 183, width: 254, height: 495 },
            { left: 393, top: 183, width: 254, height: 495 },
            { left: 653, top: 183, width: 254, height: 495 },
            { left: 913, top: 183, width: 254, height: 495 },
          ],
        };

        // Safe areas for plain frames (like the new LANY frame)
        // The area where photos can be dynamically arranged in a grid
        const FRAME_SAFE_AREAS: Record<string, { left: number; top: number; width: number; height: number }> = {
          '/frames/lany.png': { left: 280, top: 160, width: 730, height: 680 },
          // Radiohead: landscape frame, large empty center area
          // Frame is ~1040x688 original, scaled to 1280x1024 canvas
          // Empty area is the center-left, avoiding left decorations (~320px) and right strip (~250px)
          '/frames/radiohead.png': { left: 320, top: 100, width: 630, height: 720 },
        };

        let slots: { left: number; top: number; width: number; height: number }[] = [];

        if (FRAME_SLOTS[scrapbookOverlay]) {
          // Use hardcoded slot positions if available
          slots = FRAME_SLOTS[scrapbookOverlay];
        } else {
          // Dynamic grid generation for plain frames
          // Fallback to a generic centered safe area if not explicitly defined
          const safeArea = FRAME_SAFE_AREAS[scrapbookOverlay] || { left: 200, top: 200, width: 880, height: 624 };
          
          let cols = 2;
          let rows = 1;
          if (numPhotos >= 3 && numPhotos <= 4) { cols = 2; rows = 2; }
          if (numPhotos > 4) { cols = 3; rows = 2; }

          const gap = 30; // Spacing between photos
          
          // Calculate max available width and height per slot
          const maxSlotW = (safeArea.width - (cols - 1) * gap) / cols;
          const maxSlotH = (safeArea.height - (rows - 1) * gap) / rows;
          
          // Enforce a 3:4 portrait aspect ratio for the photos
          const targetRatio = 3 / 4; 
          let slotW = maxSlotW;
          let slotH = slotW / targetRatio;
          
          if (slotH > maxSlotH) {
            slotH = maxSlotH;
            slotW = slotH * targetRatio;
          }

          // Center the entire grid inside the safe area
          const gridTotalW = cols * slotW + (cols - 1) * gap;
          const gridTotalH = rows * slotH + (rows - 1) * gap;
          const startLeft = safeArea.left + (safeArea.width - gridTotalW) / 2;
          const startTop = safeArea.top + (safeArea.height - gridTotalH) / 2;

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cx = startLeft + c * (slotW + gap) + slotW / 2;
              const cy = startTop + r * (slotH + gap) + slotH / 2;

              // Add a physical white photo border with shadow behind each photo
              const borderPadding = 12; 
              try {
                // @ts-ignore - Shadow properties
                const borderRect = new Rect({
                  left: cx,
                  top: cy,
                  width: slotW + borderPadding * 2,
                  height: slotH + borderPadding * 2,
                  fill: '#ffffff',
                  originX: 'center',
                  originY: 'center',
                  selectable: false,
                  evented: false,
                });
                borderRect.set('shadow', new fabric.Shadow({
                  color: 'rgba(0,0,0,0.15)',
                  blur: 15,
                  offsetX: 2,
                  offsetY: 6
                }));
                canvas.add(borderRect);
              } catch (e) {
                console.log("Failed to add border rect", e);
              }

              slots.push({
                left: startLeft + c * (slotW + gap),
                top: startTop + r * (slotH + gap),
                width: slotW,
                height: slotH
              });
            }
          }
        }

        for (let i = 0; i < numPhotos && i < slots.length; i++) {
          try {
            const img = await FabricImage.fromURL(photos[i]);
            const slot = slots[i];
            const scale = Math.max(slot.width / img.width!, slot.height / img.height!);
            img.set({
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              left: slot.left + slot.width / 2,
              top: slot.top + slot.height / 2,
              selectable: false,
            });
            img.clipPath = new Rect({
              width: slot.width,
              height: slot.height,
              originX: 'center',
              originY: 'center',
              left: slot.left + slot.width / 2,
              top: slot.top + slot.height / 2,
              absolutePositioned: true,
            });
            applyPhotoFilter(img);
            canvas.add(img);
          } catch (e) {
            console.error('Failed to load scrapbook photo', e);
          }
        }
      } else {
        // ── NON-SCRAPBOOK templates ──
        for (let i = 0; i < photos.length; i++) {
          try {
            const img = await FabricImage.fromURL(photos[i]);

            if (templateId.startsWith('strip')) {
              const targetW = 360;
              const targetH = 270;
              const scale = Math.max(targetW / img.width!, targetH / img.height!);
              img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: padding + targetW / 2,
                top: padding + i * (targetH + padding) + targetH / 2,
                selectable: false,
              });
              img.clipPath = new Rect({
                width: targetW,
                height: targetH,
                originX: 'center',
                originY: 'center',
                left: padding + targetW / 2,
                top: padding + i * (targetH + padding) + targetH / 2,
                absolutePositioned: true,
              });
              applyPhotoFilter(img);
              canvas.add(img);
            } else if (templateId === 'grid-4') {
              const size = (800 - padding * 3) / 2;
              const scale = Math.max(size / img.width!, size / img.height!);
              const row = Math.floor(i / 2);
              const col = i % 2;
              img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: padding + col * (size + padding) + size / 2,
                top: padding + row * (size + padding) + size / 2,
                selectable: false,
              });
              img.clipPath = new Rect({
                width: size,
                height: size,
                originX: 'center',
                originY: 'center',
                left: padding + col * (size + padding) + size / 2,
                top: padding + row * (size + padding) + size / 2,
                absolutePositioned: true,
              });
              applyPhotoFilter(img);
              canvas.add(img);
            } else if (templateId === 'polaroid') {
              const targetW = 600 - padding * 2;
              const targetH = 600 - padding * 2;
              const scale = Math.max(targetW / img.width!, targetH / img.height!);
              img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: padding + targetW / 2,
                top: padding + targetH / 2,
                selectable: false,
              });
              img.clipPath = new Rect({
                width: targetW,
                height: targetH,
                originX: 'center',
                originY: 'center',
                left: padding + targetW / 2,
                top: padding + targetH / 2,
                absolutePositioned: true,
              });
              applyPhotoFilter(img);
              canvas.add(img);
            }
          } catch (e) {
            console.error("Failed to load image into fabric", e);
          }
        }
      }

      canvas.renderAll();
    };

    initCanvas();

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [photos, templateId, scrapbookOverlay]);

  // ── HISTORY: save snapshot after each canvas change ──
  const saveSnapshot = () => {
    if (!fabricRef.current || isRestoringRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    // Truncate future redo states
    historyStack.current = historyStack.current.slice(0, historyIndex.current + 1);
    historyStack.current.push(json);
    // Limit stack to 50 states
    if (historyStack.current.length > 50) historyStack.current.shift();
    historyIndex.current = historyStack.current.length - 1;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  };

  const undo = async () => {
    if (!fabricRef.current || historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    isRestoringRef.current = true;
    await fabricRef.current.loadFromJSON(JSON.parse(historyStack.current[historyIndex.current]));
    fabricRef.current.renderAll();
    isRestoringRef.current = false;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(true);
  };

  const redo = async () => {
    if (!fabricRef.current || historyIndex.current >= historyStack.current.length - 1) return;
    historyIndex.current += 1;
    isRestoringRef.current = true;
    await fabricRef.current.loadFromJSON(JSON.parse(historyStack.current[historyIndex.current]));
    fabricRef.current.renderAll();
    isRestoringRef.current = false;
    setCanRedo(historyIndex.current < historyStack.current.length - 1);
    setCanUndo(true);
  };

  // Hook canvas events for snapshot saving
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const handler = () => saveSnapshot();
    canvas.on('object:added', handler);
    canvas.on('object:modified', handler);
    canvas.on('object:removed', handler);
    canvas.on('path:created', handler);
    return () => {
      canvas.off('object:added', handler);
      canvas.off('object:modified', handler);
      canvas.off('object:removed', handler);
      canvas.off('path:created', handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, templateId, scrapbookOverlay]);

  // Keyboard shortcut: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo, Delete = hapus objek
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      // Delete/Backspace removes selected canvas object (not when typing in input)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = frameTheme;
      fabricRef.current.renderAll();
    }
  }, [frameTheme]);

  // Track whether a selectable object is active (for delete button visibility)
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const onSel = () => setHasSelection(!!canvas.getActiveObject());
    const onClear = () => setHasSelection(false);
    canvas.on('selection:created', onSel);
    canvas.on('selection:updated', onSel);
    canvas.on('selection:cleared', onClear);
    return () => {
      canvas.off('selection:created', onSel);
      canvas.off('selection:updated', onSel);
      canvas.off('selection:cleared', onClear);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, templateId, scrapbookOverlay]);

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && obj.selectable) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.renderAll();
      setHasSelection(false);
    }
  };

  const addText = () => {
    if (!fabricRef.current) return;
    const text = new IText('VINTAGE 99', {
      left: 100,
      top: 100,
      fontFamily: selectedFont,
      fill: drawColor,
      fontSize: 36,
      fontWeight: 'bold'
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
  };

  const addSticker = (emoji: string) => {
    if (!fabricRef.current) return;
    const text = new IText(emoji, {
      left: 300,
      top: 300,
      fontSize: 80,
      selectable: true,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    setShowStickers(false);
  };

  // Date Stamp
  const addDateStamp = () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const stamp = new IText(`'${yy} ${mm} ${dd}`, {
      left: canvas.width! - 20,
      top: canvas.height! - 20,
      originX: 'right',
      originY: 'bottom',
      fontFamily: 'Courier New, monospace',
      fontSize: 36,
      fill: '#ff6600',
      opacity: 0.85,
      selectable: true,
      hasControls: true,
      shadow: new fabric.Shadow({ color: '#ff440066', blur: 8, offsetX: 0, offsetY: 0 }),
    });
    canvas.add(stamp);
    canvas.setActiveObject(stamp);
    canvas.renderAll();
  };

  // Apply washi tape as a colored rect strip on canvas
  const addWashiTape = (tape: typeof WASHI_TAPES[0]) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const tapeW = 280;
    const tapeH = 38;
    const rect = new Rect({
      left: canvas.width! / 2,
      top: canvas.height! / 3,
      originX: 'center',
      originY: 'center',
      width: tapeW,
      height: tapeH,
      fill: tape.color,
      opacity: 0.65,
      rx: 3,
      ry: 3,
      selectable: true,
      hasControls: true,
      angle: -5,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    setShowStickers(false);
  };

  // Apply canvas texture/tint overlay
  const applyTexture = (textureId: string | null) => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    // Remove existing texture
    if (textureObjRef.current) {
      canvas.remove(textureObjRef.current);
      textureObjRef.current = null;
    }
    setActiveTexture(textureId);
    if (!textureId) { canvas.renderAll(); return; }

    const tex = TEXTURES.find(t => t.id === textureId);
    if (!tex) return;

    const overlay = new Rect({
      left: 0,
      top: 0,
      width: canvas.width!,
      height: canvas.height!,
      fill: tex.color,
      selectable: false,
      evented: false,
      opacity: 1,
    });
    canvas.add(overlay);
    canvas.bringObjectToFront(overlay);
    textureObjRef.current = overlay as unknown as fabric.FabricImage;
    canvas.renderAll();
  };

  const applyBrushStyle = (style: 'standard' | 'neon' | 'chalk', color: string) => {
    if (!fabricRef.current?.freeDrawingBrush) return;
    const brush = fabricRef.current.freeDrawingBrush;
    brush.color = color;
    if (style === 'neon') {
      brush.width = 6;
      (brush as any).shadow = new fabric.Shadow({ color: color, blur: 20, offsetX: 0, offsetY: 0 });
    } else if (style === 'chalk') {
      brush.width = 18;
      (brush as any).shadow = new fabric.Shadow({ color: '#ffffff55', blur: 3, offsetX: 0, offsetY: 0 });
      (brush as any).opacity = 0.65;
    } else {
      brush.width = 8;
      (brush as any).shadow = null;
    }
  };

  const toggleDrawing = () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.isDrawingMode = !isDrawing;
    setIsDrawing(!isDrawing);
    if (canvas.isDrawingMode) {
      applyBrushStyle(brushStyle, drawColor);
    }
  };

  // Update brush color live when drawColor changes
  const handleColorChange = (color: string) => {
    setDrawColor(color);
    if (fabricRef.current?.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.color = color;
      if (brushStyle === 'neon') {
        (fabricRef.current.freeDrawingBrush as any).shadow = new fabric.Shadow({ color, blur: 20, offsetX: 0, offsetY: 0 });
      }
    }
  };

  const handleBrushStyleChange = (style: 'standard' | 'neon' | 'chalk') => {
    setBrushStyle(style);
    if (isDrawing) applyBrushStyle(style, drawColor);
  };

  // Apply brightness/contrast/saturation to all tracked photo images
  const applyAdjustments = (b: number, c: number, s: number) => {
    const imgs = photoObjectsRef.current;
    if (!fabricRef.current || imgs.length === 0) return;

    imgs.forEach(img => {
      // Remove existing adjustment filters (keep camera filters like bw/sepia)
      img.filters = img.filters.filter(
        f => !(f instanceof filters.Brightness) &&
             !(f instanceof filters.Contrast) &&
             !(f instanceof filters.Saturation)
      );
      if (b !== 0) img.filters.push(new filters.Brightness({ brightness: b }));
      if (c !== 0) img.filters.push(new filters.Contrast({ contrast: c }));
      if (s !== 0) img.filters.push(new filters.Saturation({ saturation: s }));
      img.applyFilters();
    });
    fabricRef.current.renderAll();
  };

  useEffect(() => {
    applyAdjustments(brightness, contrast, saturation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, saturation]);

  const addProp = async (url: string) => {
    if (!fabricRef.current) return;
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const canvas = fabricRef.current;
      // Scale to a reasonable size (max 250px wide)
      const maxW = 250;
      const scale = maxW / img.width!;
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        hasControls: true,
        hasBorders: true,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      setShowProps(false);
    } catch (e) {
      console.error('Failed to load prop', e);
    }
  };

  const handleRetake = () => {
    resetPhotos();
    setStep('CAMERA');
  };

  const proceedToExport = () => {
    if (fabricRef.current) {
      const dataUrl = fabricRef.current.toDataURL({ format: 'png', multiplier: 2 });
      useStore.getState().setFinalImage(dataUrl);
      setStep('EXPORT');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-radial-dark text-foreground p-4 gap-4 overflow-hidden">
      {/* Sidebar Controls - Floating Glass Panel */}
      <div className="w-full md:w-80 glass-panel-dark text-background p-6 rounded-2xl flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-widest text-brand-orange">Darkroom</h2>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wider">Developer Tools</p>
          </div>
          <button 
            onClick={handleRetake}
            className="flex items-center justify-center p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 rounded-full transition"
            title="Retake Photos"
          >
            <RotateCcw size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* 🔆 Photo Adjustment */}
          <button
            onClick={() => setShowAdjust(!showAdjust)}
            className={`w-full flex items-center justify-center gap-3 p-4 border rounded-xl font-bold uppercase tracking-wider transition shadow-sm ${showAdjust ? 'bg-white/15 border-brand-yellow' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
          >
            <SlidersHorizontal size={20} className="text-brand-yellow" /> Adjust Photo
          </button>

          <AnimatePresence>
            {showAdjust && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-black/20 rounded-xl border border-white/5"
              >
                <div className="p-4 space-y-5">
                  {/* Brightness */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/50">☀️ Brightness</label>
                      <span className="text-xs font-mono text-brand-yellow">{Math.round(brightness * 100)}</span>
                    </div>
                    <input
                      type="range" min="-1" max="1" step="0.02"
                      value={brightness}
                      onChange={e => setBrightness(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#ffb500' }}
                    />
                  </div>
                  {/* Contrast */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/50">🌓 Contrast</label>
                      <span className="text-xs font-mono text-brand-yellow">{Math.round(contrast * 100)}</span>
                    </div>
                    <input
                      type="range" min="-1" max="1" step="0.02"
                      value={contrast}
                      onChange={e => setContrast(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#ffb500' }}
                    />
                  </div>
                  {/* Saturation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/50">🎨 Saturation</label>
                      <span className="text-xs font-mono text-brand-yellow">{Math.round(saturation * 100)}</span>
                    </div>
                    <input
                      type="range" min="-1" max="1" step="0.02"
                      value={saturation}
                      onChange={e => setSaturation(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#ffb500' }}
                    />
                  </div>
                  {/* Reset */}
                  <button
                    onClick={() => { setBrightness(0); setContrast(0); setSaturation(0); }}
                    className="w-full py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition border border-white/10"
                  >
                    ↺ Reset Semua
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Stamp */}
          <button
            onClick={addDateStamp}
            className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Calendar size={20} className="text-brand-yellow" /> Date Stamp
          </button>


          {/* Add Text + Font Picker */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button onClick={addText} className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-wider transition shadow-sm text-sm">
                <Type size={16} className="text-brand-yellow" /> Add Text
              </button>
              <button
                onClick={() => setShowFontPicker(!showFontPicker)}
                className={`flex items-center gap-1 px-3 py-3 border rounded-xl font-bold text-xs uppercase tracking-wide transition ${showFontPicker ? 'bg-white/15 border-brand-yellow' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
              >
                <ChevronDown size={14} className={`transition-transform ${showFontPicker ? 'rotate-180' : ''}`} />
                Font
              </button>
            </div>

            <AnimatePresence>
              {showFontPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden bg-black/20 rounded-xl border border-white/5"
                >
                  <div className="p-2 grid grid-cols-2 gap-1">
                    {FONTS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => { setSelectedFont(f.value); setShowFontPicker(false); }}
                        className={`px-2 py-2 rounded-lg text-xs font-bold transition text-left truncate ${selectedFont === f.value ? 'bg-brand-orange/40 border border-brand-orange' : 'hover:bg-white/10 border border-transparent'}`}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🗑️ Delete Selected — appears only when an object is selected */}
          <AnimatePresence>
            {hasSelection && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={deleteSelected}
                className="w-full flex items-center justify-center gap-3 p-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 rounded-xl font-bold uppercase tracking-wider text-sm transition text-red-300 hover:text-red-200"
              >
                <Trash2 size={16} /> Hapus Objek Terpilih
              </motion.button>
            )}
          </AnimatePresence>


          <button 
            onClick={toggleDrawing} 
            className={`w-full flex items-center justify-center gap-3 p-4 border rounded-xl font-bold uppercase tracking-wider transition shadow-sm ${isDrawing ? 'bg-brand-orange text-background border-brand-orange shadow-inner' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
          >
            <Pen size={20} className={isDrawing ? "text-background" : "text-brand-orange"} /> Draw
          </button>

          {/* Brush Styles */}
          <AnimatePresence>
            {isDrawing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 bg-black/20 rounded-xl p-2 border border-white/5">
                  {BRUSH_STYLES.map(bs => (
                    <button
                      key={bs.id}
                      onClick={() => handleBrushStyleChange(bs.id as 'standard' | 'neon' | 'chalk')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        brushStyle === bs.id
                          ? 'bg-brand-orange text-background'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {bs.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Color Palette - shown when drawing or for text */}
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2 font-bold">Color</p>
            <div className="grid grid-cols-5 gap-2">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 ${
                    drawColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <button onClick={() => setShowStickers(!showStickers)} className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-wider transition shadow-sm">
            <Sticker size={20} className="text-brand-yellow" /> Stickers & Tape
          </button>
          
          <AnimatePresence>
            {showStickers && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-black/20 rounded-xl mt-2 border border-white/5"
              >
                <div className="p-3 space-y-3">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Emoji Stiker</p>
                  <div className="grid grid-cols-5 gap-2">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => addSticker(emoji)}
                        className="text-3xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold pt-1">🎏 Washi Tape</p>
                  <div className="grid grid-cols-2 gap-2">
                    {WASHI_TAPES.map(tape => (
                      <button
                        key={tape.id}
                        onClick={() => addWashiTape(tape)}
                        className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10 transition text-left text-sm font-bold"
                      >
                        <span
                          className="inline-block w-8 h-4 rounded-sm opacity-70"
                          style={{ backgroundColor: tape.color }}
                        />
                        {tape.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Props Panel */}
          <button 
            onClick={() => setShowProps(!showProps)} 
            className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-wider transition shadow-sm"
          >
            <Glasses size={20} className="text-brand-orange" /> Props
          </button>

          <AnimatePresence>
            {showProps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-black/20 rounded-xl border border-white/5"
              >
                <p className="text-xs text-white/40 uppercase tracking-widest px-3 pt-3 pb-1 font-bold">
                  Klik prop → seret & atur ukurannya di kanvas
                </p>
                <div className="grid grid-cols-1 gap-1 p-2">
                  {PROPS.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => addProp(prop.url)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prop.url}
                        alt={prop.label}
                        className="w-12 h-12 object-contain rounded-md bg-white/10 p-1"
                      />
                      <span className="text-sm font-bold text-white/80">{prop.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vintage Overlay */}
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`w-full flex items-center justify-center gap-3 p-4 border rounded-xl font-bold uppercase tracking-wider transition shadow-sm ${showOverlay ? 'bg-white/15 border-brand-yellow' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
          >
            <Layers size={20} className="text-brand-orange" /> Vintage Overlay
          </button>

          <AnimatePresence>
            {showOverlay && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-black/20 rounded-xl border border-white/5"
              >
                <div className="p-3 space-y-2">
                  <button
                    onClick={() => applyTexture(null)}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition ${activeTexture === null ? 'bg-white/20 border border-white/30' : 'hover:bg-white/10 border border-transparent'}`}
                  >
                    ✕ Hapus Overlay
                  </button>
                  {TEXTURES.map(tex => (
                    <button
                      key={tex.id}
                      onClick={() => applyTexture(tex.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition ${activeTexture === tex.id ? 'bg-brand-orange/40 border border-brand-orange' : 'hover:bg-white/10 border border-transparent'}`}
                    >
                      <span
                        className="inline-block w-8 h-8 rounded-md border border-white/20"
                        style={{ backgroundColor: tex.color }}
                      />
                      {tex.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {templateId === 'scrapbook-4' ? (
            <>
              <button 
                onClick={() => setShowFrames(!showFrames)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-brand-orange text-background hover:bg-brand-orange/90 rounded-xl font-black uppercase tracking-wider transition shadow-lg hover:-translate-y-1"
              >
                <ImageIcon size={20} className="text-background" /> Change Scrapbook
              </button>
              
              <AnimatePresence>
                {showFrames && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-2 rounded-xl bg-black/20 border border-white/5"
                  >
                    <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto p-2">
                    {scrapbookFrames.map(frame => (
                      <button
                        key={frame.url}
                        onClick={() => setScrapbookOverlay(frame.url)}
                        className={`w-full p-3 text-sm font-bold uppercase border-2 rounded-lg transition shrink-0 ${scrapbookOverlay === frame.url ? 'border-brand-yellow bg-white/10' : 'border-transparent hover:bg-white/5'}`}
                      >
                        {frame.name}
                      </button>
                    ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <button 
                onClick={() => setShowFrames(!showFrames)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-wider transition shadow-sm"
              >
                <Palette size={20} className="text-brand-orange" /> Frame Color
              </button>

              <AnimatePresence>
                {showFrames && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-black/20 rounded-xl mt-2 border border-white/5"
                  >
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {frameColors.map(color => (
                        <button
                          key={color.hex}
                          onClick={() => setFrameTheme(color.hex)}
                          className={`w-full aspect-square rounded-full border-2 transition-transform ${frameTheme === color.hex ? 'border-brand-yellow scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <div className="mt-auto shrink-0 space-y-3">
          {/* Undo / Redo */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition ${
                canUndo
                  ? 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
                  : 'bg-white/5 border border-white/5 text-white/25 cursor-not-allowed'
              }`}
            >
              <Undo2 size={16} /> Undo
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition ${
                canRedo
                  ? 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
                  : 'bg-white/5 border border-white/5 text-white/25 cursor-not-allowed'
              }`}
            >
              Redo <Redo2 size={16} />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={proceedToExport}
            className="w-full py-5 bg-brand-orange text-background rounded-xl font-black text-xl uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            Develop Film
          </motion.button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex items-center justify-center bg-[#bda58d] p-8 overflow-y-auto relative rounded-2xl border border-white/10 shadow-inner">
        {/* Grain overlay for the editing area to make it feel like a table */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dust.png')] opacity-30 pointer-events-none" />
        
        <div className="shadow-2xl rounded-sm overflow-hidden border-8 border-[#f4ebd8] rotate-1 relative z-10 transition-transform hover:rotate-0">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
