'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NeonButtonProps {
  children: ReactNode;
  variant?: 'cyan' | 'magenta' | 'lime' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
}

const variants = {
  cyan: {
    base: 'border-cyan-500/50 text-cyan-400 hover:border-cyan-400',
    glow: 'shadow-cyan-500/50 hover:shadow-cyan-400/80',
    bg: 'hover:bg-cyan-950/20'
  },
  magenta: {
    base: 'border-magenta-500/50 text-magenta-400 hover:border-magenta-400',
    glow: 'shadow-magenta-500/50 hover:shadow-magenta-400/80',
    bg: 'hover:bg-magenta-950/20'
  },
  lime: {
    base: 'border-lime-500/50 text-lime-400 hover:border-lime-400',
    glow: 'shadow-lime-500/50 hover:shadow-lime-400/80',
    bg: 'hover:bg-lime-950/20'
  },
  destructive: {
    base: 'border-red-500/50 text-red-400 hover:border-red-500',
    glow: 'shadow-red-500/50 hover:shadow-red-500/80',
    bg: 'hover:bg-red-950/20'
  }
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

const glowIntensities = {
  low: { shadow: 'shadow-lg', hover: 'hover:shadow-xl' },
  medium: { shadow: 'shadow-xl', hover: 'hover:shadow-2xl' },
  high: { shadow: 'shadow-2xl', hover: 'hover:shadow-[0_0_40px]' }
};

export default function NeonButton({
  children,
  variant = 'cyan',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  glowIntensity = 'medium'
}: NeonButtonProps) {
  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];
  const glowStyles = glowIntensities[glowIntensity];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative border rounded-lg font-mono tracking-wide transition-all duration-300',
        'backdrop-blur-sm bg-black/20',
        variantStyles.base,
        variantStyles.bg,
        sizeStyles,
        glowStyles.shadow,
        glowStyles.hover,
        variantStyles.glow,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Subtle glitch effect on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.1 }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-lg pointer-events-none"
      />

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}