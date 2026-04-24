import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WEEKLY_ACTIVITY } from '../../src/data/workouts';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { longestStreak } from '../../src/lib/achievements';
import { triggerBackupShare } from '../../src/lib/backup';
import { PressableScale } from '../../src/components/PressableScale';
import {
  COLORS,
  MONO,
  accentAlpha,
} from '../../src/design/tokens';
import {
  Badge,
  CardSm,
  ModernHeader,
  NumMono,
  Stat,
} from '../../src/design/components';

const DAY_MS = 86_400_000;
const BACKUP_STALE_AFTER_DAYS = 30;
const BACKUP_DISMISS_SNOOZE_DAYS = 7;
const BACKUP_MIN_SESSIONS = 5;

function shouldShowBackupNudge(opts: {
  now: number;
  sessionCount: number;
  lastBackupAt: number | null | undefined;
  dismissedAt: number | null | undefined;
}) {
  if (opts.sessionCount < BACKUP_MIN_SESSIONS) return false;
  const staleThreshold = opts.now - BACKUP_STALE_AFTER_DAYS * DAY_MS;
  const backupIsStale =
    !opts.lastBackupAt || opts.lastBackupAt < staleThreshold;
  if (!backupIsStale) return false;
  const snoozeThreshold = opts.now - BACKUP_DISMISS_SNOOZE_DAYS * DAY_MS;
  const snoozeExpired =
    !opts.dismissedAt || opts.dismissedAt < snoozeThreshold;
  return snoozeExpired;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function friendlyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - dt.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return `${MONTH_SHORT[m - 1]} ${d}`;
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const store = useStore();
  const {
    workouts,
    sessions,
    programs,
    exercises,
    settings,
    updateSettings,
  } = store;
  const accent = useAccent();

  const showBackupNudge = useMemo(
    () =>
      shouldShowBackupNudge({
        now: Date.now(),
        sessionCount: sessions.length,
        lastBackupAt: settings.lastBackupAt,
        dismissedAt: settings.backupNudgeDismissedAt,
      }),
    [sessions.length, settings.lastBackupAt, settings.backupNudgeDismissedAt],
  );

  const handleBackupNow = async () => {
    const ok = await triggerBackupShare({
      exercises: store.exercises,
      workouts: store.workouts,
      programs: store.programs,
      sessions: store.sessions,
      personalRecords: store.personalRecords,
      settings: store.settings,
    });
    if (ok) {
      updateSettings({ lastBackupAt: Date.now() });
    } else {
      Alert.alert('Export failed', 'Could not share the backup file.');
    }
  };

  const handleDismissBackup = () =>
    updateSettings({ backupNudgeDismissedAt: Date.now() });

  const totalMinutes = WEEKLY_ACTIVITY.reduce((s, d) => s + d.minutes, 0);
  const activeDays = WEEKLY_ACTIVITY.filter((d) => d.active).length;

  const streak = useMemo(
    () => longestStreak(Array.from(new Set(sessions.map((s) => s.date)))),
    [sessions],
  );

  const suggestion = useMemo(() => {
    const activeProgram = programs.find((p) => p.isActive) ?? null;
    if (activeProgram) {
      const programWorkouts = activeProgram.workoutIds
        .map((id) => workouts.find((w) => w.id === id))
        .filter((w): w is (typeof workouts)[number] => Boolean(w));
      if (programWorkouts.length > 0) {
        const inProgram = new Set(programWorkouts.map((w) => w.id));
        let lastDoneId: string | null = null;
        let lastDoneDate: string | null = null;
        for (let i = sessions.length - 1; i >= 0; i--) {
          const s = sessions[i];
          if (s.workoutId && inProgram.has(s.workoutId)) {
            lastDoneId = s.workoutId;
            lastDoneDate = s.date;
            break;
          }
        }
        if (lastDoneId) {
          const idx = programWorkouts.findIndex((w) => w.id === lastDoneId);
          const next = programWorkouts[(idx + 1) % programWorkouts.length];
          return {
            kind: 'program-next' as const,
            program: activeProgram,
            workout: next,
            lastDoneName: programWorkouts[idx].name,
            lastDoneDate,
          };
        }
        return {
          kind: 'program-first' as const,
          program: activeProgram,
          workout: programWorkouts[0],
          lastDoneName: null,
          lastDoneDate: null,
        };
      }
    }
    const mostRecentUser = [...workouts].sort(
      (a, b) => b.createdAt - a.createdAt,
    )[0];
    if (mostRecentUser) {
      return {
        kind: 'recent' as const,
        program: null,
        workout: mostRecentUser,
        lastDoneName: null,
        lastDoneDate: null,
      };
    }
    return { kind: 'empty' as const } as const;
  }, [programs, workouts, sessions]);

  const activeProgramWorkouts = useMemo(() => {
    const active = programs.find((p) => p.isActive);
    if (!active) return [] as typeof workouts;
    return active.workoutIds
      .map((wid) => workouts.find((w) => w.id === wid))
      .filter((w): w is (typeof workouts)[number] => Boolean(w));
  }, [programs, workouts]);

  const recentSessions = useMemo(() => {
    const withMuscle = sessions
      .slice(-5)
      .reverse()
      .map((s) => {
        const firstExId = s.exercises[0]?.exerciseId;
        const ex = firstExId ? exercises.find((e) => e.id === firstExId) : null;
        const muscle = ex?.category ?? undefined;
        const volume = s.exercises.reduce(
          (acc, se) =>
            acc +
            se.sets.reduce(
              (a, set) => a + (set.weight ?? 0) * (set.reps ?? 0),
              0,
            ),
          0,
        );
        const setCount = s.exercises.reduce((a, e) => a + e.sets.length, 0);
        return {
          id: s.id,
          name: s.workoutName,
          date: friendlyDate(s.date),
          duration: Math.round(s.durationSeconds / 60),
          volume,
          setCount,
          muscle,
        };
      });
    return withMuscle.slice(0, 3);
  }, [sessions, exercises]);

  const empty = sessions.length === 0 && workouts.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ModernHeader
          eyebrow="Capable"
          title={
            empty ? 'Ready when\nyou are.' : `${timeOfDayGreeting()}.`
          }
          badge={sessions.length > 0 ? 'Live' : undefined}
          accent={accent}
          onAction={() => router.push('/settings')}
        />

        {showBackupNudge ? (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 12,
              padding: 16,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#2A1F0A',
              borderWidth: 1,
              borderColor: '#EAB30855',
            }}
          >
            <Ionicons name="cloud-upload-outline" size={22} color="#EAB308" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{ color: COLORS.text, fontWeight: '700', fontSize: 14 }}
              >
                Back up your data
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {settings.lastBackupAt
                  ? "It's been over a month since your last backup."
                  : "You haven't backed up yet. Save a copy of your progress."}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <PressableScale
                  onPress={handleBackupNow}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#EAB308' }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#0A0A0A',
                    }}
                  >
                    Back up now
                  </Text>
                </PressableScale>
                <PressableScale
                  onPress={handleDismissBackup}
                  className="px-3 py-1.5 rounded-lg bg-white/5"
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: COLORS.muted,
                    }}
                  >
                    Later
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        ) : null}

        {/* Streak card with WeekDots */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 24,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 6,
              }}
            >
              <Ionicons name="flame" size={16} color={accent} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: COLORS.subtle,
                  letterSpacing: 0.5,
                }}
              >
                Current streak
              </Text>
            </View>
            <NumMono
              style={{
                fontSize: 34,
                fontWeight: '800',
                letterSpacing: -1.2,
                color: COLORS.text,
              }}
            >
              {streak}
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: COLORS.muted,
                }}
              >
                {' '}days
              </Text>
            </NumMono>
            <Text style={{ fontSize: 13, color: COLORS.subtle, marginTop: 2 }}>
              {streak === 0
                ? 'Log a workout to start a streak.'
                : 'Keep it up.'}
            </Text>
          </View>
          <WeekDots accent={accent} />
        </View>

        {/* Quick stats */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <Stat
            icon="time-outline"
            value={`${totalMinutes}`}
            suffix="m"
            label="This week"
            accent={accent}
          />
          <Stat
            icon="calendar-outline"
            value={`${activeDays}/7`}
            label="Active days"
            accent={accent}
          />
          <Stat
            icon="barbell-outline"
            value={sessions.length}
            label="Sessions"
            accent={accent}
          />
        </View>

        {/* Up next */}
        {suggestion.kind !== 'empty' ? (
          <>
            <View
              style={{
                paddingHorizontal: 20,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: COLORS.text,
                  letterSpacing: -0.2,
                }}
              >
                {suggestion.kind === 'program-next' ? 'Up next' : 'Start a workout'}
              </Text>
              {suggestion.kind === 'program-next' && suggestion.lastDoneDate ? (
                <Text style={{ fontSize: 12, color: COLORS.subtle }}>
                  After {suggestion.lastDoneName} · {friendlyDate(suggestion.lastDoneDate)}
                </Text>
              ) : null}
            </View>
            <PressableScale
              onPress={() => router.push(`/workouts/${suggestion.workout.id}`)}
              style={{
                marginHorizontal: 20,
                marginBottom: 20,
                borderRadius: 24,
                padding: 20,
                backgroundColor: COLORS.surface,
                borderWidth: suggestion.program ? 1.5 : 1,
                borderColor: suggestion.program
                  ? accentAlpha(accent, 0.55)
                  : COLORS.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  {suggestion.program ? (
                    <Badge accent={accent} style={{ marginBottom: 10 }}>
                      {suggestion.program.name.toUpperCase()}
                    </Badge>
                  ) : null}
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: '800',
                      color: COLORS.text,
                      letterSpacing: -0.5,
                      marginTop: 8,
                      marginBottom: 2,
                    }}
                  >
                    {suggestion.workout.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: COLORS.subtle }}>
                    {suggestion.workout.exercises.length} exercise
                    {suggestion.workout.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: COLORS.text,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="play"
                    size={18}
                    color={COLORS.onAccent}
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>

              {/* Exercise preview row */}
              {suggestion.workout.exercises.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 10,
                    paddingTop: 14,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.borderSoft,
                  }}
                >
                  {suggestion.workout.exercises.slice(0, 5).map((we, i) => {
                    const ex = exercises.find((e) => e.id === we.exerciseId);
                    return (
                      <View
                        key={`${we.exerciseId}-${i}`}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        {i > 0 ? (
                          <Text
                            style={{
                              color: COLORS.ghost,
                              marginRight: 10,
                              fontSize: 12,
                            }}
                          >
                            ·
                          </Text>
                        ) : null}
                        <Text style={{ fontSize: 12, color: COLORS.muted }}>
                          {ex?.name ?? 'Exercise'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </PressableScale>
          </>
        ) : null}

        {/* Recent sessions */}
        {recentSessions.length > 0 ? (
          <>
            <View
              style={{
                paddingHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: COLORS.text,
                  letterSpacing: -0.2,
                }}
              >
                Recent sessions
              </Text>
            </View>
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {recentSessions.map((s) => (
                <CardSm
                  key={s.id}
                  muscle={s.muscle}
                  onPress={() => router.push(`/sessions/${s.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: COLORS.bg,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="barbell-outline" size={18} color={accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: COLORS.text,
                      }}
                    >
                      {s.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: COLORS.subtle,
                        marginTop: 2,
                      }}
                    >
                      {s.date} · {s.duration}m ·{' '}
                      <Text style={{ fontFamily: MONO }}>
                        {s.volume.toLocaleString()}
                      </Text>
                      kg
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.ghost}
                  />
                </CardSm>
              ))}
            </View>
          </>
        ) : null}

        {/* Your workouts — from active program */}
        {activeProgramWorkouts.length > 0 ? (
          <>
            <View
              style={{
                paddingHorizontal: 20,
                marginTop: 24,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: COLORS.text,
                  letterSpacing: -0.2,
                }}
              >
                Your workouts
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.subtle }}>
                From active program
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {activeProgramWorkouts.slice(0, 8).map((w) => (
                <PressableScale
                  key={w.id}
                  onPress={() => router.push(`/workouts/${w.id}`)}
                  style={{
                    width: 170,
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: COLORS.surface,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      marginBottom: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: accentAlpha(accent, 0.133),
                    }}
                  >
                    <Ionicons name="barbell" size={18} color={accent} />
                  </View>
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}
                    numberOfLines={1}
                  >
                    {w.name}
                  </Text>
                  <Text
                    style={{ fontSize: 11, color: COLORS.subtle, marginTop: 2 }}
                  >
                    {w.exercises.length} exercise
                    {w.exercises.length === 1 ? '' : 's'}
                  </Text>
                </PressableScale>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekDots({ accent }: { accent: string }) {
  return (
    <View
      style={{
        width: 84,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
      }}
    >
      {WEEKLY_ACTIVITY.map((d, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 28,
            borderRadius: 3,
            backgroundColor: d.active
              ? accentAlpha(accent, 0.3 + (Math.min(d.minutes, 80) / 80) * 0.7)
              : '#1F1F1F',
          }}
        />
      ))}
      <View
        style={{
          width: 84,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        {WEEKLY_ACTIVITY.map((d, i) => (
          <Text
            key={i}
            style={{
              fontSize: 8,
              color: COLORS.faint,
              width: 10,
              textAlign: 'center',
            }}
          >
            {d.day[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}
