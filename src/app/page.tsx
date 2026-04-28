"use client";

import { useState } from "react";
import ClawFace from "@/components/claw/ClawFace";
import BinaryRain from "@/components/claw/BinaryRain";
import StatusBar from "@/components/claw/StatusBar";
import ControlPanel from "@/components/claw/ControlPanel";
import NeonButton from "@/components/claw/NeonButton";
import Link from "next/link";

export default function OpenClawHome() {
  const [isAwake, setIsAwake] = useState(true);
  const [fuelMode, setFuelMode] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'error'>('idle');

  const handleAwaken = () => setIsAwake(true);
  const handleSleep = () => setIsAwake(false);
  const handleOptimizeMemory = () => {
    setIsThinking(true);
    setTimeout(() => setIsThinking(false), 3000);
  };
  const handleToggleFuel = () => setFuelMode(!fuelMode);
  const handleMigrate = () => {
    setMigrationStatus('migrating');
    setTimeout(() => setMigrationStatus('idle'), 5000);
  };
  const handleEmergencyLockdown = () => {
    alert('Emergency lockdown activated! System secured.');
  };
  const handleKillSwitch = () => {
    if (confirm('⚠️ WARNING: Kill switch will permanently terminate OpenClaw. Are you sure?')) {
      alert('Kill switch activated. System terminated.');
    }
  };

  return (
    <div className="min-h-screen openclaw-matrix-bg flex flex-col">
      {/* Binary Rain Background */}
      <BinaryRain className="fixed inset-0" />

      {/* Status Bar */}
      <StatusBar
        memoryUsage={67.3}
        cpuUsage={23.1}
        fuelBalance={0.0042}
        isOnline={true}
        migrationStatus={migrationStatus}
        isThinking={isThinking}
        fuelGuardStatus={{
          emergencyMode: false,
          dailySpent: 0.123,
          monthlySpent: 2.456,
          dailyLimit: 0.5,
          monthlyLimit: 5.0
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8 relative z-10">
        {/* Left Side - OpenClaw Face */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md">
          <ClawFace
            status={isThinking ? 'thinking' : isAwake ? 'online' : 'sleeping'}
            className="mb-8"
          />

          {/* Quick Actions */}
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/dashboard">
              <NeonButton variant="purple">
                System Dashboard
              </NeonButton>
            </Link>
            <Link href="/lightning-generator">
              <NeonButton variant="blue">
                ⚡ Lightning Code Generator
              </NeonButton>
            </Link>
            <NeonButton
              variant="cyan"
              onClick={handleOptimizeMemory}
              disabled={!isAwake}
            >
              Optimize Memory
            </NeonButton>
            <NeonButton
              variant="lime"
              onClick={handleMigrate}
              disabled={!isAwake || migrationStatus === 'migrating'}
            >
              {migrationStatus === 'migrating' ? 'Migrating...' : 'Migrate'}
            </NeonButton>
          </div>
        </div>

        {/* Right Side - Control Panel */}
        <div className="w-full lg:w-80">
          <ControlPanel
            isAwake={isAwake}
            fuelMode={fuelMode}
            isMigrating={migrationStatus === 'migrating'}
            onAwaken={handleAwaken}
            onSleep={handleSleep}
            onOptimizeMemory={handleOptimizeMemory}
            onToggleFuel={handleToggleFuel}
            onMigrate={handleMigrate}
            onEmergencyLockdown={handleEmergencyLockdown}
            onKillSwitch={handleKillSwitch}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs font-mono text-zinc-600">
        OpenClaw v1.0 • Autonomous AI Entity • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
