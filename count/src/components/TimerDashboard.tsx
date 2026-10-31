import React from 'react';
import { Announcement, HackathonState } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { RushHourBanner } from './RushHourBanner';
import { Rocket, RotateCcw, Pause, Play, ShieldAlert, Sparkles, Megaphone, Flame, Trophy, Info } from 'lucide-react';

interface TimerDashboardProps {
  state: HackathonState;
  announcements?: Announcement[];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onToggleRedAlert: () => void;
  onTriggerExplosion: () => void;
}

export const TimerDashboard: React.FC<TimerDashboardProps> = ({
  state,
  announcements = [],
  onStart,
  onPause,
  onResume,
  onReset,
  onToggleRedAlert,
  onTriggerExplosion,
}) => {
  // Time conversion
  const hours = Math.floor(state.secondsRemaining / 3600);
  const minutes = Math.floor((state.secondsRemaining % 3600) / 60);
  const seconds = state.secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const progressPercent = Math.min(
    100,
    Math.max(0, ((state.totalDurationSeconds - state.secondsRemaining) / state.totalDurationSeconds) * 100)
  );

  return (
    <main className="relative z-10 container mx-auto px-4 md:px-12 py-8 min-h-[85vh] flex flex-col items-center justify-center">
      {/* Sathyabama Dome Logo */}
      <div className="-mb-6 sm:-mb-8 md:-mb-10 flex flex-col items-center justify-center gap-2">
        <img
          src="/assets/sathyabama-logo.PNG"
          alt="Sathyabama Dome"
          className="w-[240px] sm:w-[320px] md:w-[400px] h-auto object-contain"
          style={{ filter: 'drop-shadow(0 0 18px rgba(221,183,255,0.7)) drop-shadow(0 0 40px rgba(183,109,255,0.5)) brightness(1.15)' }}
        />
      </div>




      {/* Central Dashboard Card with Liquid Glass UI */}
      <div className="liquid-glass-card p-6 sm:p-10 md:p-12 max-w-4xl w-full flex flex-col items-center gap-8 relative overflow-hidden">
        {/* Soft Ambient Inner Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Status */}
        <div className="text-center space-y-4 relative z-10 w-full flex flex-col items-center">
          <RushHourBanner className="w-full max-w-lg" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-pill shadow-inner">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state.isRedAlert
                  ? 'bg-red-500 animate-ping'
                  : state.isRunning
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-[#ddb7ff]'
              }`}
            />
            <span className="font-space text-xs sm:text-sm font-semibold text-[#ddb7ff] uppercase tracking-widest">
              {state.statusText}
            </span>
          </div>
        </div>

        {/* Timer Blocks - Liquid Glass Panels */}
        <div className="flex gap-3 sm:gap-6 md:gap-8 w-full justify-center items-center relative z-10">
          {/* Hours */}
          <div className="flex flex-col items-center gap-2">
            <div className="liquid-glass-btn w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 flex items-center justify-center rounded-2xl border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
              <span className={`font-orbitron text-4xl sm:text-6xl md:text-7xl font-bold ${state.isRedAlert ? 'text-red-400 text-glow-red' : 'text-[#ddb7ff] text-glow'}`}>
                {pad(hours)}
              </span>
            </div>
            <span className="font-space text-xs sm:text-sm text-[#cfc2d6] uppercase tracking-widest font-semibold">
              Hours
            </span>
          </div>

          <span className="font-orbitron text-3xl sm:text-5xl md:text-6xl font-bold text-[#ddb7ff]/50 animate-pulse pb-6">
            :
          </span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <div className="liquid-glass-btn w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 flex items-center justify-center rounded-2xl border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
              <span className={`font-orbitron text-4xl sm:text-6xl md:text-7xl font-bold ${state.isRedAlert ? 'text-red-400 text-glow-red' : 'text-[#ddb7ff] text-glow'}`}>
                {pad(minutes)}
              </span>
            </div>
            <span className="font-space text-xs sm:text-sm text-[#cfc2d6] uppercase tracking-widest font-semibold">
              Minutes
            </span>
          </div>

          <span className="font-orbitron text-3xl sm:text-5xl md:text-6xl font-bold text-[#ddb7ff]/50 animate-pulse pb-6">
            :
          </span>

          {/* Seconds */}
          <div className="flex flex-col items-center gap-2">
            <div className="liquid-glass-btn w-20 h-28 sm:w-28 sm:h-36 md:w-32 md:h-40 flex items-center justify-center rounded-2xl border border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
              <span className={`font-orbitron text-4xl sm:text-6xl md:text-7xl font-bold ${state.isRedAlert ? 'text-red-400 text-glow-red' : 'text-[#ddb7ff] text-glow'}`}>
                {pad(seconds)}
              </span>
            </div>
            <span className="font-space text-xs sm:text-sm text-[#cfc2d6] uppercase tracking-widest font-semibold">
              Seconds
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl space-y-1 relative z-10">
          <div className="flex justify-between text-xs font-space text-[#cfc2d6]">
            <span>Elapsed: {progressPercent.toFixed(1)}%</span>
            <span>24 Hours Total</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-black/40 border border-white/20 overflow-hidden backdrop-blur-md">
            <div
              className={`h-full transition-all duration-500 ${
                state.isRedAlert
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_12px_#ff0033]'
                  : 'bg-gradient-to-r from-[#b76dff] to-[#ddb7ff] shadow-[0_0_12px_#ddb7ff]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center items-center mt-2 relative z-10">
          {!state.isRunning && (
            <button
              onClick={() => {
                soundEngine.playLaunchSound(state.soundMuted);
                onStart();
              }}
              className="bg-gradient-to-r from-[#ddb7ff] to-[#c387ff] text-[#2c0051] px-8 py-3.5 rounded-full font-space text-sm uppercase tracking-[0.15em] font-bold shadow-[0_0_25px_rgba(221,183,255,0.7),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_0_35px_rgba(221,183,255,0.95)] hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer border border-white/40"
            >
              <Rocket className="w-5 h-5" />
              <span>Start Hackathon</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
};
