import React from 'react';
import { NavTab } from '../types';
import { 
  Terminal, 
  Trophy, 
  Calendar, 
  BookOpen, 
  Settings, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Lock, 
  ShieldAlert, 
  Flame, 
  Radio, 
  Sparkles 
} from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

interface NavigationViewProps {
  onSelectTab: (tab: NavTab) => void;
  isRedAlert: boolean;
  soundMuted: boolean;
  toggleSound: () => void;
  onLockSystem: () => void;
  secondsRemaining: number;
}

export const NavigationView: React.FC<NavigationViewProps> = ({
  onSelectTab,
  isRedAlert,
  soundMuted,
  toggleSound,
  onLockSystem,
  secondsRemaining,
}) => {
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      title: 'Mainframe Dashboard',
      subtitle: 'Primary Hackathon Timer & Fire Floor',
      url: '/#dashboard',
      description: 'Real-time 24H countdown timer, high-speed fluid shader canvas, and emergency controls.',
      icon: Terminal,
      accent: 'from-[#ddb7ff]/20 to-purple-900/40',
      border: 'border-[#ddb7ff]/40',
      badge: 'MAIN HUB',
    },
    {
      id: 'leaderboard' as NavTab,
      title: 'Teams & Leaderboard',
      subtitle: 'Project Submissions & Upvotes',
      url: '/#leaderboard',
      description: 'Explore competing team projects, vote on innovations, inspect GitHub repos, and track live scores.',
      icon: Trophy,
      accent: 'from-amber-500/15 to-purple-900/40',
      border: 'border-amber-400/40',
      badge: 'LIVE SCORES',
    },
    {
      id: 'schedule' as NavTab,
      title: '24H Timeline & Schedule',
      subtitle: 'Milestones, Food Drops & Deadlines',
      url: '/#schedule',
      description: 'Chronological event agenda from Opening Keynote to Code Freeze and Final Demo Pitches.',
      icon: Calendar,
      accent: 'from-cyan-500/15 to-purple-900/40',
      border: 'border-cyan-400/40',
      badge: 'TIMELINE',
    },
    {
      id: 'resources' as NavTab,
      title: 'Mentor & API Desk',
      subtitle: 'Technical Help & Documentation',
      url: '/#resources',
      description: 'Summon subject-matter mentors directly to your table, access developer keys, and read broadcasts.',
      icon: BookOpen,
      accent: 'from-emerald-500/15 to-purple-900/40',
      border: 'border-emerald-400/40',
      badge: 'SUPPORT',
    },
    {
      id: 'admin' as NavTab,
      title: 'Admin Control Matrix',
      subtitle: 'System Parameters & Overrides',
      url: '/#admin',
      description: 'Adjust global countdown time, trigger explosion sequence, override flame intensity, and manage alert modes.',
      icon: Settings,
      accent: 'from-red-500/15 to-purple-900/40',
      border: 'border-red-400/40',
      badge: 'RESTRICTED',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Liquid Glass Header Portal */}
      <div className="mb-10 p-6 sm:p-8 rounded-3xl liquid-glass-nav relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-space text-[#ddb7ff] mb-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <Sparkles className="w-3.5 h-3.5 text-[#ddb7ff]" />
              <span>NAVIGATION PORTAL // URL ROUTER</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-orbitron font-extrabold text-[#e7dfef] tracking-tight">
              NEON_VOID <span className="text-[#ddb7ff] text-glow">DIRECTORY</span>
            </h1>
            <p className="text-sm text-[#cfc2d6]/80 mt-1 max-w-xl">
              Select a destination page below. Each section operates on a unique URL path for seamless bookmarked access.
            </p>
          </div>

          {/* Quick System Controls in Liquid Glass */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill text-xs font-space font-semibold text-[#e7dfef]">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>CLOCK: {formatTime(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => {
                toggleSound();
                soundEngine.playBeep(soundMuted);
              }}
              className="p-2.5 rounded-full liquid-glass-btn text-[#cfc2d6] hover:text-[#ddb7ff] cursor-pointer flex items-center gap-2 text-xs font-space"
              title="Toggle Audio Synth"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#ddb7ff]" />}
              <span className="hidden sm:inline">{soundMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playBeep(soundMuted);
                onLockSystem();
              }}
              className="p-2.5 rounded-full liquid-glass-btn text-[#cfc2d6] hover:text-[#ddb7ff] cursor-pointer flex items-center gap-2 text-xs font-space"
              title="Lock System"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Distinct Liquid Glass Destination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => {
                soundEngine.playBeep(soundMuted);
                onSelectTab(item.id);
              }}
              className={`group relative p-6 rounded-2xl bg-gradient-to-br ${item.accent} backdrop-blur-xl border ${item.border} hover:border-[#ddb7ff] transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_rgba(183,109,255,0.25)] hover:-translate-y-1 overflow-hidden`}
            >
              {/* Corner Ambient Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-[#ddb7ff]/20 transition-all duration-500" />

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#ddb7ff] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(221,183,255,0.6)] transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-space font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[#ddb7ff]">
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#cfc2d6]/60">
                    {item.url}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-orbitron font-bold text-[#e7dfef] group-hover:text-[#ddb7ff] transition-colors mb-1 flex items-center gap-2">
                {item.title}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#ddb7ff]" />
              </h2>
              <p className="text-xs font-space font-medium text-[#ddb7ff]/80 mb-2">
                {item.subtitle}
              </p>
              <p className="text-xs text-[#cfc2d6]/70 line-clamp-2">
                {item.description}
              </p>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-space text-[#ddb7ff]">
                <span>Launch Page &rarr;</span>
                <span className="text-[10px] uppercase tracking-wider text-[#cfc2d6]/50">Unique URL Route</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
