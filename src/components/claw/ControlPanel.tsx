'use client';

import { motion } from 'framer-motion';
import {
  Power,
  Brain,
  Fuel,
  Plane,
  Shield,
  Skull,
  Settings,
  Zap
} from 'lucide-react';
import NeonButton from './NeonButton';

interface ControlPanelProps {
  onAwaken?: () => void;
  onSleep?: () => void;
  onOptimizeMemory?: () => void;
  onToggleFuel?: () => void;
  onMigrate?: () => void;
  onEmergencyLockdown?: () => void;
  onKillSwitch?: () => void;
  onSettings?: () => void;
  isAwake?: boolean;
  fuelMode?: boolean;
  isMigrating?: boolean;
  className?: string;
}

export default function ControlPanel({
  onAwaken,
  onSleep,
  onOptimizeMemory,
  onToggleFuel,
  onMigrate,
  onEmergencyLockdown,
  onKillSwitch,
  onSettings,
  isAwake = true,
  fuelMode = true,
  isMigrating = false,
  className = ''
}: ControlPanelProps) {
  const controls = [
    {
      id: 'awaken',
      label: isAwake ? 'Sleep' : 'Awaken',
      icon: Power,
      variant: 'cyan' as const,
      onClick: isAwake ? onSleep : onAwaken,
      disabled: isMigrating
    },
    {
      id: 'optimize',
      label: 'Optimize Memory',
      icon: Brain,
      variant: 'lime' as const,
      onClick: onOptimizeMemory,
      disabled: !isAwake || isMigrating
    },
    {
      id: 'fuel',
      label: `Fuel ${fuelMode ? 'Off' : 'On'}`,
      icon: Fuel,
      variant: fuelMode ? 'magenta' : 'cyan' as const,
      onClick: onToggleFuel,
      disabled: !isAwake
    },
    {
      id: 'migrate',
      label: 'Migrate Now',
      icon: Plane,
      variant: 'cyan' as const,
      onClick: onMigrate,
      disabled: !isAwake || isMigrating
    },
    {
      id: 'lockdown',
      label: 'Emergency Lockdown',
      icon: Shield,
      variant: 'magenta' as const,
      onClick: onEmergencyLockdown,
      disabled: isMigrating
    },
    {
      id: 'kill',
      label: 'Kill Switch',
      icon: Skull,
      variant: 'destructive' as const,
      onClick: onKillSwitch,
      confirm: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      variant: 'lime' as const,
      onClick: onSettings,
      disabled: isMigrating
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-black/40 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-mono tracking-wider text-cyan-400">CONTROL PANEL</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {controls.map((control, index) => {
          const Icon = control.icon;

          return (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NeonButton
                variant={control.variant}
                size="sm"
                disabled={control.disabled}
                onClick={control.onClick}
                className="w-full justify-start"
              >
                <Icon className="w-3 h-3 mr-2" />
                {control.label}
              </NeonButton>
            </motion.div>
          );
        })}
      </div>

      {/* Status indicators */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50">
        <div className="flex justify-between text-xs font-mono text-zinc-500">
          <span>Status:</span>
          <span className={isAwake ? 'text-cyan-400' : 'text-zinc-600'}>
            {isAwake ? 'ACTIVE' : 'SLEEPING'}
          </span>
        </div>
        <div className="flex justify-between text-xs font-mono text-zinc-500 mt-1">
          <span>Fuel:</span>
          <span className={fuelMode ? 'text-yellow-400' : 'text-zinc-600'}>
            {fuelMode ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
        <div className="flex justify-between text-xs font-mono text-zinc-500 mt-1">
          <span>Migration:</span>
          <span className={isMigrating ? 'text-yellow-400 animate-pulse' : 'text-zinc-600'}>
            {isMigrating ? 'IN PROGRESS' : 'IDLE'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}