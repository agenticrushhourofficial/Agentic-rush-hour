import React, { useState } from 'react';
import { TeamSubmission, TrackType } from '../types';
import { soundEngine } from '../utils/soundEffects';
import { Trophy, ThumbsUp, ExternalLink, Github, Plus, Search, Filter, Cpu, Sparkles, Code, Globe, Shield } from 'lucide-react';

interface LeaderboardViewProps {
  teams: TeamSubmission[];
  onAddTeam: (newTeam: Omit<TeamSubmission, 'id' | 'upvotes' | 'score' | 'submittedAt' | 'avatarSeed'>) => void;
  onUpvote: (id: string) => void;
  soundMuted: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  teams,
  onAddTeam,
  onUpvote,
  soundMuted,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Modal state
  const [name, setName] = useState('');
  const [track, setTrack] = useState<TrackType>('Cyberpunk UI');
  const [members, setMembers] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const tracks: Array<TrackType | 'ALL'> = ['ALL', 'Cyberpunk UI', 'AI & ML', 'Web3 / Infra', 'GameDev & 3D', 'Hardware & IoT'];

  const filteredTeams = teams.filter((t) => {
    const matchesTrack = selectedTrack === 'ALL' || t.track === selectedTrack;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTrack && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    soundEngine.playUnlockSound(soundMuted);
    onAddTeam({
      name: name.trim(),
      track,
      members: members.split(',').map((m) => m.trim()).filter(Boolean),
      description: description.trim(),
      githubUrl: githubUrl.trim() || undefined,
      demoUrl: demoUrl.trim() || undefined,
    });

    setName('');
    setMembers('');
    setDescription('');
    setGithubUrl('');
    setDemoUrl('');
    setShowSubmitModal(false);
  };

  const trackIcons: Record<string, React.ReactNode> = {
    'Cyberpunk UI': <Sparkles className="w-4 h-4 text-purple-400" />,
    'AI & ML': <Cpu className="w-4 h-4 text-cyan-400" />,
    'Web3 / Infra': <Shield className="w-4 h-4 text-amber-400" />,
    'GameDev & 3D': <Code className="w-4 h-4 text-emerald-400" />,
    'Hardware & IoT': <Globe className="w-4 h-4 text-rose-400" />,
  };

  return (
    <div className="container mx-auto px-4 md:px-12 py-10 max-w-6xl">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-[#e7dfef] text-glow uppercase">
            Leaderboard & Submissions
          </h2>
          <p className="font-space text-sm text-[#cfc2d6] mt-1">
            Browse competing teams, vote for projects, and submit final builds.
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playBeep(soundMuted);
            setShowSubmitModal(true);
          }}
          className="bg-[#ddb7ff] text-[#2c0051] px-6 py-3 rounded-lg font-space text-sm font-bold uppercase tracking-wider hover:bg-[#b76dff] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(221,183,255,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Track Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {tracks.map((t) => (
            <button
              key={t}
              onClick={() => {
                soundEngine.playBeep(soundMuted);
                setSelectedTrack(t);
              }}
              className={`px-3 py-1.5 rounded-md font-space text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedTrack === t
                  ? 'bg-[#ddb7ff] text-[#2c0051] shadow-[0_0_10px_rgba(221,183,255,0.5)]'
                  : 'bg-[#2c2833]/80 text-[#cfc2d6] hover:text-[#ddb7ff] hover:bg-[#37333e]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#cfc2d6]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams or tech..."
            className="w-full bg-[#100d16]/70 border border-[#ddb7ff]/20 text-[#e7dfef] text-xs font-space pl-9 pr-3 py-2.5 rounded-lg outline-none focus:border-[#ddb7ff]"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((t, idx) => (
          <div
            key={t.id}
            className="glass-card rounded-xl p-6 flex flex-col justify-between relative group hover:border-[#ddb7ff]/50 transition-all hover:shadow-[0_0_20px_rgba(221,183,255,0.2)]"
          >
            <div>
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 bg-[#2c2833] px-2.5 py-1 rounded text-xs font-space text-[#ddb7ff] border border-[#ddb7ff]/30">
                  {trackIcons[t.track] || <Sparkles className="w-3.5 h-3.5" />}
                  <span>{t.track}</span>
                </span>
                <span className="font-orbitron font-bold text-sm text-[#ddb7ff]">
                  #{idx + 1}
                </span>
              </div>

              <h3 className="font-orbitron text-xl font-bold text-[#e7dfef] group-hover:text-[#ddb7ff] transition-colors">
                {t.name}
              </h3>

              <p className="font-space text-xs text-[#cfc2d6] mt-2 line-clamp-3 leading-relaxed">
                {t.description}
              </p>

              {/* Members */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {t.members.map((m) => (
                  <span
                    key={m}
                    className="bg-[#100d16]/60 border border-[#ddb7ff]/10 text-[#cfc2d6] text-[10px] font-space px-2 py-0.5 rounded"
                  >
                    @{m}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions & Upvotes */}
            <div className="mt-6 pt-4 border-t border-[#ddb7ff]/10 flex items-center justify-between">
              <div className="flex gap-2">
                {t.githubUrl && (
                  <a
                    href={t.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded bg-[#2c2833] text-[#cfc2d6] hover:text-[#ddb7ff] transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {t.demoUrl && (
                  <a
                    href={t.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded bg-[#2c2833] text-[#cfc2d6] hover:text-[#ddb7ff] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  soundEngine.playBeep(soundMuted);
                  onUpvote(t.id);
                }}
                className="bg-[#2c2833] hover:bg-[#ddb7ff]/20 border border-[#ddb7ff]/30 text-[#ddb7ff] px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-space cursor-pointer transition-all active:scale-95"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-bold">{t.upvotes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 md:p-8 rounded-xl max-w-lg w-full border border-[#ddb7ff]/40">
            <h3 className="font-orbitron text-2xl font-bold text-[#e7dfef] mb-2">
              Submit Hackathon Build
            </h3>
            <p className="font-space text-xs text-[#cfc2d6] mb-6">
              Register your project on the mainframe for live community judging.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Team / Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., CyberGhost AI"
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-sm font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Track Category
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as TrackType)}
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-sm font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                >
                  <option value="Cyberpunk UI">Cyberpunk UI</option>
                  <option value="AI & ML">AI & ML</option>
                  <option value="Web3 / Infra">Web3 / Infra</option>
                  <option value="GameDev & 3D">GameDev & 3D</option>
                  <option value="Hardware & IoT">Hardware & IoT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Team Members (comma separated)
                </label>
                <input
                  type="text"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  placeholder="e.g., Alex, Sarah, Devon"
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-sm font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                  Project Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your breakthrough innovation..."
                  className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-sm font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                    GitHub Link
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-space text-[#ddb7ff] uppercase mb-1">
                    Demo URL
                  </label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#100d16] border border-[#ddb7ff]/30 text-[#e7dfef] text-xs font-space px-3 py-2 rounded outline-none focus:border-[#ddb7ff]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="w-1/2 bg-transparent border border-[#ddb7ff]/30 text-[#cfc2d6] py-2.5 rounded font-space text-xs uppercase cursor-pointer hover:bg-[#2c2833]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#ddb7ff] text-[#2c0051] py-2.5 rounded font-space text-xs font-bold uppercase cursor-pointer hover:bg-[#b76dff]"
                >
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
