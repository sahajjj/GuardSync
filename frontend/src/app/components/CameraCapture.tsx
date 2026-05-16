'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, X, FlipHorizontal } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClear: () => void;
  capturedPreview: string | null;
  label?: string;
  shape?: 'circle' | 'rounded' | 'square';
}

export default function CameraCapture({ onCapture, onClear, capturedPreview, label = 'CAPTURE PHOTO', shape = 'square' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState('');

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setStream(mediaStream);
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('[ERR] CAMERA PERMISSION DENIED');
      } else if (err.name === 'NotFoundError') {
        setCameraError('[ERR] NO HARDWARE DETECTED');
      } else {
        setCameraError('[ERR] SENSOR ACCESS FAILURE');
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // When facingMode changes and camera is open, restart
  useEffect(() => {
    if (cameraOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      startCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Force square crop
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;

    // Mirror the image if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        stopCamera();
      }
    }, 'image/jpeg', 0.85);
  };

  const handleRetake = () => {
    onClear();
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Enforce square by default in Swiss UI
  const shapeClass = shape === 'circle' ? 'rounded-full aspect-square' : shape === 'rounded' ? 'rounded-sm aspect-[4/3]' : 'rounded-none aspect-square';

  return (
    <div className="space-y-3 flex flex-col items-center w-full">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* State: Preview of captured photo */}
      {capturedPreview && !cameraOpen && (
        <div className="relative group w-full max-w-[260px]">
          <img
            src={capturedPreview}
            alt="Captured"
            className={`w-full border border-black/20 dark:border-white/20 object-cover ${shapeClass}`}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleRetake}
              className="bg-white dark:bg-black text-black dark:text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            >
              <RotateCcw size={14} /> RE-CAPTURE
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest rounded-sm border border-black/20 dark:border-white/20">
            [SYS_OK] ACQUIRED
          </div>
        </div>
      )}

      {/* State: Camera is open — show live feed */}
      {cameraOpen && !capturedPreview && (
        <div className="relative w-full max-w-[260px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full bg-black border border-black/20 dark:border-white/20 object-cover ${shapeClass}`}
            style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : {}}
          />
          
          {/* Viewfinder crosshairs */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full"></div>
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10"></div>
             <div className="absolute left-1/2 top-0 w-[1px] h-full bg-white/10"></div>
          </div>

          <div className="absolute top-2 left-2 bg-red-600 dark:bg-red-500 text-white px-2 py-0.5 text-[8px] font-mono font-bold animate-pulse rounded-sm uppercase tracking-widest">
            REC
          </div>

          {/* Camera controls overlay */}
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-4 z-10 px-4">
            <button
              type="button"
              onClick={toggleFacingMode}
              className="w-10 h-10 rounded-sm bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
              title="Flip camera"
            >
              <FlipHorizontal size={16} />
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="w-12 h-12 rounded-sm bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
              title="Take photo"
            >
              <Camera size={20} />
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="w-10 h-10 rounded-sm bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-colors"
              title="Close camera"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* State: No photo, camera closed — show open button */}
      {!capturedPreview && !cameraOpen && (
        <button
          type="button"
          onClick={startCamera}
          className="flex flex-col items-center justify-center w-full max-w-[260px] aspect-square border border-black/20 dark:border-white/20 bg-white dark:bg-black hover:bg-[#f8f9fa] dark:hover:bg-[#111] hover:border-black dark:hover:border-white transition-all group"
        >
          <div className="p-4 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white mb-4 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
            <Camera size={24} />
          </div>
          <p className="text-[10px] text-black dark:text-white font-bold uppercase tracking-widest">{label}</p>
          <p className="text-[10px] text-black/40 dark:text-white/40 font-mono mt-2">TAP TO INITIALIZE SENSOR</p>
        </button>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="w-full max-w-[260px] p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-sm text-[10px] font-mono font-bold uppercase text-center tracking-widest">
          {cameraError}
        </div>
      )}
    </div>
  );
}
