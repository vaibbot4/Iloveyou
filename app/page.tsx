'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadFaceModels, getDescriptorFromVideo, detectFaceInVideo } from '@/lib/face-api-client';

export default function LandingPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number>(0);
  const modelsLoadedRef = useRef(false);

  // Start webcam and load models
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceModels();
        if (cancelled) return;
        modelsLoadedRef.current = true;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch (e) {
        setError('Camera or models failed: ' + (e instanceof Error ? e.message : String(e)));
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Real-time face detection loop
  useEffect(() => {
    if (!ready || !videoRef.current || !modelsLoadedRef.current) return;
    let last = 0;
    const interval = 200; // throttle to ~5 FPS
    const tick = async () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = Date.now();
      if (now - last < interval) return;
      last = now;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const det = await detectFaceInVideo(video);
        setFaceDetected(!!det);
      } catch {
        setFaceDetected(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || verifying) return;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setError('Missing Supabase config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      const raw = await getDescriptorFromVideo(video);
      if (!raw || raw.length !== 128) {
        setError('No face in frame. Look at the camera and try again.');
        return;
      }
      const descriptor = raw as number[];
      const allFinite = descriptor.every((v) => typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(v));
      if (!allFinite) {
        setError('Face detection failed. Try again.');
        return;
      }
      const res = await fetch('/api/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      });
      const data = (await res.json()) as {
        match?: boolean;
        bestSimilarity?: number;
        error?: string;
        detail?: string;
      };
      if (!res.ok) throw new Error(data?.error || data?.detail || 'Verification failed');
      if (typeof window !== 'undefined') console.log('[VERIFY] server says:', data);
      if (data.match !== true) {
        setError("We couldn't match your face. Try again in good light.");
        return;
      }
      router.push('/valentine');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const supabaseMsg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : message;
      setError(supabaseMsg || 'Verification failed.');
      if (typeof console !== 'undefined') console.error('Verify error:', e);
    } finally {
      setVerifying(false);
    }
  }, [router, verifying]);

  if (error && !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-100 p-4">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-800 text-white p-4">
      <motion.h1
        className="text-2xl md:text-3xl font-bold text-center mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome
      </motion.h1>
      <p className="text-zinc-400 text-center mb-8">
        Position your face in the frame, then capture to verify.
      </p>

      <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
        {!ready && (
          <div className="w-[640px] h-[480px] max-w-[100vw] flex items-center justify-center text-zinc-500">
            Starting camera...
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full max-w-[640px] h-auto object-cover mirror"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <AnimatePresence>
          {ready && (
            <motion.div
              className="absolute inset-0 pointer-events-none border-4 border-rose-500/80 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: faceDetected ? 1 : 0.3 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        {verifying && (
          <p className="text-amber-400 text-sm">Detecting face and checking…</p>
        )}
        <motion.button
          type="button"
          onClick={handleCapture}
          disabled={!ready || verifying}
          className="rounded-full bg-rose-600 px-8 py-4 text-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {verifying ? 'Verifying...' : "Capture and verify you're Vishmish"}
        </motion.button>
        {error && (
          <p className="text-rose-400 text-sm text-center max-w-md" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
