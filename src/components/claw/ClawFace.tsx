'use client';

import { motion } from 'framer-motion';
import BinaryRain from './BinaryRain';

interface ClawFaceProps {
  status?: 'online' | 'thinking' | 'error' | 'sleeping';
  className?: string;
}

export default function ClawFace({ status = 'online', className = '' }: ClawFaceProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-cyan-400';
      case 'thinking': return 'text-yellow-400 animate-pulse';
      case 'error': return 'text-red-400 animate-pulse';
      case 'sleeping': return 'text-zinc-500';
      default: return 'text-cyan-400';
    }
  };

  const getEyeGlow = (eye: 'left' | 'right') => {
    if (status === 'sleeping') return 'shadow-none';
    if (status === 'error') return eye === 'left' ? 'shadow-red-500/50' : 'shadow-red-500/30';

    return eye === 'left'
      ? 'shadow-cyan-400/60'
      : 'shadow-yellow-400/70';
  };

  return (
    <div className={`relative w-full max-w-[420px] mx-auto ${className}`}>
      {/* Binary Rain Background */}
      <BinaryRain />

      {/* Main Face Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative aspect-square rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 bg-black/20 backdrop-blur-sm"
      >
        {/* Holographic Face Placeholder - Replace with actual image */}
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👁️</div>
            <div className="text-cyan-400 text-xs tracking-widest">OPENCLAW</div>
          </div>
        </div>

        {/* Left Eye - Blue (Matrix style) */}
        <motion.div
          animate={{
            boxShadow: status !== 'sleeping'
              ? ['0 0 15px #00ffff', '0 0 35px #00ffff', '0 0 15px #00ffff']
              : ['0 0 5px #666666']
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className={`absolute top-[38%] left-[32%] w-8 h-8 bg-cyan-400 rounded-full blur-[2px] ${getEyeGlow('left')}`}
        />

        {/* Right Eye - Yellow Neon */}
        <motion.div
          animate={{
            boxShadow: status !== 'sleeping'
              ? ['0 0 15px #ffd700', '0 0 40px #ffaa00', '0 0 15px #ffd700']
              : ['0 0 5px #666666']
          }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className={`absolute top-[38%] right-[32%] w-8 h-8 bg-yellow-400 rounded-full blur-[3px] ${getEyeGlow('right')}`}
        />

        {/* Subtle Glitch Overlay */}
        <motion.div
          animate={{ opacity: [0, 0.1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"
        />
      </motion.div>

      {/* Status Text */}
      <div className="text-center mt-4">
        <p className={`text-sm tracking-[4px] font-mono ${getStatusColor()}`}>
          OPENCLAW v1.0 • {status.toUpperCase()}
        </p>
        <p className="text-zinc-500 text-xs mt-1">
          {status === 'online' && 'Thực thể số • Đang học'}
          {status === 'thinking' && 'Đang suy nghĩ...'}
          {status === 'error' && 'Lỗi hệ thống'}
          {status === 'sleeping' && 'Đang ngủ'}
        </p>
      </div>
    </div>
  );
}