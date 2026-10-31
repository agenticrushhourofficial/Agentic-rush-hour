import React, { useState } from 'react';
import { HackathonState, Announcement } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { Sliders, ShieldAlert, Flame, Volume2, Radio, Sparkles, Send, RefreshCw, AlertOctagon } from 'lucide-react';

interface AdminPanelProps {
  state: HackathonState;
  onUpdateTimer: (hours: number, minutes: number, seconds: number) => void;
  onSetFlameIntensity: (val: number) => void;
  onToggleRedAlert: () => void;
  onAddAnnouncement: (msg: string, type: 'info' | 'urgent' | 'milestone') => void;
  onTriggerExplosion: () => void;
  soundMuted: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  state,
  onUpdateTimer,
  onSetFlameIntensity,
  onToggleRedAlert,
  onAddAnnouncement,
  onTriggerExplosion,
  soundMuted,
}) => {
  const currentHours = Math.floor(state.secondsRemaining / 3600);
  const currentMins = Math.floor((state.secondsRemaining % 3600) / 60);
  const currentSecs = state.secondsRemaining % 60;

  const [inputHours, setInputHours] = useState(currentHours);
  const [inputMins, setInputMins] = useState(currentMins);
  const [inputSecs, setInputSecs] = useState(currentSecs);

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'urgent' | 'milestone'>('urgent');

  const handleApplyTimer = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playBeep(soundMuted);
    onUpdateTimer(Number(inputHours), Number(inputMins), Number(inputSecs));
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    soundEngine.playNotificationSound(soundMuted);
    onAddAnnouncement(broadcastMsg.trim(), broadcastType);
    setBroadcastMsg('');
  };

  return (
    <div className="container mx-auto px-4 md:px-12 py-10 max-w-5xl space-y-10">
      <div>
        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-[#e7dfef] text-glow uppercase flex items-center gap-3">
          <Sliders className="w-8 h-8 text-[#ddb7ff]" />
          Admin Control Matrix
        </h2>
        <p className="font-space text-sm text-[#cfc2d6] mt-1">
          Root administrator commands for timer calibration, emergency overrides, and system sound FX.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Timer Calibration */}
        <div className="glass-card p-6 rounded-xl border border-[#ddb7ff]/30 space-y-6">
          <h3 className="font-orbitron font-bold text-lg text-[#e7dfef] uppercase flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#ddb7ff]" />
            Timer Calibration & Override
          </h3>

          <form onSubmit={handleApplyTimer} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={inputHours}
                  onChange={(e) => setInputHours(Number(e.target.value))}
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-lg font-orbitron font-bold px-3 py-2.5 rounded text-center outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMins}
                  onChange={(e) => setInputMins(Number(e.target.value))}
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-lg font-orbitron font-bold px-3 py-2.5 rounded text-center outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSecs}
                  onChange={(e) => setInputSecs(Number(e.target.value))}
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-lg font-orbitron font-bold px-3 py-2.5 rounded text-center outline-none focus:border-[#ddb7ff]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#ddb7ff] text-[#2c0051] py-3 rounded font-space text-xs font-bold uppercase tracking-wider hover:bg-[#b76dff] transition-all cursor-pointer"
            >
              Apply Calibration
            </button>
          </form>

          {/* Flame Intensity Slider */}
          <div className="pt-4 border-t border-[#ddb7ff]/10 space-y-2">
            <div className="flex justify-between items-center text-xs font-space text-[#cfc2d6]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#ddb7ff]" />
                Flame Heat Intensity:
              </span>
              <span className="font-orbitron text-[#ddb7ff] font-bold">
                {(state.flameIntensity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={state.flameIntensity}
              onChange={(e) => onSetFlameIntensity(parseFloat(e.target.value))}
              className="w-full accent-[#ddb7ff] cursor-pointer"
            />
          </div>
        </div>

        {/* Broadcast Broadcaster */}
        <div className="glass-card p-6 rounded-xl border border-[#ddb7ff]/30 space-y-6">
          <h3 className="font-orbitron font-bold text-lg text-[#e7dfef] uppercase flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#ddb7ff]" />
            Mainframe Broadcast Terminal
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                Announcement Priority
              </label>
              <select
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value as 'info' | 'urgent' | 'milestone')}
                className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
              >
                <option value="urgent">🔴 URGENT OVERRIDE</option>
                <option value="milestone">💜 MILESTONE CHECKPOINT</option>
                <option value="info">🔵 SYSTEM NOTICE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                Broadcast Message
              </label>
              <textarea
                rows={3}
                required
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="e.g., Code Freeze in 10 minutes! Prepare your GitHub links."
                className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ddb7ff] text-[#2c0051] py-3 rounded font-space text-xs font-bold uppercase tracking-wider hover:bg-[#b76dff] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast to Mainframe</span>
            </button>
          </form>
        </div>
      </div>

      {/* Emergency & Sound FX Testing */}
      <div className="glass-card p-6 rounded-xl border border-red-500/30 space-y-6">
        <h3 className="font-orbitron font-bold text-lg text-red-300 uppercase flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          Emergency Overrides & Web Audio Synth Diagnostics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => {
              soundEngine.playAlarmSound(soundMuted);
              onToggleRedAlert();
            }}
            className={`p-4 rounded-lg font-space text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
              state.isRedAlert
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.8)]'
                : 'bg-red-950/40 text-red-300 border-red-800 hover:bg-red-900/50'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
            <span>{state.isRedAlert ? 'Disable Overdrive' : 'Enable Overdrive'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playExplosionSound(soundMuted);
              onTriggerExplosion();
            }}
            className="p-4 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-space text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            <span>Trigger End Explosion</span>
          </button>

          <button
            onClick={() => soundEngine.playLaunchSound(soundMuted)}
            className="p-4 rounded-lg bg-[#2c2833] text-[#ddb7ff] border border-[#ddb7ff]/30 hover:bg-[#37333e] font-space text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <Volume2 className="w-6 h-6" />
            <span>Test Rocket SFX</span>
          </button>

          <button
            onClick={() => soundEngine.playUnlockSound(soundMuted)}
            className="p-4 rounded-lg bg-[#2c2833] text-[#ddb7ff] border border-[#ddb7ff]/30 hover:bg-[#37333e] font-space text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <Radio className="w-6 h-6" />
            <span>Test Unlock SFX</span>
          </button>
        </div>
      </div>
    </div>
  );
};
