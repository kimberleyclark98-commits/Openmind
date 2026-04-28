'use client';

import { motion } from 'framer-motion';
import { Activity, Cpu, HardDrive, Zap, Wifi, WifiOff } from 'lucide-react';

interface StatusBarProps {
  memoryUsage?: number;
  cpuUsage?: number;
  fuelBalance?: number;
  isOnline?: boolean;
  migrationStatus?: 'idle' | 'migrating' | 'error';
  isThinking?: boolean;
  fuelGuardStatus?: {
    emergencyMode: boolean;
    dailySpent: number;
    monthlySpent: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  className?: string;
}

export default function StatusBar({
  memoryUsage = 0,
  cpuUsage = 0,
  fuelBalance = 0,
  isOnline = true,
  migrationStatus = 'idle',
  isThinking = false,
  fuelGuardStatus,
  className = ''
}: StatusBarProps) {
  const getMigrationColor = () => {
    switch (migrationStatus) {
      case 'migrating': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-zinc-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-xl border-b border-cyan-500/20 ${className}`}
    >
      {/* Left side - Eye status and AI state */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={isThinking ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: isThinking ? Infinity : 0 }}
            className={`w-2 h-2 rounded-full ${isThinking ? 'bg-yellow-400 shadow-yellow-400/50 shadow-lg' : 'bg-cyan-400 shadow-cyan-400/50 shadow-lg'}`}
          />
          <span className="text-xs font-mono tracking-wider text-zinc-300">
            {isThinking ? 'THINKING' : 'LIVE'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <HardDrive className="w-3 h-3 text-cyan-400" />
          <span className="text-xs font-mono text-zinc-400">
            MEM: {memoryUsage.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span className="text-xs font-mono text-zinc-400">
            CPU: {cpuUsage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Center - Fuel balance */}
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-mono text-yellow-400">
            FUEL: {fuelBalance.toFixed(4)} SOL
          </span>
          {fuelGuardStatus && (
            <>
              <span className="text-xs font-mono text-zinc-500">|</span>
              <span className={`text-xs font-mono ${fuelGuardStatus.emergencyMode ? 'text-red-400' : 'text-green-400'}`}>
                GUARD: {fuelGuardStatus.emergencyMode ? 'EMERGENCY' : 'ACTIVE'}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                ({fuelGuardStatus.dailySpent.toFixed(3)}/{fuelGuardStatus.dailyLimit})
              </span>
            </>
          )}
        </div>

      {/* Right side - Connection and migration status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className="text-xs font-mono text-zinc-400">
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Activity className={`w-3 h-3 ${getMigrationColor()}`} />
          <span className={`text-xs font-mono ${getMigrationColor()}`}>
            {migrationStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}