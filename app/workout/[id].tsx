import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WORKOUTS } from '../../src/data/workouts';

const GREEN = '#22C55E';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = WORKOUTS.find((w) => w.id === id);

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <Text className="text-zinc-500">Workout not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 bg-[#141414] rounded-full items-center justify-center border border-[#1F1F1F] active:opacity-70"
          >
            <Ionicons name="chevron-back" size={20} color="#ffffff" />
          </Pressable>
          <Pressable className="w-10 h-10 bg-[#141414] rounded-full items-center justify-center border border-[#1F1F1F] active:opacity-70">
            <Ionicons name="heart-outline" size={18} color="#ffffff" />
          </Pressable>
        </View>

        {/* Hero */}
        <View
          style={{ backgroundColor: workout.color }}
          className="mx-5 rounded-3xl p-6 mb-5"
        >
          <View className="bg-white/20 self-start px-2.5 py-1 rounded-full mb-3">
            <Text className="text-white text-xs font-semibold">{workout.category}</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-1">{workout.name}</Text>
          <Text className="text-white/80 text-sm mb-4">{workout.description}</Text>

          <View className="flex-row gap-6">
            <View>
              <Text className="text-white/70 text-xs">Duration</Text>
              <Text className="text-white text-lg font-bold">{workout.duration}m</Text>
            </View>
            <View>
              <Text className="text-white/70 text-xs">Calories</Text>
              <Text className="text-white text-lg font-bold">{workout.calories}</Text>
            </View>
            <View>
              <Text className="text-white/70 text-xs">Level</Text>
              <Text className="text-white text-lg font-bold">{workout.difficulty}</Text>
            </View>
          </View>
        </View>

        {/* Exercises */}
        <View className="px-5 mb-3 flex-row items-center justify-between">
          <Text className="text-white text-lg font-bold">
            Exercises ({workout.exercises.length})
          </Text>
          <Text className="text-zinc-600 text-xs">Tap to preview</Text>
        </View>

        <View className="px-5 gap-3">
          {workout.exercises.map((ex, idx) => (
            <Pressable
              key={ex.id}
              className="bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] flex-row items-center gap-3 active:opacity-80"
            >
              <View className="w-9 h-9 bg-[#1F1F1F] rounded-xl items-center justify-center">
                <Text className="text-zinc-400 text-sm font-bold">{idx + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-bold">{ex.name}</Text>
                <View className="flex-row gap-2 mt-1 flex-wrap">
                  <Text className="text-zinc-500 text-xs">{ex.muscle}</Text>
                  <Text className="text-zinc-700 text-xs">·</Text>
                  <Text className="text-zinc-500 text-xs">{ex.equipment}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white text-sm font-bold">
                  {ex.sets} × {ex.reps}
                </Text>
                <Text className="text-zinc-600 text-xs mt-0.5">rest {ex.rest}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Start button */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-5 pt-4 pb-8">
        <Pressable
          onPress={() => router.push('/start-workout')}
          className="rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <Ionicons name="play" size={18} color="#000" />
          <Text className="text-black text-base font-bold">Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
