import React, { useState } from 'react';
import { soundEngine } from '../utils/soundEffects';

interface PasswordGateProps {
  onUnlock: () => void;
  soundMuted: boolean;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock, soundMuted }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('ACCESS DENIED - INVALID CREDENTIALS');

  const handleAttempt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(false);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('countdown_token', data.token);
        localStorage.setItem('admin_token', data.token);
        soundEngine.playUnlockSound(soundMuted);
        onUnlock();
      } else {
        soundEngine.playBeep(soundMuted);
        setErrorMsg(data.error || 'ACCESS DENIED - INVALID CREDENTIALS');
        setError(true);
        setTimeout(() => setError(false), 800);
      }
    } catch (err) {
      soundEngine.playBeep(soundMuted);
      setErrorMsg('CONNECTION ERROR - TRY AGAIN');
      setError(true);
      setTimeout(() => setError(false), 800);
    }
  };

  const handleQuickBypass = async () => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('countdown_token', data.token);
        localStorage.setItem('admin_token', data.token);
      }
    } catch (e) {
      console.error(e);
    }
    soundEngine.playUnlockSound(soundMuted);
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15121c]/90 backdrop-blur-md transition-opacity duration-500">
      <div className={`glass-card p-8 md:p-10 rounded-xl max-w-md w-full mx-4 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(183,109,255,0.25)] border border-[#ddb7ff]/30 ${error ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}`}>
        
        <div className="w-16 h-16 rounded-full bg-[#ddb7ff]/10 flex items-center justify-center border border-[#ddb7ff]/30 shadow-[0_0_20px_rgba(221,183,255,0.3)]">
          <span className="material-symbols-outlined text-[#ddb7ff] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            admin_panel_settings
          </span>
        </div>
+
        <div className="text-center">
          <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-[#e7dfef] tracking-wider uppercase text-glow">
            System Lock
          </h2>
          <p className="font-space text-sm text-[#cfc2d6] mt-2">
            Authenticate to access mainframe.
          </p>
        </div>

        <form onSubmit={handleAttempt} className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER PASSWORD"
              className={`w-full bg-[#2c2833]/60 border-b-2 ${error ? 'border-red-500 text-red-300' : 'border-[#ddb7ff]/60 focus:border-[#ddb7ff]'} text-[#e7dfef] px-4 py-3 outline-none font-space text-center tracking-[0.2em] transition-colors placeholder-[#cfc2d6]/50 rounded-t-md`}
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-400 text-center mt-1 font-space uppercase tracking-widest">
                {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#ddb7ff]/20 border border-[#ddb7ff] hover:bg-[#ddb7ff] hover:text-[#15121c] text-[#ddb7ff] px-6 py-3.5 rounded uppercase font-space font-semibold text-sm tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(221,183,255,0.7)] cursor-pointer flex items-center justify-center gap-2 group"
          >
            <span>Initialize</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
