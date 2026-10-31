import React, { useState, useEffect } from 'react';
import { HackathonState, NavTab, TeamSubmission, Milestone, MentorRequest, Announcement } from './types';
import { ShaderBackground } from './components/ShaderBackground';
import { GridFloor } from './components/GridFloor';
import { FireFloor } from './components/FireFloor';
import { ParticleCanvas } from './components/ParticleCanvas';
import { PasswordGate } from './components/PasswordGate';
import { FloatingNavPill } from './components/FloatingNavPill';
import { NavigationView } from './components/NavigationView';
import { TimerDashboard } from './components/TimerDashboard';
import { LeaderboardView } from './components/LeaderboardView';
import { ScheduleView } from './components/ScheduleView';
import { ResourcesView } from './components/ResourcesView';
import { AdminPanel } from './components/AdminPanel';
import { ExplosionOverlay } from './components/ExplosionOverlay';
import { AnnouncementPopup } from './components/AnnouncementPopup';

const DEFAULT_24H = 24 * 3600;

const INITIAL_TEAMS: TeamSubmission[] = [
  {
    id: 'team-1',
    name: 'Neural CyberSynth',
    track: 'AI & ML',
    members: ['Kaelen', 'Sora', 'Devon'],
    description: 'Generative audio synthesis pipeline producing real-time cyberpunk synthwave soundtracks using Gemini AI audio token streams.',
    githubUrl: 'https://github.com/example/neural-cybersynth',
    demoUrl: 'https://cybersynth.example.app',
    upvotes: 42,
    score: 98,
    submittedAt: 'Hour 18',
    avatarSeed: 'cyber1',
  },
  {
    id: 'team-2',
    name: 'AetherVoid UI',
    track: 'Cyberpunk UI',
    members: ['Elena', 'Ryu', 'Maya'],
    description: 'Holographic WebGL shader dashboard with 3D camera mouse tilt controls and reactive cyber metrics.',
    githubUrl: 'https://github.com/example/aethervoid-ui',
    demoUrl: 'https://aethervoid.example.app',
    upvotes: 38,
    score: 95,
    submittedAt: 'Hour 19',
    avatarSeed: 'cyber2',
  },
  {
    id: 'team-3',
    name: 'ZeroKnowledge Mainframe',
    track: 'Web3 / Infra',
    members: ['Jax', 'Zoe'],
    description: 'Privacy-first zero-knowledge verification protocol for decentralized hackathon voting and code integrity.',
    githubUrl: 'https://github.com/example/zk-mainframe',
    upvotes: 29,
    score: 89,
    submittedAt: 'Hour 16',
    avatarSeed: 'cyber3',
  },
  {
    id: 'team-4',
    name: 'Vaporwave Odyssey 3D',
    track: 'GameDev & 3D',
    members: ['Leo', 'Tessa', 'Kai', 'Priya'],
    description: 'Procedural retro-futuristic synthwave racer built with WebGL and custom GLSL particle explosion shaders.',
    githubUrl: 'https://github.com/example/vaporwave-odyssey',
    demoUrl: 'https://odyssey.example.app',
    upvotes: 34,
    score: 91,
    submittedAt: 'Hour 20',
    avatarSeed: 'cyber4',
  },
  {
    id: 'team-5',
    name: 'BioCyber Pulse',
    track: 'Hardware & IoT',
    members: ['Marcus', 'Nia'],
    description: 'Smart neural feedback wristband monitoring developer biometrics, heart rate, and fatigue during 24h coding sprints.',
    githubUrl: 'https://github.com/example/biocyber-pulse',
    upvotes: 27,
    score: 87,
    submittedAt: 'Hour 17',
    avatarSeed: 'cyber5',
  },
];

