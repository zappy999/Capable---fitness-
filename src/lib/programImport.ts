import type { Exercise } from '../store/types';

export type ImportedExercise = {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo?: string;
  note?: string;
};

export type ImportedWorkout = {
  name: string;
  exercises: ImportedExercise[];
};

export type ImportedProgram = {
  name: string;
  phase?: string;
  durationWeeks?: number;
  restDays?: number;
  workouts: ImportedWorkout[];
};

export const PROMPT_TEMPLATE = `You are converting a training program from a coach into strict JSON for a workout app.

Return ONLY the JSON object. No markdown fences, no commentary. Use this exact schema:

{
  "name": "string",
  "phase": "string",
  "durationWeeks": 0,
  "restDays": 0,
  "workouts": [
    {
      "name": "string",
      "exercises": [
        {
          "name": "string",
          "sets": 0,
          "reps": "string",
          "restSeconds": 0,
          "tempo": "string",
          "note": "string"
        }
      ]
    }
  ]
}

Rules:
- "reps" is a string so ranges like "8-10" and "AMRAP" are fine.
- "restSeconds" is an integer in seconds.
- Omit "phase", "durationWeeks", "restDays", "tempo", "note" if not mentioned.
- Use common exercise names (e.g. "Bench Press", "Rope Pushdown"). Don't abbreviate.

Program to convert:

<PASTE PROGRAM BELOW>`;

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'for',
  'on',
  'in',
  'with',
  'and',
  '&',
  'to',
  '-',
]);

const SYNONYMS: Record<string, string> = {
  bb: 'barbell',
  db: 'dumbbell',
  kb: 'kettlebell',
  dbs: 'dumbbell',
  bbs: 'barbell',
  sa: 'singlearm',
  'single-arm': 'singlearm',
  pulldowns: 'pulldown',
  pushdowns: 'pushdown',
  rows: 'row',
  raises: 'raise',
  curls: 'curl',
  extensions: 'extension',
  presses: 'press',
  squats: 'squat',
  lunges: 'lunge',
  flies: 'fly',
  flys: 'fly',
  triceps: 'tricep',
  biceps: 'bicep',
  lats: 'lat',
  abs: 'ab',
  delts: 'delt',
  glutes: 'glute',
  quads: 'quad',
  hamstrings: 'hamstring',
};

function normalizeToken(raw: string): string {
  const lowered = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!lowered) return '';
  if (SYNONYMS[lowered]) return SYNONYMS[lowered];
  if (lowered.length >= 4 && lowered.endsWith('s') && !lowered.endsWith('ss')) {
    const singular = lowered.slice(0, -1);
    if (SYNONYMS[singular]) return SYNONYMS[singular];
    return singular;
  }
  return lowered;
}

function tokenize(name: string): string[] {
  const raw = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  return raw
    .split(/\s+/)
    .map(normalizeToken)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

export function normalizeName(name: string): Set<string> {
  return new Set(tokenize(name));
}

function compactForm(name: string): string {
  return tokenize(name).sort().join('');
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return inter / union;
}

export type ExerciseMatch = {
  sourceName: string;
  matched: Exercise | null;
  score: number;
};

const MATCH_THRESHOLD = 0.55;

export function matchExercise(
  sourceName: string,
  library: Exercise[],
): ExerciseMatch {
  const src = normalizeName(sourceName);
  if (src.size === 0) return { sourceName, matched: null, score: 0 };

  // Short-circuit on exact compact-form match (e.g. "Lat Pull-downs" == "Lat Pulldown").
  const srcCompact = compactForm(sourceName);
  if (srcCompact.length > 0) {
    for (const ex of library) {
      if (compactForm(ex.name) === srcCompact) {
        return { sourceName, matched: ex, score: 1 };
      }
    }
  }

  let best: Exercise | null = null;
  let bestScore = 0;
  for (const ex of library) {
    const candidate = normalizeName(ex.name);
    const score = jaccard(src, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  if (bestScore >= MATCH_THRESHOLD) {
    return { sourceName, matched: best, score: bestScore };
  }
  return { sourceName, matched: null, score: bestScore };
}

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asOptionalString(v: unknown): string | undefined {
  const s = asString(v).trim();
  return s.length > 0 ? s : undefined;
}

export function parseImportedProgram(raw: unknown): ImportedProgram {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Expected a JSON object at the top level.');
  }
  const r = raw as Record<string, unknown>;
  const name = asString(r.name).trim();
  if (!name) throw new Error('Program "name" is required.');
  const workoutsRaw = Array.isArray(r.workouts) ? r.workouts : null;
  if (!workoutsRaw) throw new Error('"workouts" must be an array.');
  if (workoutsRaw.length === 0) throw new Error('At least one workout is required.');

  const workouts: ImportedWorkout[] = workoutsRaw.map((w, i) => {
    if (!w || typeof w !== 'object') {
      throw new Error(`Workout #${i + 1} is not an object.`);
    }
    const wr = w as Record<string, unknown>;
    const wName = asString(wr.name).trim() || `Workout ${i + 1}`;
    const exRaw = Array.isArray(wr.exercises) ? wr.exercises : [];
    const exercises: ImportedExercise[] = exRaw
      .map((e): ImportedExercise | null => {
        if (!e || typeof e !== 'object') return null;
        const er = e as Record<string, unknown>;
        const exName = asString(er.name).trim();
        if (!exName) return null;
        return {
          name: exName,
          sets: Math.max(1, Math.round(asNumber(er.sets, 3))),
          reps: asString(er.reps).trim() || '8-10',
          restSeconds: Math.max(0, Math.round(asNumber(er.restSeconds, 90))),
          tempo: asOptionalString(er.tempo),
          note: asOptionalString(er.note),
        };
      })
      .filter((x): x is ImportedExercise => x !== null);

    return { name: wName, exercises };
  });

  return {
    name,
    phase: asOptionalString(r.phase),
    durationWeeks: r.durationWeeks != null ? asNumber(r.durationWeeks, 0) : undefined,
    restDays: r.restDays != null ? asNumber(r.restDays, 0) : undefined,
    workouts,
  };
}

// Module-level handoff between the import and review screens; cleared after use.
let staged: ImportedProgram | null = null;

export function stageImport(p: ImportedProgram) {
  staged = p;
}

export function takeStagedImport(): ImportedProgram | null {
  return staged;
}

export function clearStagedImport() {
  staged = null;
}
