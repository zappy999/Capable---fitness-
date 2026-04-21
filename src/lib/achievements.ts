import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { PersonalRecord, WorkoutSession } from '../store/types';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type AchievementId =
  | 'first_workout'
  | 'workouts_10'
  | 'workouts_50'
  | 'workouts_100'
  | 'streak_7'
  | 'streak_30'
  | 'first_pr'
  | 'prs_10';

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
  icon: IoniconName;
  color: string;
  target: number;
};

export type AchievementInputState = {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
};

export type AchievementStatus = {
  def: AchievementDef;
  progress: number;
  unlocked: boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_workout',
    title: 'First workout',
    description: 'Log your first session.',
    icon: 'flag-outline',
    color: '#22C55E',
    target: 1,
  },
  {
    id: 'workouts_10',
    title: '10 workouts',
    description: 'Build the habit.',
    icon: 'barbell-outline',
    color: '#60A5FA',
    target: 10,
  },
  {
    id: 'workouts_50',
    title: '50 workouts',
    description: 'Consistency pays off.',
    icon: 'barbell-outline',
    color: '#A78BFA',
    target: 50,
  },
  {
    id: 'workouts_100',
    title: '100 workouts',
    description: 'Triple digits.',
    icon: 'barbell-outline',
    color: '#FBBF24',
    target: 100,
  },
  {
    id: 'streak_7',
    title: '7-day streak',
    description: 'Train every day for a week.',
    icon: 'flame-outline',
    color: '#F87171',
    target: 7,
  },
  {
    id: 'streak_30',
    title: '30-day streak',
    description: 'A full month.',
    icon: 'flame-outline',
    color: '#EC4899',
    target: 30,
  },
  {
    id: 'first_pr',
    title: 'First PR',
    description: 'Set a new personal record.',
    icon: 'trophy-outline',
    color: '#C6F24E',
    target: 1,
  },
  {
    id: 'prs_10',
    title: '10 PRs',
    description: 'Stacking records.',
    icon: 'trophy-outline',
    color: '#10B981',
    target: 10,
  },
];

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function longestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let best = 0;
  for (const d of set) {
    if (set.has(addDaysISO(d, -1))) continue;
    let len = 1;
    let cur = d;
    while (set.has(addDaysISO(cur, 1))) {
      len += 1;
      cur = addDaysISO(cur, 1);
    }
    if (len > best) best = len;
  }
  return best;
}

function progressFor(
  id: AchievementId,
  state: AchievementInputState,
): number {
  switch (id) {
    case 'first_workout':
    case 'workouts_10':
    case 'workouts_50':
    case 'workouts_100':
      return state.sessions.length;
    case 'streak_7':
    case 'streak_30':
      return longestStreak([...new Set(state.sessions.map((s) => s.date))]);
    case 'first_pr':
    case 'prs_10':
      return state.prs.length;
  }
}

export function computeAchievementStatus(
  state: AchievementInputState,
): AchievementStatus[] {
  return ACHIEVEMENTS.map((def) => {
    const progress = progressFor(def.id, state);
    return { def, progress, unlocked: progress >= def.target };
  });
}

export function diffNewlyUnlocked(
  before: AchievementInputState,
  after: AchievementInputState,
): AchievementDef[] {
  const beforeUnlocked = new Set(
    computeAchievementStatus(before)
      .filter((s) => s.unlocked)
      .map((s) => s.def.id),
  );
  return computeAchievementStatus(after)
    .filter((s) => s.unlocked && !beforeUnlocked.has(s.def.id))
    .map((s) => s.def);
}
