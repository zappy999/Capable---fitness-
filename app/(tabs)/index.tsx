import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUTS, WEEKLY_ACTIVITY } from '../../src/data/workouts';
import { useStore } from '../../src/store/WorkoutStore';

const GREEN = '#22C55E';

function isDueToday(
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom',
  customDays: number[] | undefined,
  weekday: number,
): boolean {
  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') return weekday >= 1 && weekday <= 5;
  if (frequency === 'weekends') return weekday === 0 || weekday === 6;
  return customDays ? customDays.includes(weekday) : false;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    bodyweight,
    mealPlans,
    foods,
    mealLogs,
    toggleMealLog,
    habits,
    habitLogs,
    upsertHabitLog,
    deleteHabitLog,
  } = useStore();
  const todaysWorkout = WORKOUTS[0];
  const totalMinutes = WEEKLY_ACTIVITY.reduce((s, d) => s + d.minutes, 0);
  const activeDays = WEEKLY_ACTIVITY.filter((d) => d.active).length;
  const maxMinutes = Math.max(...WEEKLY_ACTIVITY.map((d) => d.minutes), 1);

  const activePlan = useMemo(
    () => mealPlans.find((p) => p.isActive),
    [mealPlans],
  );

  const today = todayISO();

  const nutrition = useMemo(() => {
    if (!activePlan) return null;
    let planKcal = 0;
    let planP = 0;
    let planC = 0;
    let planF = 0;
    let consumedKcal = 0;
    let consumedP = 0;
    let consumedC = 0;
    let consumedF = 0;
    const loggedSet = new Set(
      mealLogs.filter((l) => l.date === today).map((l) => l.mealId),
    );
    for (const meal of activePlan.meals) {
      let kcal = 0;
      let p = 0;
      let c = 0;
      let f = 0;
      for (const row of meal.rows) {
        const food = foods.find((x) => x.id === row.foodId);
        if (!food) continue;
        const mult = row.amountG / 100;
        kcal += food.kcalPer100g * mult;
        p += food.proteinPer100g * mult;
        c += food.carbsPer100g * mult;
        f += food.fatPer100g * mult;
      }
      planKcal += kcal;
      planP += p;
      planC += c;
      planF += f;
      if (loggedSet.has(meal.id)) {
        consumedKcal += kcal;
        consumedP += p;
        consumedC += c;
        consumedF += f;
      }
    }
    return {
      plan: { kcal: planKcal, p: planP, c: planC, f: planF },
      consumed: { kcal: consumedKcal, p: consumedP, c: consumedC, f: consumedF },
      loggedSet,
    };
  }, [activePlan, foods, mealLogs, today]);

  const weekday = new Date().getDay();
  const todaysHabits = useMemo(
    () =>
      habits
        .filter((h) => !h.archived)
        .filter((h) => isDueToday(h.frequency, h.customDays, weekday))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [habits, weekday],
  );
  const todayHabitLogSet = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of habitLogs) {
      if (l.date === today) map.set(l.habitId, l.id);
    }
    return map;
  }, [habitLogs, today]);

  const weightStats = useMemo(() => {
    const sorted = [...bodyweight].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return null;
    const recent = sorted.slice(-7);
    const avg = recent.reduce((a, b) => a + b.weightKg, 0) / recent.length;
    return {
      latest: sorted[sorted.length - 1].weightKg,
      avg7: Math.round(avg * 10) / 10,
    };
  }, [bodyweight]);

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-zinc-500 text-sm">You are capable of more</Text>
            <Text className="text-white text-2xl font-bold">Alex Morgan</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/settings')}
              className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
            >
              <Ionicons name="settings-outline" size={18} color="#ffffff" />
            </Pressable>
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: GREEN }}>
              <Text className="text-black font-bold text-base">AM</Text>
            </View>
          </View>
        </View>

        {/* Streak Card */}
        <View className="mx-5 mb-4 rounded-3xl overflow-hidden bg-[#141414] border border-[#1F1F1F] p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="flame" size={18} color={GREEN} />
                <Text className="text-zinc-500 text-sm font-semibold" style={{ letterSpacing: 1.2 }}>CURRENT STREAK</Text>
              </View>
              <Text className="text-white text-4xl font-bold">12 days</Text>
              <Text className="text-zinc-500 text-sm mt-1">Keep it up! 3 more for a new record</Text>
            </View>
            <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Text className="text-4xl">🔥</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View className="mt-4 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
            <View className="h-full rounded-full" style={{ width: '80%', backgroundColor: GREEN }} />
          </View>
        </View>

        {/* Stats row */}
        <View className="px-5 flex-row gap-3 mb-5">
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="time-outline" size={20} color={GREEN} />
            <Text className="text-white text-xl font-bold mt-2">{totalMinutes}m</Text>
            <Text className="text-zinc-500 text-xs">This week</Text>
          </View>
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
            <Text className="text-white text-xl font-bold mt-2">{activeDays}/7</Text>
            <Text className="text-zinc-500 text-xs">Active days</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/health')}
            className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] active:opacity-80"
          >
            <Ionicons name="scale-outline" size={20} color={GREEN} />
            <Text className="text-white text-xl font-bold mt-2">
              {weightStats ? `${weightStats.latest}kg` : '—'}
            </Text>
            <Text className="text-zinc-500 text-xs">
              {weightStats ? `7d avg ${weightStats.avg7}kg` : 'Log weight'}
            </Text>
          </Pressable>
        </View>

        {/* Nutrition dashboard */}
        <View className="mx-5 mb-5 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text
                className="text-zinc-500 font-bold"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                TODAY'S NUTRITION
              </Text>
              <Text className="text-white font-bold mt-1" style={{ fontSize: 16 }}>
                {activePlan ? activePlan.name : 'No active plan'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/nutrition')}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 active:opacity-70"
            >
              <Text className="text-white text-xs font-bold">
                {activePlan ? 'Edit' : '+ Plan'}
              </Text>
            </Pressable>
          </View>
          {activePlan && nutrition ? (
            <>
              <View className="gap-2.5 mb-4">
                {activePlan.meals.map((m) => {
                  const checked = nutrition.loggedSet.has(m.id);
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => toggleMealLog(today, m.id)}
                      className="flex-row items-center py-1 active:opacity-70"
                    >
                      <View
                        className="w-6 h-6 rounded-md items-center justify-center mr-3"
                        style={{
                          backgroundColor: checked ? GREEN : 'transparent',
                          borderWidth: 1.5,
                          borderColor: checked ? GREEN : '#3F3F46',
                        }}
                      >
                        {checked ? (
                          <Ionicons name="checkmark" size={14} color="#0A0A0A" />
                        ) : null}
                      </View>
                      <Text
                        className="flex-1 font-semibold"
                        style={{
                          color: checked ? '#71717A' : '#ffffff',
                          fontSize: 14,
                          textDecorationLine: checked ? 'line-through' : 'none',
                        }}
                      >
                        {m.name}
                      </Text>
                      <Text className="text-zinc-500 text-xs">
                        {Math.round(
                          m.rows.reduce((a, r) => {
                            const f = foods.find((x) => x.id === r.foodId);
                            return f ? a + (f.kcalPer100g * r.amountG) / 100 : a;
                          }, 0),
                        )}{' '}
                        kcal
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <MacroBar
                label="Calories"
                value={nutrition.consumed.kcal}
                total={nutrition.plan.kcal}
                color={GREEN}
                unit="kcal"
              />
              <MacroBar
                label="Protein"
                value={nutrition.consumed.p}
                total={nutrition.plan.p}
                color="#F87171"
                unit="g"
              />
              <MacroBar
                label="Carbs"
                value={nutrition.consumed.c}
                total={nutrition.plan.c}
                color="#60A5FA"
                unit="g"
              />
              <MacroBar
                label="Fat"
                value={nutrition.consumed.f}
                total={nutrition.plan.f}
                color="#FBBF24"
                unit="g"
              />
            </>
          ) : (
            <Text className="text-zinc-500 text-sm">
              Create a meal plan and mark it active to see today's macros here.
            </Text>
          )}
        </View>

        {/* Today's habits */}
        <View className="mx-5 mb-5 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text
                className="text-zinc-500 font-bold"
                style={{ fontSize: 11, letterSpacing: 1 }}
              >
                TODAY'S HABITS
              </Text>
              <Text className="text-white font-bold mt-1" style={{ fontSize: 16 }}>
                {todaysHabits.length > 0
                  ? `${todayHabitLogSet.size}/${todaysHabits.length} done`
                  : 'Nothing scheduled'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/habits')}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 active:opacity-70"
            >
              <Text className="text-white text-xs font-bold">Manage</Text>
            </Pressable>
          </View>
          {todaysHabits.length === 0 ? (
            <Text className="text-zinc-500 text-sm">
              No habits scheduled for today. Add one from Manage.
            </Text>
          ) : (
            <View className="gap-2">
              {todaysHabits.map((h) => {
                const logId = todayHabitLogSet.get(h.id);
                const checked = logId !== undefined;
                const color = h.color ?? GREEN;
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => {
                      if (checked && logId) deleteHabitLog(logId);
                      else
                        upsertHabitLog(h.id, today, {
                          value: h.targetValue,
                        });
                    }}
                    className="flex-row items-center py-1 active:opacity-70"
                  >
                    <View
                      className="w-6 h-6 rounded-md items-center justify-center mr-3"
                      style={{
                        backgroundColor: checked ? color : 'transparent',
                        borderWidth: 1.5,
                        borderColor: checked ? color : '#3F3F46',
                      }}
                    >
                      {checked ? (
                        <Ionicons name="checkmark" size={14} color="#0A0A0A" />
                      ) : null}
                    </View>
                    <Text
                      className="flex-1 font-semibold"
                      style={{
                        color: checked ? '#71717A' : '#ffffff',
                        fontSize: 14,
                        textDecorationLine: checked ? 'line-through' : 'none',
                      }}
                    >
                      {h.name}
                    </Text>
                    {h.targetValue ? (
                      <Text className="text-zinc-500 text-xs">
                        {h.targetValue}
                        {h.unit ? ` ${h.unit}` : ''}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Weekly activity */}
        <View className="mx-5 mb-5 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-base font-bold">Weekly Activity</Text>
            <Text className="text-zinc-600 text-xs">Last 7 days</Text>
          </View>
          <View className="flex-row items-end justify-between h-24">
            {WEEKLY_ACTIVITY.map((d) => (
              <View key={d.day} className="items-center flex-1">
                <View className="h-20 w-full items-center justify-end mb-2">
                  <View
                    style={{ height: `${(d.minutes / maxMinutes) * 100}%`, backgroundColor: d.active ? GREEN : '#2A2A2A' }}
                    className="w-7 rounded-t-lg"
                  />
                </View>
                <Text className="text-zinc-600 text-xs font-medium">{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's workout */}
        <View className="px-5 mb-3">
          <Text className="text-white text-lg font-bold">Today's Workout</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">Ready to crush it?</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/workouts/${todaysWorkout.id}`)}
          className="mx-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5 active:opacity-90"
        >
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <View className="self-start px-2.5 py-1 rounded-full mb-2" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                <Text className="text-xs font-semibold" style={{ color: GREEN }}>{todaysWorkout.category}</Text>
              </View>
              <Text className="text-white text-xl font-bold">{todaysWorkout.name}</Text>
              <Text className="text-zinc-500 text-xs mt-1">{todaysWorkout.description}</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: GREEN }}>
              <Ionicons name="play" size={20} color="#000" />
            </View>
          </View>
          <View className="flex-row gap-4 mt-2">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={14} color="#52525B" />
              <Text className="text-zinc-500 text-xs">{todaysWorkout.duration} min</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="flame-outline" size={14} color="#52525B" />
              <Text className="text-zinc-500 text-xs">{todaysWorkout.calories} kcal</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="barbell-outline" size={14} color="#52525B" />
              <Text className="text-zinc-500 text-xs">{todaysWorkout.exerciseCount} exercises</Text>
            </View>
          </View>
        </Pressable>

        {/* Quick start */}
        <View className="px-5 mt-6 mb-3">
          <Text className="text-white text-lg font-bold">Quick Start</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {WORKOUTS.slice(1, 5).map((w) => (
            <Pressable
              key={w.id}
              onPress={() => router.push(`/workouts/${w.id}`)}
              className="w-40 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] active:opacity-80"
            >
              <View
                style={{ backgroundColor: `${w.color}20` }}
                className="w-10 h-10 rounded-xl items-center justify-center mb-3"
              >
                <Ionicons name={w.icon} size={20} color={w.color} />
              </View>
              <Text className="text-white text-sm font-bold" numberOfLines={1}>
                {w.name}
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                {w.duration}min · {w.difficulty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({
  label,
  value,
  total,
  color,
  unit,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  unit: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-zinc-400 text-xs font-semibold">{label}</Text>
        <Text className="text-zinc-500 text-xs">
          {Math.round(value)} / {Math.round(total)} {unit}
        </Text>
      </View>
      <View className="h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
        <View
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            backgroundColor: color,
            borderRadius: 9999,
          }}
        />
      </View>
    </View>
  );
}
