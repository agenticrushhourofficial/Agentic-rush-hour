export type NavTab = 'dashboard' | 'leaderboard' | 'schedule' | 'resources' | 'admin' | 'nav';

export type TrackType = 'AI & ML' | 'Cyberpunk UI' | 'Web3 / Infra' | 'GameDev & 3D' | 'Hardware & IoT';

export interface HackathonState {
  isLocked: boolean;
  isRunning: boolean;
  secondsRemaining: number;
  totalDurationSeconds: number;
  isRedAlert: boolean;
  soundMuted: boolean;
  flameIntensity: number; // 0.1 to 2.0
  statusText: string;
  ended: boolean;
}

export interface TeamSubmission {
  id: string;
  name: string;
  track: TrackType;
  members: string[];
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  upvotes: number;
  score: number;
  submittedAt: string;
  avatarSeed: string;
}

export interface Milestone {
  hour: number;
  title: string;
  description: string;
  type: 'kickoff' | 'checkpoint' | 'event' | 'freeze' | 'judging';
  completed: boolean;
  timeFormatted: string;
}

export interface MentorRequest {
  id: string;
  teamName: string;
  tableNumber: string;
  topic: string;
  status: 'pending' | 'assigned' | 'resolved';
  requestedAt: string;
}

export interface Announcement {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'urgent' | 'milestone';
}
