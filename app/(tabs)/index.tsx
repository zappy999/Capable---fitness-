import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUTS, WEEKLY_ACTIVITY } from '../../src/data/workouts';
import { useStore } from '../../src/store/WorkoutStore';
import { longestStreak } from '../../src/lib/achievements';

const GREEN = '#22C55E';

export default function HomeScreen() {
  const router = useRouter();
  const { workouts, sessions } = useStore();
  const todaysWorkout = WORKOUTS[0];
  const totalMinutes = WEEKLY_ACTIVITY.reduce((s, d) => s + d.minutes, 0);
  const activeDays = WEEKLY_ACTIVITY.filter((d) => d.active).length;
  const maxMinutes = Math.max(...WEEKLY_ACTIVITY.map((d) => d.minutes), 1);

  const streak = useMemo(
    () => longestStreak(Array.from(new Set(sessions.map((s) => s.date)))),
    [sessions],
  );

  const firstUserWorkout = workouts[0];

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
              <Text className="text-white text-4xl font-bold">{streak} days</Text>
              <Text className="text-zinc-500 text-sm mt-1">
                {streak === 0 ? 'Log a workout to start a streak.' : 'Keep it up!'}
              </Text>
            </View>
            <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
              <Text className="text-4xl">🔥</Text>
            </View>
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
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="barbell-outline" size={20} color={GREEN} />
            <Text className="text-white text-xl font-bold mt-2">{sessions.length}</Text>
            <Text className="text-zinc-500 text-xs">Sessions</Text>
          </View>
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
          <Text className="text-white text-lg font-bold">
            {firstUserWorkout ? 'Start a workout' : "Today's workout"}
          </Text>
          <Text className="text-zinc-500 text-xs mt-0.5">Ready to crush it?</Text>
        </View>
        {firstUserWorkout ? (
          <Pressable
            onPress={() => router.push(`/workouts/${firstUserWorkout.id}`)}
            className="mx-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5 active:opacity-90"
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{firstUserWorkout.name}</Text>
                <Text className="text-zinc-500 text-xs mt-1">
                  {firstUserWorkout.exercises.length} exercise
                  {firstUserWorkout.exercises.length === 1 ? '' : 's'}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: GREEN }}>
                <Ionicons name="play" size={20} color="#000" />
              </View>
            </View>
          </Pressable>
        ) : (
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
                <Ionicons name="barbell-outline" size={14} color="#52525B" />
                <Text className="text-zinc-500 text-xs">{todaysWorkout.exerciseCount} exercises</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Quick start */}
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
                <Pressable
                  key={w.id}
                  onPress={() => router.push(`/workouts/${w.id}`)}
                  className="w-44 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] active:opacity-80"
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
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
