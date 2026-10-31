import React from 'react';
import { Milestone } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { Clock, CheckCircle2, PlayCircle, Lock, BellRing, Flag, Flame, Coffee, Code2, Award } from 'lucide-react';

interface ScheduleViewProps {
  milestones: Milestone[];
  secondsRemaining: number;
  totalDurationSeconds: number;
  soundMuted: boolean;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  milestones,
  secondsRemaining,
  totalDurationSeconds,
  soundMuted,
}) => {
  const elapsedSeconds = totalDurationSeconds - secondsRemaining;
  const currentElapsedHours = Math.floor(elapsedSeconds / 3600);

  const milestoneIcons: Record<string, React.ReactNode> = {
    kickoff: <Flag className="w-5 h-5 text-purple-400" />,
    checkpoint: <Code2 className="w-5 h-5 text-cyan-400" />,
    event: <Coffee className="w-5 h-5 text-amber-400" />,
    freeze: <Flame className="w-5 h-5 text-rose-400" />,
    judging: <Award className="w-5 h-5 text-emerald-400" />,
  };

  return (
    <div className="container mx-auto px-4 md:px-12 py-10 max-w-5xl">
      {/* View Header */}
      <div className="mb-10 text-center md:text-left">
        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-[#e7dfef] text-glow uppercase">
          24-Hour Timeline & Milestones
        </h2>
        <p className="font-space text-sm text-[#cfc2d6] mt-1">
          Track the 24-hour hackathon progression from system initialization to final judging.
        </p>
      </div>

      {/* Timeline Column */}
      <div className="relative border-l-2 border-[#ddb7ff]/20 ml-4 md:ml-32 space-y-8 pl-6 md:pl-8">
        {milestones.map((m) => {
          const isPast = currentElapsedHours > m.hour;
          const isCurrent = currentElapsedHours === m.hour || (currentElapsedHours > m.hour && currentElapsedHours < m.hour + 3);
          const isFuture = currentElapsedHours < m.hour;

          return (
            <div key={m.hour} className="relative group">
              {/* Hour Indicator on Left */}
              <div className="hidden md:flex absolute -left-36 top-1.5 w-24 text-right flex-col items-end">
                <span className={`font-orbitron font-bold text-sm ${isCurrent ? 'text-[#ddb7ff] text-glow' : 'text-[#cfc2d6]'}`}>
                  HOUR {m.hour < 10 ? `0${m.hour}` : m.hour}
                </span>
                <span className="font-space text-[10px] text-[#cfc2d6]/70 uppercase">
                  {m.timeFormatted}
                </span>
              </div>

              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-[#ddb7ff] border-[#ddb7ff] shadow-[0_0_15px_#ddb7ff] scale-125'
                    : isPast
                    ? 'bg-[#2c0051] border-[#ddb7ff]/60 text-[#ddb7ff]'
                    : 'bg-[#15121c] border-[#ddb7ff]/20 text-[#cfc2d6]/40'
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ddb7ff]" />
                ) : isCurrent ? (
                  <PlayCircle className="w-4 h-4 text-[#2c0051] animate-pulse" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
              </div>

              {/* Card Content */}
              <div
                className={`glass-card rounded-xl p-6 transition-all ${
                  isCurrent
                    ? 'border-[#ddb7ff] shadow-[0_0_20px_rgba(221,183,255,0.25)] bg-[#211e28]/80'
                    : 'border-[#ddb7ff]/15'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-[#2c2833] border border-[#ddb7ff]/20">
                      {milestoneIcons[m.type] || <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="md:hidden text-xs font-orbitron font-bold text-[#ddb7ff] mr-2">
                        H{m.hour}:
                      </span>
                      <h3 className="font-orbitron font-bold text-lg text-[#e7dfef] inline-block">
                        {m.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="bg-[#ddb7ff]/20 border border-[#ddb7ff] text-[#ddb7ff] text-[10px] font-space px-2.5 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">
                        LIVE NOW
                      </span>
                    )}

                    <button
                      onClick={() => soundEngine.playNotificationSound(soundMuted)}
                      title="Set Alert Ping"
                      className="p-1.5 rounded hover:bg-[#ddb7ff]/20 text-[#cfc2d6] hover:text-[#ddb7ff] transition-colors cursor-pointer"
                    >
                      <BellRing className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="font-space text-xs text-[#cfc2d6] mt-3 leading-relaxed">
                  {m.description}
                </p>

                {/* Sub-Checklist */}
                <div className="mt-4 pt-3 border-t border-[#ddb7ff]/10 flex flex-wrap gap-3 text-xs font-space text-[#cfc2d6]/80">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ddb7ff]" />
                    Target: All Tracks
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Location: Mainframe Discord & Stage
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
