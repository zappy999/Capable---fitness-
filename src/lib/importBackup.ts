import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { isSafeHttpUrl } from './platform';
import type {
  Exercise,
  GroupType,
  SessionExercise,
  SessionSet,
  UserSettings,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from '../store/types';

export type ImportReport = {
  customExercisesCreated: number;
  workoutsImported: number;
  sessionsImported: number;
  warnings: string[];
};

export type ImportPayload = {
  customExercises: Exercise[];
  workouts: Workout[];
  sessions: WorkoutSession[];
  settings: Partial<UserSettings>;
  report: ImportReport;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

function parseTarget(target: string): { sets: number; reps: string } {
  if (!target) return { sets: 1, reps: '' };
  const m = target.match(/^(\d+)\s*x\s*(.+)$/i);
  if (m) return { sets: Number(m[1]) || 1, reps: m[2].trim() };
  return { sets: 1, reps: target };
}

function parseRestFirstSeconds(rest: string, fallback: number): number {
  if (!rest) return fallback;
  const s = rest.match(/(\d+)\s*s/i);
  if (s) return Number(s[1]);
  const m = rest.match(/(\d+)\s*min/i);
  if (m) return Number(m[1]) * 60;
  const n = Number(rest);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseNumOr(v: unknown, fallback: number): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function parseOptNum(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    if (v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function isGroupType(v: unknown): v is GroupType {
  return v === 'superset' || v === 'circuit' || v === 'emom';
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildImportPayload(
  raw: unknown,
  currentCustomExercises: Exercise[],
  defaultRestSeconds: number,
): ImportPayload {
  const backup = (raw ?? {}) as Record<string, unknown>;
  const version = typeof backup.version === 'string' ? backup.version : '';
  const looksNative =
    version.startsWith('capable.store') ||
    (Array.isArray(backup.workouts) && Array.isArray(backup.sessions));
  if (looksNative) return buildFromNative(backup, currentCustomExercises);
  return buildFromWeb(backup, currentCustomExercises, defaultRestSeconds);
}

function buildFromWeb(
  backup: Record<string, unknown>,
  currentCustomExercises: Exercise[],
  defaultRestSeconds: number,
): ImportPayload {
  const warnings: string[] = [];

  const libByName = new Map<string, string>();
  for (const e of EXERCISE_LIBRARY) libByName.set(norm(e.name), e.id);

  const customByName = new Map<string, string>(
    currentCustomExercises.map((e) => [norm(e.name), e.id]),
  );

  const newCustom: Exercise[] = [];
  const resolveName = (name: string): string => {
    const key = norm(name);
    if (libByName.has(key)) return libByName.get(key)!;
    if (customByName.has(key)) return customByName.get(key)!;
    const id = genId('ex');
    const exercise: Exercise = {
      id,
      name: name.trim(),
      category: null,
      isCustom: true,
    };
    newCustom.push(exercise);
    customByName.set(key, id);
    return id;
  };

  const allNames = new Set<string>();
  const sourceLibrary = Array.isArray(backup.exerciseLibrary)
    ? (backup.exerciseLibrary as unknown[])
    : [];
  for (const n of sourceLibrary) {
    if (typeof n === 'string' && n.trim()) allNames.add(n);
  }
  const sourcePrograms = Array.isArray(backup.programs)
    ? (backup.programs as Record<string, unknown>[])
    : [];
  for (const p of sourcePrograms) {
    const pex = Array.isArray(p?.exercises)
      ? (p.exercises as Record<string, unknown>[])
      : [];
    for (const ex of pex) {
      if (typeof ex?.name === 'string') allNames.add(ex.name);
    }
  }
  const sourceHistory = Array.isArray(backup.history)
    ? (backup.history as Record<string, unknown>[])
    : [];
  for (const h of sourceHistory) {
    const session = (h?.session ?? {}) as Record<string, unknown>;
    for (const name of Object.keys(session)) allNames.add(name);
  }
  for (const n of allNames) resolveName(n);

  const workouts: Workout[] = [];
  for (const p of sourcePrograms) {
    const id = typeof p.id === 'string' ? p.id : genId('wk');
    const name = typeof p.name === 'string' ? p.name : 'Workout';
    const exercises: WorkoutExercise[] = [];
    const pex = Array.isArray(p.exercises)
      ? (p.exercises as Record<string, unknown>[])
      : [];
    for (const ex of pex) {
      if (typeof ex.name !== 'string') continue;
      const { sets, reps } = parseTarget(String(ex.target ?? ''));
      const groupNum = typeof ex.supersetGroup === 'number' ? ex.supersetGroup : 0;
      const inGroup = groupNum > 0;
      const demo = typeof ex.demoUrl === 'string' ? ex.demoUrl : '';
      exercises.push({
        id: genId('we'),
        exerciseId: resolveName(ex.name),
        sets,
        reps,
        restSeconds: parseRestFirstSeconds(
          String(ex.rest ?? ''),
          defaultRestSeconds,
        ),
        tempo: ex.tempo ? String(ex.tempo) : undefined,
        note: ex.exerciseNote ? String(ex.exerciseNote) : undefined,
        isDropSet: Boolean(ex.dropSet),
        supersetGroup: inGroup ? String(groupNum) : undefined,
        groupType: inGroup && isGroupType(ex.groupType) ? ex.groupType : undefined,
        emomSeconds:
          typeof ex.emomSeconds === 'number' ? ex.emomSeconds : undefined,
        demoUrl: isSafeHttpUrl(demo) ? demo : undefined,
      });
    }
    workouts.push({ id, name, exercises, createdAt: Date.now() });
  }

  const sessions: WorkoutSession[] = [];
  for (const h of sourceHistory) {
    const id = typeof h.id === 'string' ? h.id : genId('sess');
    const name = typeof h.name === 'string' ? h.name : 'Workout';
    const date = typeof h.date === 'string' ? h.date : '';
    if (!date) {
      warnings.push(`Session ${id}: missing date, skipped`);
      continue;
    }
    const sessionObj = (h.session ?? {}) as Record<string, unknown>;
    const exerciseNotes = (h.exerciseNotes ?? {}) as Record<string, unknown>;
    const sessionExercises: SessionExercise[] = [];
    for (const [exName, rawSets] of Object.entries(sessionObj)) {
      if (!Array.isArray(rawSets)) continue;
      const exerciseId = resolveName(exName);
      const mapped: SessionSet[] = [];
      for (const st of rawSets) {
        if (!st || typeof st !== 'object') continue;
        const s = st as Record<string, unknown>;
        const weight = parseNumOr(s.weight, 0);
        const reps = parseNumOr(s.reps, 0);
        if (weight <= 0 && reps <= 0) continue;
        mapped.push({
          weight,
          reps,
          rpe: parseOptNum(s.rpe),
          rir: parseOptNum(s.rir),
        });
      }
      if (mapped.length === 0) continue;
      const rawNote = exerciseNotes[exName];
      const note =
        typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : undefined;
      sessionExercises.push({
        id: genId('se'),
        exerciseId,
        sets: mapped,
        note,
      });
    }
    if (sessionExercises.length === 0) {
      warnings.push(`Session ${date} (${name}): no completed sets, skipped`);
      continue;
    }
    const sessionNote =
      typeof h.sessionNote === 'string' && h.sessionNote.trim()
        ? h.sessionNote.trim()
        : undefined;
    sessions.push({
      id,
      workoutName: name,
      date,
      durationSeconds: parseNumOr(h.durationSeconds, 0),
      exercises: sessionExercises,
      notes: sessionNote,
    });
  }

  const settings: Partial<UserSettings> = {};
  if (typeof backup.defaultRestSeconds === 'number') {
    settings.defaultRestSeconds = backup.defaultRestSeconds;
  }
  if (typeof backup.timezone === 'string') {
    settings.timezone = backup.timezone;
  }

  return {
    customExercises: newCustom,
    workouts,
    sessions,
    settings,
    report: {
      customExercisesCreated: newCustom.length,
      workoutsImported: workouts.length,
      sessionsImported: sessions.length,
      warnings,
    },
  };
}

function buildFromNative(
  backup: Record<string, unknown>,
  currentCustomExercises: Exercise[],
): ImportPayload {
  const warnings: string[] = [];
  const libIds = new Set(EXERCISE_LIBRARY.map((e) => e.id));
  const existingCustomIds = new Set(currentCustomExercises.map((e) => e.id));

  const newCustom: Exercise[] = [];
  for (const e of (backup.exercises ?? []) as Record<string, unknown>[]) {
    if (typeof e?.id !== 'string' || typeof e?.name !== 'string') continue;
    if (libIds.has(e.id) || existingCustomIds.has(e.id)) continue;
    newCustom.push({
      id: e.id,
      name: e.name,
      category: typeof e.category === 'string' ? (e.category as Exercise['category']) : null,
      isCustom: true,
    });
  }

  const workouts: Workout[] = [];
  for (const w of (backup.workouts ?? []) as Record<string, unknown>[]) {
    if (typeof w?.id !== 'string' || typeof w?.name !== 'string') continue;
    if (!Array.isArray(w?.exercises)) continue;
    workouts.push({
      id: w.id,
      name: w.name,
      exercises: w.exercises as WorkoutExercise[],
      createdAt: typeof w.createdAt === 'number' ? w.createdAt : Date.now(),
    });
  }

  const sessions: WorkoutSession[] = [];
  for (const s of (backup.sessions ?? []) as Record<string, unknown>[]) {
    if (typeof s?.id !== 'string' || typeof s?.workoutName !== 'string') continue;
    if (typeof s?.date !== 'string') {
      warnings.push(`Session ${s?.id ?? '?'} skipped: missing date`);
      continue;
    }
    if (!Array.isArray(s?.exercises)) continue;
    sessions.push({
      id: s.id,
      workoutName: s.workoutName,
      workoutId: typeof s.workoutId === 'string' ? s.workoutId : undefined,
      date: s.date,
      durationSeconds:
        typeof s.durationSeconds === 'number' ? s.durationSeconds : 0,
      exercises: s.exercises as SessionExercise[],
      notes: typeof s.notes === 'string' ? s.notes : undefined,
    });
  }

  const settings: Partial<UserSettings> = {};
  const importedSettings = backup.settings as Record<string, unknown> | undefined;
  if (importedSettings) {
    if (typeof importedSettings.weightIncrementKg === 'number') {
      settings.weightIncrementKg = importedSettings.weightIncrementKg;
    }
    if (typeof importedSettings.defaultRestSeconds === 'number') {
      settings.defaultRestSeconds = importedSettings.defaultRestSeconds;
    }
    if (typeof importedSettings.timezone === 'string') {
      settings.timezone = importedSettings.timezone;
    }
    if (typeof importedSettings.accentColor === 'string') {
      settings.accentColor = importedSettings.accentColor;
    }
  }

  return {
    customExercises: newCustom,
    workouts,
    sessions,
    settings,
    report: {
      customExercisesCreated: newCustom.length,
      workoutsImported: workouts.length,
      sessionsImported: sessions.length,
      warnings,
    },
  };
}
