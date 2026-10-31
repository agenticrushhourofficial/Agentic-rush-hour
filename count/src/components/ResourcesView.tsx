import React, { useState } from 'react';
import { MentorRequest, Announcement } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { HelpCircle, Terminal, BookOpen, Send, Clock, CheckCircle, MessageSquare, Sparkles, ExternalLink, Cpu } from 'lucide-react';

interface ResourcesViewProps {
  mentorRequests: MentorRequest[];
  announcements: Announcement[];
  onRequestMentor: (req: Omit<MentorRequest, 'id' | 'status' | 'requestedAt'>) => void;
  soundMuted: boolean;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  mentorRequests,
  announcements,
  onRequestMentor,
  soundMuted,
}) => {
  const [teamName, setTeamName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !topic) return;

    soundEngine.playNotificationSound(soundMuted);
    onRequestMentor({
      teamName,
      tableNumber: tableNumber || 'Online/Discord',
      topic: `${topic} - ${description}`,
    });

    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 3000);

    setTopic('');
    setDescription('');
  };

  const apis = [
    {
      title: '@google/genai SDK',
      desc: 'Server-side Gemini 2.5/1.5 Flash & Pro integrations for intelligence, chat, and multimodality.',
      tag: 'AI Models',
      link: 'https://ai.google.dev/docs',
    },
    {
      title: 'WebGL Simplex Shader',
      desc: 'High-performance GPU shader background engine with GLSL noise, pulse loops, and mouse tracking.',
      tag: 'Graphics',
      link: 'https://khronos.org/webgl',
    },
    {
      title: 'Express + Vite Server',
      desc: 'Full-stack Node.js server setup running on port 3000 with esbuild CJS bundling.',
      tag: 'Backend',
      link: 'https://vitejs.dev',
    },
    {
      title: 'Tailwind CSS v4',
      desc: 'Modern utility CSS framework configured via @import "tailwindcss" and Vite plugin.',
      tag: 'Styling',
      link: 'https://tailwindcss.com',
    },
  ];

  return (
    <div className="container mx-auto px-4 md:px-12 py-10 max-w-6xl space-y-12">
      {/* Announcements Banner */}
      <div className="glass-card rounded-xl p-6 border-l-4 border-[#ddb7ff] bg-[#211e28]/90">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#ddb7ff] animate-pulse" />
          <h3 className="font-orbitron font-bold text-lg text-[#e7dfef] uppercase tracking-wider">
            Live Mainframe Broadcast Feed
          </h3>
        </div>

        <div className="space-y-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 text-xs font-space bg-[#100d16]/60 p-2.5 rounded border border-[#ddb7ff]/10"
            >
              <span className="text-[#ddb7ff] font-bold font-orbitron">{a.timestamp}</span>
              <p className="text-[#cfc2d6] flex-1">{a.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Hub & Docs */}
        <div className="space-y-6">
          <div>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-[#e7dfef] text-glow uppercase flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#ddb7ff]" />
              Developer API & Resource Hub
            </h2>
            <p className="font-space text-xs text-[#cfc2d6] mt-1">
              Curated documentation and libraries provided for Rush Hour 24 participants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {apis.map((api) => (
              <div
                key={api.title}
                className="glass-card p-5 rounded-xl border border-[#ddb7ff]/20 flex flex-col justify-between hover:border-[#ddb7ff]/50 transition-all"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-space uppercase px-2 py-0.5 rounded bg-[#ddb7ff]/10 text-[#ddb7ff] border border-[#ddb7ff]/30">
                      {api.tag}
                    </span>
                    <a
                      href={api.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#cfc2d6] hover:text-[#ddb7ff]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h4 className="font-orbitron font-bold text-base text-[#e7dfef]">
                    {api.title}
                  </h4>
                  <p className="font-space text-xs text-[#cfc2d6] mt-2 leading-relaxed">
                    {api.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mentor Request Desk */}
        <div className="space-y-6">
          <div>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-[#e7dfef] text-glow uppercase flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#ddb7ff]" />
              Mentor Support Desk
            </h2>
            <p className="font-space text-xs text-[#cfc2d6] mt-1">
              Need technical or pitch assistance? Dispatch a mentor directly to your table or Discord channel.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-[#ddb7ff]/30">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g., CyberGhost"
                    className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                    Table / Discord
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g., Table 12 or @Alex"
                    className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Help Topic
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., WebGL Shader GLSL error or Gemini API rate limit"
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Brief Issue Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Where are you stuck?"
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#ddb7ff] text-[#2c0051] py-2.5 rounded font-space text-xs font-bold uppercase tracking-wider hover:bg-[#b76dff] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Mentor Ticket</span>
              </button>

              {submittedMessage && (
                <p className="text-xs text-emerald-400 font-space text-center uppercase tracking-widest animate-pulse">
                  ✓ Ticket dispatched to Mentor Matrix!
                </p>
              )}
            </form>
          </div>

          {/* Active Queue */}
          <div className="space-y-2">
            <h4 className="font-orbitron font-bold text-sm text-[#e7dfef] uppercase tracking-wider">
              Active Dispatch Queue ({mentorRequests.length})
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {mentorRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card p-3 rounded-lg border border-[#ddb7ff]/10 flex items-center justify-between text-xs font-space"
                >
                  <div>
                    <div className="font-bold text-[#e7dfef]">{req.teamName} ({req.tableNumber})</div>
                    <div className="text-[#cfc2d6] text-[11px] truncate max-w-xs">{req.topic}</div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : req.status === 'assigned'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
