import React from 'react';
import { NavTab } from '../types';
import { Volume2, VolumeX, Shield, ShieldAlert, Lock, Terminal } from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

interface HeaderNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isRedAlert: boolean;
  soundMuted: boolean;
  toggleSound: () => void;
  onLockSystem: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  isRedAlert,
  soundMuted,
  toggleSound,
  onLockSystem,
}) => {
  const handleTabClick = (tab: NavTab) => {
    soundEngine.playBeep(soundMuted);
    setActiveTab(tab);
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-40 flex justify-between items-center px-4 sm:px-6 py-2.5 liquid-glass-nav">
      {/* Brand Title */}
      <div
        onClick={() => handleTabClick('dashboard')}
        className="cursor-pointer flex items-center gap-2.5 group"
      >
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#ddb7ff] group-hover:shadow-[0_0_15px_rgba(221,183,255,0.7)] group-hover:border-[#ddb7ff]/60 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <Terminal className="w-4 h-4" />
        </div>
        <div className="font-orbitron font-bold text-base md:text-lg text-[#e7dfef] group-hover:text-[#ddb7ff] transition-colors tracking-tight">
          NEON_VOID<span className="text-[#ddb7ff] text-glow">_HACK</span>
        </div>
      </div>

      {/* Navigation Tabs - Liquid Glass Pill Bar */}
      <nav className="hidden md:flex items-center bg-black/20 p-1 rounded-full border border-white/10 backdrop-blur-md">
        {[
          { id: 'dashboard', label: 'Mainframe' },
          { id: 'leaderboard', label: 'Teams & Board' },
          { id: 'schedule', label: '24H Timeline' },
          { id: 'resources', label: 'Mentor & APIs' },
          { id: 'admin', label: 'Admin Matrix' },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id as NavTab)}
              className={`font-space font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-full transition-all cursor-pointer relative ${
                isActive
                  ? 'liquid-glass-pill text-[#e7dfef] text-glow'
                  : 'text-[#cfc2d6]/80 hover:text-[#e7dfef] hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Control Icons */}
      <div className="flex items-center gap-2">
        {/* Red Alert Indicator */}
        {isRedAlert && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/25 border border-red-400 text-red-200 text-xs font-space font-bold animate-pulse shadow-[0_0_15px_rgba(255,0,50,0.4)]">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">OVERDRIVE</span>
          </div>
        )}

        {/* Sound Toggle */}
        <button
          onClick={() => {
            toggleSound();
            soundEngine.playBeep(soundMuted);
          }}
          title={soundMuted ? 'Unmute Audio Synth' : 'Mute Audio Synth'}
          className="p-2 rounded-full liquid-glass-btn text-[#cfc2d6] hover:text-[#ddb7ff] transition-all cursor-pointer"
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#ddb7ff]" />}
        </button>

        {/* System Lock */}
        <button
          onClick={() => {
            soundEngine.playBeep(soundMuted);
            onLockSystem();
          }}
          title="Lock Mainframe"
          className="p-2 rounded-full liquid-glass-btn text-[#cfc2d6] hover:text-[#ddb7ff] transition-all cursor-pointer"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div className="flex md:hidden items-center gap-2">
        <select
          value={activeTab}
          onChange={(e) => handleTabClick(e.target.value as NavTab)}
          className="bg-black/40 text-[#ddb7ff] border border-white/20 text-xs font-space px-3 py-1.5 rounded-full outline-none backdrop-blur-md"
        >
          <option value="dashboard">Mainframe</option>
          <option value="leaderboard">Teams</option>
          <option value="schedule">24H Timeline</option>
          <option value="resources">Mentor & APIs</option>
          <option value="admin">Admin Matrix</option>
        </select>
      </div>
    </header>
  );
};
