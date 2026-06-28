'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, RefreshCcw, Printer, PlaySquare, QrCode, X, Share2, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import gifshot from 'gifshot';
import { QRCodeCanvas } from 'qrcode.react';

export default function ExportScreen() {
  const { setStep, reset, finalImage, photos } = useStore();
  const [isGeneratingGIF, setIsGeneratingGIF] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareToWhatsApp = () => {
    const text = encodeURIComponent('Lihat hasil foto booth saya! 📸✨ Dibuat dengan i-Photobooth Vintage');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareNative = async () => {
    if (navigator.share && finalImage) {
      try {
        // Convert dataURL to blob for native share
        const res = await fetch(finalImage);
        const blob = await res.blob();
        const file = new File([blob], 'photobooth.png', { type: 'image/png' });
        await navigator.share({ title: 'My Photobooth', files: [file] });
      } catch (e) {
        console.log('Share failed', e);
      }
    } else {
      // Fallback: copy current page URL
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Play mechanical print sound on mount and save to history
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-typewriter-printing-paper-1049.mp3');
    audio.play().catch(e => console.log('Audio auto-play blocked', e));

    // Save to local history
    if (finalImage) {
      try {
        const history = JSON.parse(localStorage.getItem('photobooth_history') || '[]');
        // Check if already in history (prevent duplicate on dev hot reload)
        if (history[0] !== finalImage) {
          const newHistory = [finalImage, ...history].slice(0, 6); // Keep last 6
          localStorage.setItem('photobooth_history', JSON.stringify(newHistory));
        }
      } catch (e) {
        console.warn('Local storage full, could not save history', e);
      }
    }
  }, [finalImage]);

  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    if (!finalImage) return;
    const a = document.createElement('a');
    a.href = finalImage;
    
    if (format === 'jpeg') {
      const img = new window.Image();
      img.src = finalImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#f4ebd8';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          a.href = canvas.toDataURL('image/jpeg', 0.9);
          a.download = `kodak-film-${Date.now()}.jpg`;
          a.click();
        }
      };
    } else {
      a.download = `kodak-film-${Date.now()}.png`;
      a.click();
    }
  };

  const handleDownloadPDF = () => {
    if (!finalImage) return;
    const img = new window.Image();
    img.src = finalImage;
    img.onload = () => {
      // Create A4 PDF
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'l' : 'p',
        unit: 'px',
        format: [img.width, img.height]
      });
      pdf.addImage(finalImage, 'PNG', 0, 0, img.width, img.height);
      pdf.save(`kodak-film-${Date.now()}.pdf`);
    };
  };

  const handleRestart = () => {
    reset();
  };

  const handlePrint = () => {
    if (!finalImage) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Photobooth</title></head>
          <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <img src="${finalImage}" style="max-height: 100%; max-width: 100%;" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadGIF = () => {
    if (photos.length === 0) return;
    setIsGeneratingGIF(true);
    setGifProgress(0);
    
    // @ts-ignore
    gifshot.createGIF({
        images: photos,
        gifWidth: 600,
        gifHeight: 450,
        interval: 0.5, // seconds
        numFrames: photos.length,
        frameDuration: 5, // 10 = 1 sec
        sampleInterval: 10,
        progressCallback: (captureProgress: number) => {
            setGifProgress(Math.round(captureProgress * 100));
        }
    }, function(obj: any) {
        setIsGeneratingGIF(false);
        if(!obj.error) {
            const image = obj.image;
            const a = document.createElement('a');
            a.href = image;
            a.download = `kodak-film-${Date.now()}.gif`;
            a.click();
        } else {
            console.error('GIF generation error:', obj.error);
        }
    });
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen bg-background text-foreground p-6 gap-10">
      
      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-4 bg-brand-orange shadow-md z-10" />
      <div className="absolute top-4 left-0 w-full h-2 bg-brand-yellow shadow-md z-10" />

      {/* Preview Section - Polaroid Slide Out Animation */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm relative z-20 mt-10 md:mt-0"
      >
        {/* Fake camera slot from where the photo ejects */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-64 h-4 bg-[#1a1511] rounded-full shadow-inner z-30" />
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-64 h-1 bg-[#2a201b] z-30" />
        
        {finalImage ? (
          <div className="relative animate-print origin-top">
             <div className="absolute -inset-3 bg-[#f4ebd8] rotate-2 shadow-2xl z-0" />
             <div className="absolute -inset-3 bg-[#f4ebd8] -rotate-1 shadow-2xl z-0" />
             <div className="bg-[#f4ebd8] p-4 pb-12 shadow-2xl relative z-10 border border-[#d8c6ac]">
               <img src={finalImage} alt="Final Photobooth" className="w-full relative shadow-inner" />
             </div>
          </div>
        ) : (
          <div className="w-full aspect-[2/3] bg-foreground/10 rounded-lg flex items-center justify-center border-2 border-dashed border-foreground/30">
            <p className="font-bold uppercase tracking-wider text-foreground/50">No Film Found</p>
          </div>
        )}
      </motion.div>

      {/* Controls Section - Styled as a vintage receipt/ticket */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="max-w-md w-full bg-[#f4ebd8] text-[#4a3b32] p-8 shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-[#d8c6ac] relative z-20 space-y-6 overflow-hidden"
      >
        {/* Receipt jagged edge top */}
        <div className="absolute top-0 left-0 w-full h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMCA1LDEwIiBmaWxsPSIjMWExNTExIi8+PC9zdmc+')] rotate-180" />
        {/* Receipt jagged edge bottom */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMCA1LDEwIiBmaWxsPSIjMWExNTExIi8+PC9zdmc+')] " />

        <div className="text-center pb-4 border-b-2 border-dashed border-[#bfa98b] mt-4">
          <h1 className="text-5xl font-bebas tracking-widest text-[#4a3b32] mb-1">
            PHOTO TICKET
          </h1>
          <p className="font-inter font-bold text-xs uppercase tracking-widest text-[#8b7a66]">
            No. {Math.floor(Math.random() * 9000) + 1000} - {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleDownloadImage('png')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#4a3b32] text-[#f4ebd8] hover:bg-[#3d3029] font-oswald text-sm tracking-widest uppercase transition shadow-[0_4px_0_#2a201b] active:translate-y-[4px] active:shadow-none"
          >
            <Download size={16} className="text-[#f26b21]" />
            <span className="pt-0.5">Save PNG</span>
          </button>
          
          <button 
            onClick={() => handleDownloadImage('jpeg')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#f26b21] text-[#f4ebd8] hover:bg-[#d15111] font-oswald text-sm tracking-widest uppercase transition shadow-[0_4px_0_#9c3804] active:translate-y-[4px] active:shadow-none"
          >
            <Download size={16} className="text-[#f4ebd8]" />
            <span className="pt-0.5">Save JPG</span>
          </button>

          <button 
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border-2 border-[#4a3b32] text-[#4a3b32] hover:bg-[#4a3b32] hover:text-[#f4ebd8] font-oswald text-sm tracking-widest uppercase transition"
          >
            <FileText size={16} />
            <span className="pt-0.5">Save PDF</span>
          </button>

          <button 
            onClick={() => setShowQR(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border-2 border-[#4a3b32] text-[#4a3b32] hover:bg-[#4a3b32] hover:text-[#f4ebd8] font-oswald text-sm tracking-widest uppercase transition"
          >
            <QrCode size={16} />
            <span className="pt-0.5">QR Code</span>
          </button>

          <button
            onClick={shareToWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white hover:bg-[#1ebe57] font-oswald text-sm tracking-widest uppercase transition shadow-[0_4px_0_#128C3E] active:translate-y-[4px] active:shadow-none"
          >
            <Share2 size={16} />
            <span className="pt-0.5">Share WhatsApp</span>
          </button>

          <button
            onClick={shareNative}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border-2 border-[#4a3b32] text-[#4a3b32] hover:bg-[#4a3b32] hover:text-[#f4ebd8] font-oswald text-sm tracking-widest uppercase transition"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            <span className="pt-0.5">{copied ? 'Copied!' : 'Share / Copy'}</span>
          </button>

          <button 
            onClick={handlePrint}
            className="col-span-2 w-full flex items-center justify-center gap-2 py-3 bg-transparent border-2 border-dashed border-[#4a3b32] text-[#4a3b32] hover:bg-[#4a3b32]/10 font-oswald text-sm tracking-widest uppercase transition"
          >
            <Printer size={16} />
            <span className="pt-0.5">Print Physical Copy</span>
          </button>
        </div>

        <button 
          onClick={handleDownloadGIF}
          disabled={isGeneratingGIF}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-[#4a3b32] text-[#f4ebd8] hover:bg-[#3d3029] font-oswald text-sm tracking-widest uppercase transition shadow-[0_4px_0_#2a201b] active:translate-y-[4px] active:shadow-none disabled:opacity-50"
        >
          <PlaySquare size={16} className="text-[#ffb500]" />
          <span className="pt-0.5">{isGeneratingGIF ? `Creating GIF... ${gifProgress}%` : 'Create Animated GIF'}</span>
        </button>

        <div className="pt-4 border-t-2 border-dashed border-[#bfa98b] mt-4 mb-4 text-center">
          <p className="text-[10px] font-inter font-bold tracking-widest uppercase text-[#8b7a66] mb-4">
            Thank you for shooting with us!
          </p>
          <button 
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 mx-auto py-2 px-6 bg-transparent border-2 border-[#4a3b32] text-[#4a3b32] hover:bg-[#4a3b32] hover:text-[#f4ebd8] font-oswald text-sm tracking-widest uppercase transition rounded-full"
          >
            <RefreshCcw size={14} />
            <span className="pt-0.5">Take Another Photo</span>
          </button>
        </div>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#f4ebd8] p-8 rounded-lg shadow-2xl max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-[#4a3b32] hover:text-[#f26b21] transition"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-6">
                <h3 className="font-bebas text-3xl text-[#4a3b32] tracking-wider">Scan to Download</h3>
                <p className="font-inter text-xs font-bold text-[#8b7a66] uppercase mt-2">
                  (Note: Requires backend hosting for real image transfer)
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl flex justify-center shadow-inner border border-[#d8c6ac]">
                <QRCodeCanvas 
                  value={typeof window !== 'undefined' ? window.location.href : 'https://photobooth.local'} 
                  size={200}
                  level="M"
                  fgColor="#4a3b32"
                  imageSettings={{
                    src: "/props/sunglasses.png",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
              
              <p className="font-oswald text-sm text-center text-[#4a3b32] mt-6 tracking-wide">
                SCAN WITH YOUR MOBILE CAMERA
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
