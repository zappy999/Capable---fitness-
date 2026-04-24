import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUTS, WEEKLY_ACTIVITY } from '../../src/data/workouts';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { longestStreak } from '../../src/lib/achievements';
import { triggerBackupShare } from '../../src/lib/backup';
import { PressableScale } from '../../src/components/PressableScale';
import { AnimatedNumber } from '../../src/components/AnimatedNumber';

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
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
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

export default function HomeScreen() {
  const router = useRouter();
  const store = useStore();
  const { workouts, sessions, programs, settings, updateSettings } = store;
  const GREEN = useAccent();
  const showBackupNudge = useMemo(
    () =>
      shouldShowBackupNudge({
        now: Date.now(),
        sessionCount: sessions.length,
        lastBackupAt: settings.lastBackupAt,
        dismissedAt: settings.backupNudgeDismissedAt,
      }),
    [
      sessions.length,
      settings.lastBackupAt,
      settings.backupNudgeDismissedAt,
    ],
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
  const todaysWorkout = WORKOUTS[0];
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

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mx-5 mt-2 mb-4 rounded-3xl p-6" style={{ backgroundColor: GREEN }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-black font-bold" style={{ fontSize: 36 }}>
                Capable
              </Text>
              <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
                Workout Tracker
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/settings')}
              className="w-10 h-10 rounded-2xl items-center justify-center bg-black/20 active:opacity-70"
            >
              <Ionicons name="settings-sharp" size={18} color="#0A0A0A" />
            </Pressable>
          </View>
        </View>

        {showBackupNudge ? (
          <View
            className="mx-5 mb-4 rounded-3xl p-4 flex-row items-center"
            style={{
              backgroundColor: '#2A1F0A',
              borderWidth: 1,
              borderColor: '#EAB30855',
            }}
          >
            <Ionicons name="cloud-upload-outline" size={22} color="#EAB308" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 14 }}>
                Back up your data
              </Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                {settings.lastBackupAt
                  ? "It's been over a month since your last backup."
                  : "You haven't backed up yet. Save a copy of your progress."}
              </Text>
              <View className="flex-row gap-2 mt-2">
                <PressableScale
                  onPress={handleBackupNow}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#EAB308' }}
                >
                  <Text
                    className="font-bold text-black"
                    style={{ fontSize: 12 }}
                  >
                    Back up now
                  </Text>
                </PressableScale>
                <PressableScale
                  onPress={handleDismissBackup}
                  className="px-3 py-1.5 rounded-lg bg-white/5"
                >
                  <Text
                    className="font-semibold text-zinc-400"
                    style={{ fontSize: 12 }}
                  >
                    Later
                  </Text>
                </PressableScale>
              </View>
            </View>
          </View>
        ) : null}

        <View className="mx-5 mb-4 rounded-3xl overflow-hidden bg-[#141414] border border-[#1F1F1F] p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="flame" size={18} color={GREEN} />
                <Text className="text-zinc-500 text-sm font-semibold" style={{ letterSpacing: 1.2 }}>CURRENT STREAK</Text>
              </View>
              <AnimatedNumber
                value={streak}
                className="text-white text-4xl font-bold"
                format={(n) => `${n} days`}
              />
              <Text className="text-zinc-500 text-sm mt-1">
                {streak === 0 ? 'Log a workout to start a streak.' : 'Keep it up!'}
              </Text>
            </View>
            <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Text className="text-4xl">🔥</Text>
            </View>
          </View>
        </View>

        <View className="px-5 flex-row gap-3 mb-5">
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="time-outline" size={20} color={GREEN} />
            <AnimatedNumber
              value={totalMinutes}
              className="text-white text-xl font-bold mt-2"
              format={(n) => `${n}m`}
            />
            <Text className="text-zinc-500 text-xs">This week</Text>
          </View>
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="checkmark-circle-outline" size={20} color={GREEN} />
            <AnimatedNumber
              value={activeDays}
              className="text-white text-xl font-bold mt-2"
              format={(n) => `${n}/7`}
            />
            <Text className="text-zinc-500 text-xs">Active days</Text>
          </View>
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="barbell-outline" size={20} color={GREEN} />
            <AnimatedNumber
              value={sessions.length}
              className="text-white text-xl font-bold mt-2"
            />
            <Text className="text-zinc-500 text-xs">Sessions</Text>
          </View>
        </View>

        {suggestion.kind === 'empty' ? (
          <>
            <View className="px-5 mb-3">
              <Text className="text-white text-lg font-bold">Today's workout</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                Ready to crush it?
              </Text>
            </View>
            <PressableScale
              onPress={() => router.push(`/workouts/${todaysWorkout.id}`)}
              className="mx-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5"
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <View
                    className="self-start px-2.5 py-1 rounded-full mb-2"
                    style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: GREEN }}
                    >
                      {todaysWorkout.category}
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold">
                    {todaysWorkout.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">
                    {todaysWorkout.description}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: GREEN }}
                >
                  <Ionicons name="play" size={20} color="#000" />
                </View>
              </View>
            </PressableScale>
          </>
        ) : (
          <>
            <View className="px-5 mb-3">
              <Text className="text-white text-lg font-bold">
                {suggestion.kind === 'program-next' ? 'Up next' : 'Start a workout'}
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                {suggestion.kind === 'program-next'
                  ? `After ${suggestion.lastDoneName}${suggestion.lastDoneDate ? ` · ${friendlyDate(suggestion.lastDoneDate)}` : ''}`
                  : suggestion.kind === 'program-first'
                    ? 'First workout in your active program.'
                    : 'Pick up where you left off.'}
              </Text>
            </View>
            <PressableScale
              onPress={() => router.push(`/workouts/${suggestion.workout.id}`)}
              className="mx-5 bg-[#141414] rounded-3xl p-5"
              style={{
                borderWidth: 1,
                borderColor: suggestion.program ? `${GREEN}55` : '#1F1F1F',
              }}
            >
              <View className="flex-row items-start justify-between mb-1">
                <View className="flex-1 pr-3">
                  {suggestion.program ? (
                    <View
                      className="self-start px-2.5 py-1 rounded-full mb-2"
                      style={{ backgroundColor: `${GREEN}22` }}
                    >
                      <Text
                        className="font-bold"
                        style={{
                          color: GREEN,
                          fontSize: 10,
                          letterSpacing: 1,
                        }}
                      >
                        {suggestion.program.name.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <Text className="text-white text-xl font-bold">
                    {suggestion.workout.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">
                    {suggestion.workout.exercises.length} exercise
                    {suggestion.workout.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: GREEN }}
                >
                  <Ionicons name="play" size={20} color="#000" />
                </View>
              </View>
            </PressableScale>
          </>
        )}

        {workouts.length > 1 ? (
          <>
            <View className="px-5 mt-6 mb-3">
              <Text className="text-white text-lg font-bold">Your workouts</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {workouts.slice(0, 8).map((w) => (
                <PressableScale
                  key={w.id}
                  onPress={() => router.push(`/workouts/${w.id}`)}
                  className="w-44 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]"
                >
                  <View
                    style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                  >
                    <Ionicons name="barbell" size={20} color={GREEN} />
                  </View>
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}
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
