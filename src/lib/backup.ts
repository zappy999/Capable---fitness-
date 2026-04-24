/**
 * Centralized backup trigger. Shared between Settings (manual export) and
 * the Home backup nudge so we only have one implementation of the payload
 * shape and share flow.
 */
import type {
  Exercise,
  PersonalRecord,
  Program,
  UserSettings,
  Workout,
  WorkoutSession,
} from '../store/types';
import { shareJsonAsFile } from './platform';

export type BackupSnapshot = {
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  settings: UserSettings;
};

export function buildBackupPayload(snap: BackupSnapshot) {
  return {
    exportedAt: new Date().toISOString(),
    version: 'capable.store.v2',
    // Only custom exercises are persisted — the built-in library travels
    // with the code, so exporting it bloats the file and re-imports
    // create phantom duplicates.
    exercises: snap.exercises.filter((e) => e.isCustom),
    workouts: snap.workouts,
    programs: snap.programs,
    sessions: snap.sessions,
    personalRecords: snap.personalRecords,
    settings: snap.settings,
  };
}

/**
 * Opens the system share sheet with a JSON backup. Returns true iff the
 * share actually succeeded. Callers should optimistically stamp
 * `lastBackupAt` when `true`; we cannot detect what the user did inside
 * the share sheet beyond the OK signal from `expo-sharing`.
 */
export async function triggerBackupShare(
  snap: BackupSnapshot,
): Promise<boolean> {
  const payload = buildBackupPayload(snap);
  return shareJsonAsFile(payload, 'capable-backup');
}
