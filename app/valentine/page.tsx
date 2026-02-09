'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const MESSAGE = "Hey baby, Welcome to Vaibhav's heart you may find yourself here 🙈🙈";
const PROPOSAL_TEXT =
  "Babe, we have valentine coming up... will you please please be my valentine? 🥺";
const VALENTINE_DURATION_MS = 10 * 1000; // 10 seconds

export default function ValentinePage() {
  const [phase, setPhase] = useState<'heart' | 'proposal'>('heart');
  const [bubbleImages, setBubbleImages] = useState<string[]>([]);
  const [heartBgImage, setHeartBgImage] = useState<string | null>(null);
  const [proposalImages, setProposalImages] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/vishmish-images')
      .then((r) => r.json())
      .then((files: string[]) => setBubbleImages(files));
    fetch('/api/valentine-images')
      .then((r) => r.json())
      .then((files: string[]) => setHeartBgImage(files[0] ?? null));
    fetch('/api/proposal-images')
      .then((r) => r.json())
      .then((files: string[]) => setProposalImages(files));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase('proposal'), VALENTINE_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'heart' && (
          <HeartPhase key="heart" message={MESSAGE} bubbleImages={bubbleImages} heartBgImage={heartBgImage} />
        )}
        {phase === 'proposal' && (
          <ProposalPhase key="proposal" proposalImages={proposalImages} />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeartPhase({
  message,
  bubbleImages,
  heartBgImage,
}: {
  message: string;
  bubbleImages: string[];
  heartBgImage: string | null;
}) {
  const heartBgSrc = heartBgImage ? `/valentine/${encodeURIComponent(heartBgImage)}` : null;
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background: first image in public/valentine */}
      <div className="absolute inset-0 bg-zinc-900">
        {heartBgSrc && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heartBgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      {/* Floating bubbles: first 15 from public/vishmish */}
      <div className="absolute inset-0 pointer-events-none">
        {bubbleImages.slice(0, 15).map((file, i) => (
          <FloatingBubble key={file + i} src={`/vishmish/${encodeURIComponent(file)}`} index={i} />
        ))}
      </div>

      {/* Message */}
      <motion.p
        className="absolute bottom-[20%] left-0 right-0 text-center text-white text-xl md:text-2xl font-medium px-6 drop-shadow-lg z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

function FloatingBubble({ src, index }: { src: string; index: number }) {
  const x = 10 + (index * 17) % 80;
  const y = 15 + (index * 23) % 70;
  const size = 64 + (index % 3) * 24;
  const duration = 4 + (index % 3);
  const delay = index * 0.2;

  return (
    <motion.div
      className="absolute rounded-full overflow-hidden border-2 border-white/30 shadow-lg"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
      }}
      animate={{
        y: [0, -12, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Image src={src} alt="" width={size} height={size} className="object-cover w-full h-full" unoptimized />
    </motion.div>
  );
}

function ProposalPhase({ proposalImages }: { proposalImages: string[] }) {
  const [showPopup, setShowPopup] = useState(false);
  const [noPosition, setNoPosition] = useState({ x: 200, y: 300 });
  const noRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const RUNWAY_DIST = 50;

  const moveNoAway = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 80;
    const btnW = 120;
    const btnH = 48;
    setNoPosition({
      x: padding + Math.random() * (rect.width - padding * 2 - btnW),
      y: padding + Math.random() * (rect.height - padding * 2 - btnH),
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 80;
    const btnW = 120;
    const btnH = 48;
    setNoPosition({
      x: rect.width * 0.25,
      y: rect.height * 0.55,
    });
  }, []);

  // Listen on document so we get mouse/touch everywhere (container has pointer-events-none)
  useEffect(() => {
    const onMove = (e: MouseEvent | Touch) => {
      const btn = noRef.current;
      if (!btn) return;
      const br = btn.getBoundingClientRect();
      const cx = br.left + br.width / 2;
      const cy = br.top + br.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (Math.hypot(dx, dy) < RUNWAY_DIST) moveNoAway();
    };
    const handleMouse = (e: MouseEvent) => onMove(e);
    const handleTouch = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0]);
    };
    document.addEventListener('mousemove', handleMouse);
    document.addEventListener('touchmove', handleTouch, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouse);
      document.removeEventListener('touchmove', handleTouch);
    };
  }, [moveNoAway]);

  const handleYes = useCallback(() => {
    setShowPopup(true);
  }, []);

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-rose-950 to-zinc-900 flex flex-col items-center pt-12 pb-8 px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.p
          className="text-white text-xl md:text-2xl text-center max-w-lg mb-10 relative z-10 shrink-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {PROPOSAL_TEXT}
        </motion.p>
        <div ref={containerRef} className="relative w-full flex-1 min-h-[220px] flex items-center justify-center">
          <motion.button
            type="button"
            onClick={handleYes}
            className="relative z-10 rounded-full bg-rose-600 px-8 py-3 text-white font-semibold hover:bg-rose-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Yes
          </motion.button>
          <motion.button
            ref={noRef}
            type="button"
            className="absolute rounded-full border-2 border-white/60 px-8 py-3 text-white font-medium hover:bg-white/10 transition-colors z-20 pointer-events-auto"
            style={{ left: noPosition.x, top: noPosition.y }}
            animate={{ left: noPosition.x, top: noPosition.y }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onMouseEnter={moveNoAway}
            onTouchStart={moveNoAway}
            onClick={(e) => { e.preventDefault(); moveNoAway(); }}
          >
            No
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPopup && (
          <SuccessPopup proposalImages={proposalImages} onClose={() => (window.location.href = '/')} />
        )}
      </AnimatePresence>
    </>
  );
}

function SuccessPopup({ proposalImages, onClose }: { proposalImages: string[]; onClose: () => void }) {
  const confettiFired = useRef(false);
  const usSrc = proposalImages[0] ? `/proposal/${encodeURIComponent(proposalImages[0])}` : null;

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    import('canvas-confetti').then((confetti) => {
      confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        confetti.default({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
        confetti.default({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
      }, 200);
    });
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-2xl font-bold text-rose-400 mb-6">yuuuhuuu!</p>
        <div className="relative aspect-square max-h-[280px] mx-auto rounded-xl overflow-hidden bg-zinc-800">
          {usSrc && (
            <Image
              src={usSrc}
              alt="Us"
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-zinc-400 hover:text-white underline"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
