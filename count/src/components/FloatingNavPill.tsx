import React from 'react';
import { NavTab } from '../types';
import { Compass, Volume2, VolumeX, Lock, ShieldAlert, Terminal } from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

interface FloatingNavPillProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  isRedAlert: boolean;
  soundMuted: boolean;
  toggleSound: () => void;
  onLockSystem: () => void;
}

export const FloatingNavPill: React.FC<FloatingNavPillProps> = ({
  activeTab,
  onNavigate,
  isRedAlert,
  soundMuted,
  toggleSound,
  onLockSystem,
}) => {
  return (
    <div className="fixed top-4 right-4 sm:right-8 z-40 flex items-center gap-2 animate-fadeIn">
      {/* Red Alert Pill */}
      {isRedAlert && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/25 border border-red-400 text-red-200 text-xs font-space font-bold animate-pulse shadow-[0_0_15px_rgba(255,0,50,0.4)]">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">OVERDRIVE</span>
        </div>
      )}
    </div>
  );
};
