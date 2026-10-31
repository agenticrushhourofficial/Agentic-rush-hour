import React from 'react';
import { Sparkles } from 'lucide-react';

interface ExplosionOverlayProps {
  onDismiss?: () => void;
  onResetTimer?: () => void;
}

export const ExplosionOverlay: React.FC<ExplosionOverlayProps> = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0a14] text-white flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.5s_ease-out] overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 space-y-12 max-w-5xl flex flex-col items-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-white/90 px-8 py-3 rounded-full text-sm md:text-base font-orbitron font-bold uppercase tracking-[0.3em] backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>24 Hours Expired</span>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>

          {/* Main Title */}
          <div className="relative pt-8 pb-4">
            <h1 className="font-orbitron text-6xl sm:text-8xl md:text-[9rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-500 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] leading-none animate-[pulse_4s_ease-in-out_infinite]">
              RUSH HOUR <br/> ENDS
            </h1>
          </div>

        {/* Subtitle */}
        <p className="font-space text-xl md:text-3xl font-bold uppercase tracking-[0.25em] text-purple-300/80 max-w-3xl mt-12 leading-relaxed">
          The Hackathon has officially concluded
        </p>

        {/* Decorative divider */}
        <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mt-16" />
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgyMHYyMEgyMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none mix-blend-overlay" />
    </div>
  );
};
