'use client';

import { useEffect, useRef, useState } from 'react';
import { loadFaceModelsWithProgress, getDescriptorFromImage } from '@/lib/face-api-client';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const MODEL_LOAD_TIMEOUT_MS = 60_000;
const FETCH_TIMEOUT_MS = 15_000;
const NAME = 'Vishmish';

export default function SetupPage() {
  const [phase, setPhase] = useState<'loading-models' | 'processing' | 'done' | 'error'>('loading-models');
  const [log, setLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // Phase 1: load models only. When done, set phase to 'processing' so Phase 2 runs.
  useEffect(() => {
    if (phase !== 'loading-models') return;
    let cancelled = false;
    setLog(['Loading face models...']);
    (async () => {
      try {
        const loadWithTimeout = Promise.race([
          loadFaceModelsWithProgress((msg) => addLog(msg)),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Model loading timed out after 60s.')), MODEL_LOAD_TIMEOUT_MS)
          ),
        ]);
        await loadWithTimeout;
        if (cancelled) return;
        setPhase('processing');
      } catch (e) {
        if (!cancelled) {
          addLog(e instanceof Error ? e.message : String(e));
          setPhase('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [phase]);

  // Phase 2: only after React has re-rendered with phase='processing', fetch and process images.
  useEffect(() => {
    if (phase !== 'processing') return;
    let cancelled = false;
    addLog('Fetching image list...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    (async () => {
      try {
        const res = await fetch('/api/vishmish-images', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (cancelled) return;
        const files: string[] = await res.json();
        if (!files.length) {
          addLog('No images in /vishmish. Add JPG/PNG photos to public/vishmish/');
          setPhase('error');
          return;
        }
        addLog(`Found ${files.length} image(s). Processing...`);
        let inserted = 0;
        for (const file of files) {
          if (cancelled) return;
          const src = `/vishmish/${encodeURIComponent(file)}`;
          addLog(`  ${file}...`);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load ${src}`));
            img.src = src;
          });
          if (cancelled) return;
          const descriptor = await getDescriptorFromImage(img);
          if (!descriptor) {
            addLog('    No face detected, skipping.');
            continue;
          }
          const { error } = await supabase.from('identities').insert({ name: NAME, embedding: descriptor });
          if (error) {
            addLog(`    DB error: ${error.message}`);
            continue;
          }
          inserted++;
          addLog(`    OK (${inserted} total).`);
        }
        if (cancelled) return;
        addLog(`Done. Inserted ${inserted} face(s) for ${NAME}.`);
        setPhase('done');
      } catch (e) {
        clearTimeout(timeoutId);
        if (!cancelled) {
          const err = e instanceof Error ? e : new Error(String(e));
          addLog(err.name === 'AbortError' ? 'Request timed out. Is the dev server running?' : err.message);
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [phase]);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8 font-sans">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">One-time setup</h1>
        <p className="text-zinc-400 mb-2">
          This page processes all images in <code className="bg-zinc-800 px-1">public/vishmish/</code> and
          stores face descriptors in Supabase. Run it only once after adding photos.
        </p>
        <p className="text-amber-400/90 text-sm mb-6">
          Already set up? No need to run again — go to the{' '}
          <Link href="/" className="underline hover:text-amber-300">landing page</Link>.
        </p>
        <div className="bg-zinc-800 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap min-h-[200px] max-h-[50vh] overflow-y-auto">
          {log.length ? log.join('\n') : 'Waiting...'}
          <div ref={logEndRef} />
        </div>
        {phase === 'done' && (
          <div className="mt-6">
            <Link href="/" className="inline-flex rounded-full bg-rose-600 px-6 py-3 text-white font-medium hover:bg-rose-700">
              Go to landing
            </Link>
          </div>
        )}
        {phase === 'error' && (
          <div className="mt-6">
            <Link href="/setup" className="text-rose-400 hover:underline">Retry</Link>
            {' · '}
            <Link href="/" className="text-rose-400 hover:underline">Landing</Link>
          </div>
        )}
      </div>
    </div>
  );
}
