import React, { useState, useEffect, useRef } from 'react';
import { Announcement } from '../types';
import { Megaphone, Flame, Trophy, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

interface AnnouncementPopupProps {
  announcements: Announcement[];
  soundMuted: boolean;
}

const STORAGE_KEY = 'rh24_dismissed_ann_ids';

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ announcements, soundMuted }) => {
  const isFirstLoad = useRef(true);

  // Load dismissed IDs from localStorage so they persist across refreshes
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // On first load, immediately dismiss all current announcements (don't show them as popups on refresh)
  useEffect(() => {
    if (isFirstLoad.current && announcements.length > 0) {
      isFirstLoad.current = false;
      const currentIds = announcements.map((a) => a.id);
      setDismissedIds((prev) => {
        const merged = Array.from(new Set([...prev, ...currentIds]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      });
    }
  }, [announcements]);

  // Watch for NEW announcements that arrive after page load
  const prevIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (isFirstLoad.current) return; // Skip during first load phase
    const currentIds = announcements.map((a) => a.id);
    const newIds = currentIds.filter((id) => !prevIdsRef.current.includes(id) && !dismissedIds.includes(id));
    if (newIds.length > 0) {
      soundEngine.playBeep(soundMuted);
    }
    prevIdsRef.current = currentIds;
  }, [announcements, dismissedIds, soundMuted]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const updated = [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Filter out dismissed announcements
  const activePopups = announcements.filter((ann) => !dismissedIds.includes(ann.id));

  if (activePopups.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-[#15121c]/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out] pointer-events-auto">
      <div className="max-w-md md:max-w-lg w-full flex flex-col gap-4">
        {activePopups.map((ann) => {
          const isUrgent = ann.type === 'urgent';
          const isMilestone = ann.type === 'milestone';

          return (
            <div
              key={ann.id}
              className={`relative rounded-2xl border p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 transform scale-100 flex flex-col gap-6 ${
                isUrgent
                  ? 'bg-[#2a0b12]/95 border-red-500/60 shadow-[0_0_40px_rgba(239,68,68,0.4)] text-red-100'
                  : isMilestone
                  ? 'bg-[#0b261b]/95 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.4)] text-emerald-100'
                  : 'bg-[#1a1429]/95 border-[#ddb7ff]/50 shadow-[0_0_40px_rgba(183,109,255,0.4)] text-[#e7dfef]'
              }`}
            >
              {/* Top Bar Header & Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isUrgent ? 'bg-red-400' : isMilestone ? 'bg-emerald-400' : 'bg-purple-400'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isUrgent ? 'bg-red-500' : isMilestone ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`font-orbitron text-xs md:text-sm font-bold uppercase tracking-[0.2em] ${
                      isUrgent ? 'text-red-300' : isMilestone ? 'text-emerald-300' : 'text-[#ddb7ff]'
                    }`}
                  >
                    {isUrgent ? '🚨 Urgent Mainframe Alert' : isMilestone ? '🏆 Milestone Broadcast' : '📢 Mainframe Announcement'}
                  </span>
                </div>

                <button
                  onClick={() => handleDismiss(ann.id)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close Pop-up"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Body */}
              <div className="flex flex-col items-center text-center gap-4 py-2">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isUrgent
                      ? 'bg-red-500/20 border-red-400/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                      : isMilestone
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-purple-500/20 border-purple-400/40 text-purple-300 shadow-[0_0_20px_rgba(183,109,255,0.3)]'
                  }`}
                >
                  {isUrgent ? (
                    <Flame className="w-7 h-7 animate-pulse" />
                  ) : isMilestone ? (
                    <Trophy className="w-7 h-7" />
                  ) : (
                    <Megaphone className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="font-space text-lg md:text-xl font-bold leading-relaxed tracking-wide text-white">
                    {ann.message}
                  </p>
                  <span className="font-orbitron text-xs opacity-60 uppercase tracking-widest block">
                    {ann.timestamp} • {ann.type}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
