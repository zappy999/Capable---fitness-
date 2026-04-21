import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/WorkoutStore';
import type {
  BodyweightEntry,
  MealLog,
  MealPlan,
  PersonalRecord,
  WorkoutSession,
} from '../../src/store/types';
import { LineChart, type ChartPoint } from '../../src/components/LineChart';

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

function longestStreak(dates: string[]): number {
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
    () => computeAchievements(sessions, personalRecords, mealPlans, mealLogs, streak),
    [sessions, personalRecords, mealPlans, mealLogs, streak],
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
            <AchievementCard key={a.id} achievement={a} />
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

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

function computeAchievements(
  sessions: WorkoutSession[],
  prs: PersonalRecord[],
  mealPlans: MealPlan[],
  mealLogs: MealLog[],
  streak: number,
): Achievement[] {
  const planCompleteDays = (() => {
    const byDate = new Map<string, Set<string>>();
    for (const l of mealLogs) {
      if (!byDate.has(l.date)) byDate.set(l.date, new Set());
      byDate.get(l.date)!.add(l.mealId);
    }
    let days = 0;
    for (const plan of mealPlans) {
      const ids = plan.meals.map((m) => m.id);
      if (ids.length === 0) continue;
      for (const [, set] of byDate) {
        if (ids.every((id) => set.has(id))) days += 1;
      }
    }
    return days;
  })();

  return [
    make('first_workout', 'First workout', 'Log your first session.', 'flag-outline', NEON, sessions.length, 1),
    make('workouts_10', '10 workouts', 'Build the habit.', 'barbell-outline', '#60A5FA', sessions.length, 10),
    make('workouts_50', '50 workouts', 'Consistency pays off.', 'barbell-outline', '#A78BFA', sessions.length, 50),
    make('workouts_100', '100 workouts', 'Triple digits.', 'barbell-outline', '#FBBF24', sessions.length, 100),
    make('streak_7', '7-day streak', 'Train every day for a week.', 'flame-outline', '#F87171', streak, 7),
    make('streak_30', '30-day streak', 'A full month.', 'flame-outline', '#EC4899', streak, 30),
    make('first_pr', 'First PR', 'Set a new personal record.', 'trophy-outline', LIME, prs.length, 1),
    make('prs_10', '10 PRs', 'Stacking records.', 'trophy-outline', '#10B981', prs.length, 10),
    make('first_plan', 'First meal plan', 'Create your first plan.', 'nutrition-outline', '#60A5FA', mealPlans.length, 1),
    make('plan_complete', 'Plan complete', 'Check off every meal for a day.', 'checkmark-done-outline', NEON, planCompleteDays, 1),
  ];
}

function make(
  id: string,
  title: string,
  description: string,
  icon: Achievement['icon'],
  color: string,
  progress: number,
  target: number,
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    color,
    progress,
    target,
    unlocked: progress >= target,
  };
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const pct = Math.min(1, achievement.progress / achievement.target);
  return (
    <View
      className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center"
      style={{ opacity: achievement.unlocked ? 1 : 0.7 }}
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: achievement.unlocked
            ? achievement.color + '25'
            : '#1F1F1F',
        }}
      >
        <Ionicons
          name={achievement.icon}
          size={22}
          color={achievement.unlocked ? achievement.color : '#71717A'}
        />
      </View>
      <View className="flex-1 ml-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {achievement.title}
          </Text>
          {achievement.unlocked ? (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={achievement.color}
            />
          ) : null}
        </View>
        <Text className="text-zinc-500 text-xs mt-0.5">
          {achievement.description}
        </Text>
        <View className="h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden mt-2">
          <View
            style={{
              height: '100%',
              width: `${pct * 100}%`,
              backgroundColor: achievement.color,
              borderRadius: 9999,
            }}
          />
        </View>
        <Text className="text-zinc-500 text-xs mt-1">
          {Math.min(achievement.progress, achievement.target)} / {achievement.target}
        </Text>
      </View>
    </View>
  );
}