const INITIAL_MILESTONES: Milestone[] = [
  {
    hour: 0,
    title: 'Mainframe Initialization & Keynote Launch',
    description: 'Opening ceremony, track prompt reveals, and team formation on the main stage.',
    type: 'kickoff',
    completed: true,
    timeFormatted: '00:00 AM',
  },
  {
    hour: 3,
    title: 'Mentorship Desks Open & Track Deep Dives',
    description: '1-on-1 architecture reviews with domain experts and GCP engineers.',
    type: 'checkpoint',
    completed: true,
    timeFormatted: '03:00 AM',
  },
  {
    hour: 6,
    title: 'Checkpoint 1: Architecture & Database Review',
    description: 'First code sanity check and schema validation for all registered teams.',
    type: 'checkpoint',
    completed: false,
    timeFormatted: '06:00 AM',
  },
  {
    hour: 12,
    title: 'Midnight Pizza Feast & Retro Arcade Challenge',
    description: 'Energy refill, synthwave DJ set, and speedrun mini-game tournament.',
    type: 'event',
    completed: false,
    timeFormatted: '12:00 PM',
  },
  {
    hour: 18,
    title: 'Code Freeze Alert & Pre-Submission Testing',
    description: 'Final feature locks. Begin deployment to Cloud Run containers.',
    type: 'freeze',
    completed: false,
    timeFormatted: '06:00 PM',
  },
  {
    hour: 22,
    title: 'Pitching & Live Demo Presentations',
    description: 'Top 10 finalist teams present live 3-minute pitches to judging matrix.',
    type: 'judging',
    completed: false,
    timeFormatted: '10:00 PM',
  },
  {
    hour: 24,
    title: 'Grand Finale & Winner Accolades',
    description: 'Awarding $25,000 prize pool, trophies, and accelerator invitations.',
    type: 'judging',
    completed: false,
    timeFormatted: '12:00 AM',
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    timestamp: '00:00',
    message: '🚀 RUSH HOUR 24 HAS OFFICIALLY LAUNCHED! 24 Hours on the clock.',
    type: 'urgent',
  },
  {
    id: 'ann-2',
    timestamp: '02:30',
    message: '💡 Mentor Support Desk is live. Submit tickets under the Mentor & APIs tab.',
    type: 'info',
  },
];

const INITIAL_MENTOR_REQUESTS: MentorRequest[] = [
  {
    id: 'req-1',
    teamName: 'Neural CyberSynth',
    tableNumber: 'Table 04',
    topic: 'Gemini Audio Token Streaming & Web Audio API buffer sync',
    status: 'assigned',
    requestedAt: '02:15',
  },
  {
    id: 'req-2',
    teamName: 'Vaporwave Odyssey 3D',
    tableNumber: 'Table 18',
    topic: 'GLSL Noise Shader optimization for mobile frame rate',
    status: 'pending',
    requestedAt: '02:40',
  },
];

