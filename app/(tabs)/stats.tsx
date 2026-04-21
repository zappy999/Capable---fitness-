import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/WorkoutStore';
import type { BodyweightEntry, WorkoutSession } from '../../src/store/types';
import { LineChart, type ChartPoint } from '../../src/components/LineChart';
import {
  computeAchievementStatus,
  longestStreak,
  type AchievementStatus,
} from '../../src/lib/achievements';

const LIME = '#C6F24E';
const NEON = '#22C55E';

function mondayISO(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function sessionVolume(s: WorkoutSession) {
  let v = 0;
  for (const e of s.exercises) {
    for (const st of e.sets) v += st.weight * st.reps;
  }
  return v;
}

type WeekBucket = { weekStart: string; volume: number; count: number };

function buildWeeks(sessions: WorkoutSession[], weeks: number): WeekBucket[] {
  const thisMonday = mondayISO(new Date().toISOString().slice(0, 10));
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({
      weekStart: addDaysISO(thisMonday, -i * 7),
      volume: 0,
      count: 0,
    });
  }
  const bucketMap = new Map(buckets.map((b) => [b.weekStart, b]));
  for (const s of sessions) {
    const wk = mondayISO(s.date);
    const bucket = bucketMap.get(wk);
    if (!bucket) continue;
    bucket.volume += sessionVolume(s);
    bucket.count += 1;
  }
  return buckets;
}

export default function StatsScreen() {
  const {
    programs,
    workouts,
    exercises,
    sessions,
    personalRecords,
    bodyweight,
    mealPlans,
    mealLogs,
  } = useStore();

  const customExercises = exercises.filter((e) => e.isCustom).length;

  const weeks = useMemo(() => buildWeeks(sessions, 8), [sessions]);
  const maxVolume = Math.max(...weeks.map((w) => w.volume), 1);
  const maxCount = Math.max(...weeks.map((w) => w.count), 1);

  const weightPoints = useMemo<ChartPoint[]>(
    () =>
      [...bodyweight]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14)
        .map((b: BodyweightEntry) => ({
          label: b.date.slice(5),
          value: b.weightKg,
        })),
    [bodyweight],
  );

  const streak = useMemo(
    () => longestStreak(Array.from(new Set(sessions.map((s) => s.date)))),
    [sessions],
  );

  const achievements = useMemo(
    () =>
      computeAchievementStatus({
        sessions,
        prs: personalRecords,
        mealPlans,
        mealLogs,
      }),
    [sessions, personalRecords, mealPlans, mealLogs],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            STATS
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 36 }}>
            Progress
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Your training in numbers.
          </Text>
        </View>

        <View className="px-5 mt-5 flex-row gap-3">
          <StatCard
            label="Sessions"
            value={String(sessions.length)}
            icon="time-outline"
          />
          <StatCard
            label="PRs"
            value={String(personalRecords.length)}
            icon="trophy-outline"
          />
        </View>
        <View className="px-5 mt-3 flex-row gap-3">
          <StatCard
            label="Programs"
            value={String(programs.length)}
            icon="albums-outline"
          />
          <StatCard
            label="Workouts"
            value={String(workouts.length)}
            icon="barbell-outline"
          />
        </View>
        <View className="px-5 mt-3 flex-row gap-3">
          <StatCard
            label="Exercises"
            value={String(exercises.length)}
            icon="list-outline"
          />
          <StatCard
            label="Custom"
            value={String(customExercises)}
            icon="create-outline"
          />
        </View>
        <View className="px-5 mt-3 flex-row gap-3">
          <StatCard
            label="Longest streak"
            value={`${streak}d`}
            icon="flame-outline"
          />
          <StatCard
            label="Meal plans"
            value={String(mealPlans.length)}
            icon="nutrition-outline"
          />
        </View>

        <View className="mx-5 mt-6 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <Text className="text-white text-base font-bold mb-3">Weekly volume</Text>
          <WeekBars
            weeks={weeks}
            valueFor={(w) => w.volume}
            maxValue={maxVolume}
            color={LIME}
            unit="kg"
          />
        </View>

        <View className="mx-5 mt-4 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <Text className="text-white text-base font-bold mb-3">
            Workouts per week
          </Text>
          <WeekBars
            weeks={weeks}
            valueFor={(w) => w.count}
            maxValue={maxCount}
            color={NEON}
            integer
          />
        </View>

        <View className="mx-5 mt-4 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <Text className="text-white text-base font-bold mb-3">
            Bodyweight trend
          </Text>
          <LineChart data={weightPoints} color={LIME} height={180} />
        </View>

        <View className="mx-5 mt-6 mb-2 flex-row items-center justify-between">
          <Text className="text-white text-lg font-bold">Achievements</Text>
          <Text className="text-zinc-500 text-xs">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}{' '}
            unlocked
          </Text>
        </View>
        <View className="px-5 gap-3">
          {achievements.map((a) => (
            <AchievementCard key={a.def.id} achievement={a} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
      <Ionicons name={icon} size={20} color={LIME} />
      <Text className="text-white text-xl font-bold mt-2">{value}</Text>
      <Text className="text-zinc-500 text-xs">{label}</Text>
    </View>
  );
}

function WeekBars({
  weeks,
  valueFor,
  maxValue,
  color,
  unit,
  integer,
}: {
  weeks: WeekBucket[];
  valueFor: (w: WeekBucket) => number;
  maxValue: number;
  color: string;
  unit?: string;
  integer?: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-end justify-between h-24">
        {weeks.map((w) => {
          const v = valueFor(w);
          const pct = (v / maxValue) * 100;
          return (
            <View key={w.weekStart} className="items-center flex-1">
              <View className="h-20 w-full items-center justify-end mb-2">
                <View
                  style={{
                    height: `${Math.max(pct, v > 0 ? 4 : 0)}%`,
                    backgroundColor: v > 0 ? color : '#2A2A2A',
                  }}
                  className="w-7 rounded-t-lg"
                />
              </View>
              <Text className="text-zinc-600 text-[10px] font-medium">
                {w.weekStart.slice(5)}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-zinc-600 text-[10px]">
          max{' '}
          {integer
            ? maxValue
            : unit
              ? `${Math.round(maxValue)}${unit}`
              : Math.round(maxValue)}
        </Text>
      </View>
    </View>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementStatus }) {
  const { def, progress, unlocked } = achievement;
  const pct = Math.min(1, progress / def.target);
  return (
    <View
      className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center"
      style={{ opacity: unlocked ? 1 : 0.7 }}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: unlocked ? def.color + '25' : '#1F1F1F',
        }}
      >
        <Ionicons
          name={def.icon}
          size={22}
          color={unlocked ? def.color : '#71717A'}
        />
      </View>
      <View className="flex-1 ml-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {def.title}
          </Text>
          {unlocked ? (
            <Ionicons name="checkmark-circle" size={14} color={def.color} />
          ) : null}
        </View>
        <Text className="text-zinc-500 text-xs mt-0.5">{def.description}</Text>
        <View className="h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden mt-2">
          <View
            style={{
              height: '100%',
              width: `${pct * 100}%`,
              backgroundColor: def.color,
              borderRadius: 9999,
            }}
          />
        </View>
        <Text className="text-zinc-500 text-xs mt-1">
          {Math.min(progress, def.target)} / {def.target}
        </Text>
      </View>
    </View>
  );
}
