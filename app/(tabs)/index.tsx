import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUTS, WEEKLY_ACTIVITY } from '../../src/data/workouts';

const GREEN = '#22C55E';

export default function HomeScreen() {
  const router = useRouter();
  const todaysWorkout = WORKOUTS[0];
  const totalMinutes = WEEKLY_ACTIVITY.reduce((s, d) => s + d.minutes, 0);
  const activeDays = WEEKLY_ACTIVITY.filter((d) => d.active).length;
  const maxMinutes = Math.max(...WEEKLY_ACTIVITY.map((d) => d.minutes), 1);

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-zinc-500 text-sm">You are capable of more</Text>
            <Text className="text-white text-2xl font-bold">Alex Morgan</Text>
          </View>
          <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: GREEN }}>
            <Text className="text-black font-bold text-base">AM</Text>
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
          <View className="flex-1 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <Ionicons name="trending-up-outline" size={20} color={GREEN} />
            <Text className="text-white text-xl font-bold mt-2">2,350</Text>
            <Text className="text-zinc-500 text-xs">Calories</Text>
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
          <Text className="text-white text-lg font-bold">Today's Workout</Text>
          <Text className="text-zinc-500 text-xs mt-0.5">Ready to crush it?</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/workout/${todaysWorkout.id}`)}
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
              onPress={() => router.push(`/workout/${w.id}`)}
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