export default function App() {
  const getTabFromUrl = (): NavTab => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const validTabs: NavTab[] = ['dashboard', 'leaderboard', 'schedule', 'resources', 'admin', 'nav'];
    if (validTabs.includes(hash as NavTab)) {
      return hash as NavTab;
    }
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (validTabs.includes(path as NavTab)) {
      return path as NavTab;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavTab>(() => getTabFromUrl());

  const handleNavigate = (tab: NavTab) => {
    setActiveTabState(tab);
    window.location.hash = `#${tab}`;
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const routeTab = getTabFromUrl();
      setActiveTabState(routeTab);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const [state, setState] = useState<HackathonState>(() => {
    return {
      isLocked: true,
      isRunning: false,
      secondsRemaining: DEFAULT_24H,
      totalDurationSeconds: DEFAULT_24H,
      isRedAlert: false,
      soundMuted: false,
      flameIntensity: 1.0,
      statusText: 'System Standby',
      ended: false,
    };
  });

  const [teams, setTeams] = useState<TeamSubmission[]>(INITIAL_TEAMS);
  const [milestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [mentorRequests, setMentorRequests] = useState<MentorRequest[]>(INITIAL_MENTOR_REQUESTS);
  const [showExplosion, setShowExplosion] = useState(false);

  // Load real verified teams for leaderboard
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/public/leaderboard-teams');
        const data = await response.json();
        
        // Map backend verified teams to React TeamSubmission structure
        const mappedTeams: TeamSubmission[] = data.map((t: any) => {
          let track = 'Cyberpunk UI';
          if (t.domain) {
            const domainLower = t.domain.toLowerCase();
            if (domainLower.includes('ai') || domainLower.includes('ml') || domainLower.includes('intelligence')) {
              track = 'AI & ML';
            } else if (domainLower.includes('web3') || domainLower.includes('blockchain') || domainLower.includes('infra') || domainLower.includes('security')) {
              track = 'Web3 / Infra';
            } else if (domainLower.includes('game') || domainLower.includes('3d') || domainLower.includes('ar') || domainLower.includes('vr')) {
              track = 'GameDev & 3D';
            } else if (domainLower.includes('hardware') || domainLower.includes('iot') || domainLower.includes('robot')) {
              track = 'Hardware & IoT';
            }
          }
          
          return {
            id: String(t.id),
            name: t.team_name,
            track: track,
            members: Array.isArray(t.members) ? t.members : [],
            description: t.project_description || t.project_title || 'Developing a breakthrough hackathon solution.',
            githubUrl: undefined,
            demoUrl: undefined,
            upvotes: 10 + (t.id * 3) % 20,
            score: 80 + (t.id * 2) % 18,
            submittedAt: 'Hour 18',
            avatarSeed: `cyber${t.id}`,
          };
        });
        
        setTeams(mappedTeams);
      } catch (err) {
        console.error("Failed to fetch leaderboard teams:", err);
      }
    };
    
    fetchTeams();
  }, []);

  // Poll backend config for timer sync
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let actualStartTimeVal: string | null = null;

    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/hackathon-config');
        const data = await response.json();
        const startTimeStr = data.actualStartTime;
        
        setState((prev) => {
          if (startTimeStr) {
            const startTime = new Date(startTimeStr);
            const endDate = new Date(startTime.getTime() + (24 * 60 * 60 * 1000));
            const now = new Date();
            const remaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000));
            
            const isFinished = remaining <= 0;
            if (isFinished && !prev.ended && startTimeStr !== actualStartTimeVal) {
              setShowExplosion(true);
            }
            actualStartTimeVal = startTimeStr;

            return {
              ...prev,
              secondsRemaining: remaining,
              isRunning: remaining > 0,
              ended: isFinished,
              isRedAlert: !!data.isRedAlert,
              statusText: isFinished ? 'HACKATHON CONCLUDED' : data.isRedAlert ? 'CRITICAL OVERDRIVE' : 'LIVE COUNTDOWN RUNNING',
            };
          } else {
            actualStartTimeVal = null;
            return {
              ...prev,
              secondsRemaining: DEFAULT_24H,
              isRunning: false,
              ended: false,
              isRedAlert: !!data.isRedAlert,
              statusText: 'System Standby',
            };
          }
        });
      } catch (err) {
        console.error("Failed to sync timer config from server:", err);
      }
    };

    fetchConfig();
    pollInterval = setInterval(fetchConfig, 5000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Poll announcements from server
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/public/announcements');
        if (response.ok) {
          const data = await response.json();
          // Map backend announcements to React Announcement interface
          const mapped: Announcement[] = data.map((ann: any) => {
            // Ensure UTC string is parsed correctly (append Z if no timezone info present)
            let rawDate = ann.created_at || new Date().toISOString();
            if (typeof rawDate === 'string' && !rawDate.endsWith('Z') && !rawDate.includes('+')) {
              rawDate = rawDate + 'Z';
            }
            const dateObj = new Date(rawDate);
            const timestamp = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            return {
              id: String(ann.id),
              timestamp,
              message: ann.message,
              type: ann.type || 'info',
            };
          });
          setAnnouncements(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 2000);
    return () => clearInterval(interval);
  }, []);

  // Timer Tick Interval (runs locally for smooth updates)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isRunning && state.secondsRemaining > 0) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.secondsRemaining <= 1) {
            if (!prev.ended) {
              setShowExplosion(true);
            }
            return {
              ...prev,
              secondsRemaining: 0,
              isRunning: false,
              ended: true,
              statusText: 'HACKATHON CONCLUDED',
            };
          }
          return {
            ...prev,
            secondsRemaining: prev.secondsRemaining - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning]);

  // Actions
  const handleStartTimer = async () => {
    const token = sessionStorage.getItem('countdown_token') || localStorage.getItem('admin_token');
    if (!token) {
      alert("Unauthorized: Please unlock the dashboard first or login.");
      setState(prev => ({ ...prev, isLocked: true }));
      return;
    }
    
    try {
      const response = await fetch('/api/countdown/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setState((prev) => ({
          ...prev,
          isRunning: true,
          statusText: 'LIVE COUNTDOWN RUNNING',
        }));
      } else {
        alert(data.error || 'Failed to start countdown.');
        if (response.status === 401) {
          sessionStorage.removeItem('countdown_token');
          localStorage.removeItem('admin_token');
          setState(prev => ({ ...prev, isLocked: true }));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Please try again.');
    }
  };

  const handlePauseTimer = () => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      statusText: 'SYSTEM PAUSED (LOCAL)',
    }));
  };

  const handleResetTimer = async () => {
    const token = sessionStorage.getItem('countdown_token') || localStorage.getItem('admin_token');
    if (!token) {
      alert("Unauthorized: Please unlock the dashboard first or login.");
      setState(prev => ({ ...prev, isLocked: true }));
      return;
    }
    
    try {
      const response = await fetch('/api/countdown/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          secondsRemaining: prev.totalDurationSeconds,
          ended: false,
          statusText: 'System Standby',
        }));
        setShowExplosion(false);
      } else {
        alert(data.error || 'Failed to reset countdown.');
        if (response.status === 401) {
          sessionStorage.removeItem('countdown_token');
          localStorage.removeItem('admin_token');
          setState(prev => ({ ...prev, isLocked: true }));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server. Please try again.');
    }
  };

  const handleToggleRedAlert = () => {
    setState((prev) => ({
      ...prev,
      isRedAlert: !prev.isRedAlert,
      flameIntensity: !prev.isRedAlert ? 1.8 : 1.0,
      statusText: !prev.isRedAlert ? 'CRITICAL OVERDRIVE' : prev.isRunning ? 'LIVE COUNTDOWN RUNNING' : 'System Standby',
    }));
  };

  const handleToggleSound = () => {
    setState((prev) => ({
      ...prev,
      soundMuted: !prev.soundMuted,
    }));
  };

  const handleLockSystem = () => {
    setState((prev) => ({
      ...prev,
      isLocked: true,
    }));
  };

  const handleUnlockSystem = () => {
    setState((prev) => ({
      ...prev,
      isLocked: false,
    }));
  };

  const handleUpdateTimer = (hours: number, minutes: number, seconds: number) => {
    const totalSecs = hours * 3600 + minutes * 60 + seconds;
    setState((prev) => ({
      ...prev,
      secondsRemaining: totalSecs,
      totalDurationSeconds: Math.max(prev.totalDurationSeconds, totalSecs),
      ended: totalSecs === 0,
      statusText: totalSecs === 0 ? 'HACKATHON CONCLUDED' : prev.statusText,
    }));
  };

  const handleSetFlameIntensity = (val: number) => {
    setState((prev) => ({ ...prev, flameIntensity: val }));
  };

  const handleAddTeam = (
    newTeamData: Omit<TeamSubmission, 'id' | 'upvotes' | 'score' | 'submittedAt' | 'avatarSeed'>
  ) => {
    const elapsedHours = Math.floor((state.totalDurationSeconds - state.secondsRemaining) / 3600);
    const newTeam: TeamSubmission = {
      ...newTeamData,
      id: `team-${Date.now()}`,
      upvotes: 1,
      score: 90,
      submittedAt: `Hour ${elapsedHours}`,
      avatarSeed: `cyber-${teams.length + 1}`,
    };
    setTeams((prev) => [newTeam, ...prev]);
  };

  const handleUpvoteTeam = (id: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t))
    );
  };

  const handleAddAnnouncement = (message: string, type: 'info' | 'urgent' | 'milestone') => {
    const hours = Math.floor((state.totalDurationSeconds - state.secondsRemaining) / 3600);
    const mins = Math.floor(((state.totalDurationSeconds - state.secondsRemaining) % 3600) / 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      timestamp: timeStr,
      message,
      type,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const handleRequestMentor = (req: Omit<MentorRequest, 'id' | 'status' | 'requestedAt'>) => {
    const hours = Math.floor((state.totalDurationSeconds - state.secondsRemaining) / 3600);
    const mins = Math.floor(((state.totalDurationSeconds - state.secondsRemaining) % 3600) / 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    const newReq: MentorRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: 'pending',
      requestedAt: timeStr,
    };
    setMentorRequests((prev) => [newReq, ...prev]);
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden font-space select-none text-[#e7dfef] ${state.isRedAlert ? 'red-alert-pulse' : ''}`}>
      {/* Background WebGL Shader */}
      <ShaderBackground />

      {/* Grid Floor Perspective */}
      <GridFloor />

      {/* Growing Purple SVG Fire Floor */}
      <FireFloor
        secondsRemaining={state.secondsRemaining}
        totalDurationSeconds={state.totalDurationSeconds}
        isRedAlert={state.isRedAlert}
      />

      {/* Ambient Floating Particles */}
      <ParticleCanvas isRedAlert={state.isRedAlert} />

      {/* Live Announcement Popups */}
      <AnnouncementPopup announcements={announcements} soundMuted={state.soundMuted} />

      {/* Red Alert Overlay */}
      {state.isRedAlert && (
        <div className="fixed inset-0 pointer-events-none z-[30] bg-red-600/10 border-4 border-red-500/30 animate-pulse" />
      )}

      {/* Password Gate Security Lock Overlay */}
      {state.isLocked && (
        <PasswordGate onUnlock={handleUnlockSystem} soundMuted={state.soundMuted} />
      )}

      {/* Floating Navigation Pill Button */}
      <FloatingNavPill
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isRedAlert={state.isRedAlert}
        soundMuted={state.soundMuted}
        toggleSound={handleToggleSound}
        onLockSystem={handleLockSystem}
      />

      {/* Main Content View Switcher */}
      <div className="pt-16 pb-12 transition-opacity duration-500">
        {activeTab === 'nav' && (
          <NavigationView
            onSelectTab={handleNavigate}
            isRedAlert={state.isRedAlert}
            soundMuted={state.soundMuted}
            toggleSound={handleToggleSound}
            onLockSystem={handleLockSystem}
            secondsRemaining={state.secondsRemaining}
          />
        )}

        {activeTab === 'dashboard' && (
          <TimerDashboard
            state={state}
            announcements={announcements}
            onStart={handleStartTimer}
            onPause={handlePauseTimer}
            onResume={handleStartTimer}
            onReset={handleResetTimer}
            onToggleRedAlert={handleToggleRedAlert}
            onTriggerExplosion={() => setShowExplosion(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            teams={teams}
            onAddTeam={handleAddTeam}
            onUpvote={handleUpvoteTeam}
            soundMuted={state.soundMuted}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            milestones={milestones}
            secondsRemaining={state.secondsRemaining}
            totalDurationSeconds={state.totalDurationSeconds}
            soundMuted={state.soundMuted}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesView
            mentorRequests={mentorRequests}
            announcements={announcements}
            onRequestMentor={handleRequestMentor}
            soundMuted={state.soundMuted}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            state={state}
            onUpdateTimer={handleUpdateTimer}
            onSetFlameIntensity={handleSetFlameIntensity}
            onToggleRedAlert={handleToggleRedAlert}
            onAddAnnouncement={handleAddAnnouncement}
            onTriggerExplosion={() => setShowExplosion(true)}
            soundMuted={state.soundMuted}
          />
        )}
      </div>

      {/* Explosion Finish View */}
      {showExplosion && (
        <ExplosionOverlay
          onDismiss={() => {
            setShowExplosion(false);
            handleNavigate('leaderboard');
          }}
          onResetTimer={handleResetTimer}
        />
      )}
    </div>
  );
}
