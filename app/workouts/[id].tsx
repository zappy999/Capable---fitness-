import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WORKOUTS as DEMO_WORKOUTS } from '../../src/data/workouts';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import { isSafeHttpUrl, openExternalUrl } from '../../src/lib/platform';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workouts, exercises, deleteWorkout } = useStore();
  const LIME = useAccent();
  const NEON = LIME;

  const userWorkout = workouts.find((w) => w.id === id);
  const demoWorkout = DEMO_WORKOUTS.find((w) => w.id === id);

  if (!userWorkout && !demoWorkout) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <Text className="text-zinc-500">Workout not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10"
        >
          <Text className="text-white font-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    if (!userWorkout) return;
    Alert.alert(
      `Delete "${userWorkout.name}"?`,
      'This removes the workout from any program that includes it. Logged sessions stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteWorkout(userWorkout.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </Pressable>
        {userWorkout ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={() =>
                router.push({ pathname: '/workouts/new', params: { id: userWorkout.id } })
              }
              className="px-4 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70 flex-row"
            >
              <Ionicons name="create-outline" size={14} color="#ffffff" />
              <Text className="text-white font-bold ml-1.5" style={{ fontSize: 13 }}>
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
            >
              <Ionicons name="trash-outline" size={16} color="#F87171" />
            </Pressable>
          </View>
        ) : (
          <Pressable className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70">
            <Ionicons name="heart-outline" size={16} color="#ffffff" />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {userWorkout ? (
          <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
            <Text
              className="font-bold text-black/70"
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              WORKOUT
            </Text>
            <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
              {userWorkout.name}
            </Text>
            <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
              {userWorkout.exercises.length} exercise
              {userWorkout.exercises.length === 1 ? '' : 's'}
            </Text>
          </View>
        ) : demoWorkout ? (
          <View
            style={{ backgroundColor: demoWorkout.color }}
            className="mx-5 mt-2 rounded-3xl p-6"
          >
            <View className="bg-white/20 self-start px-2.5 py-1 rounded-full mb-3">
              <Text className="text-white text-xs font-semibold">
                {demoWorkout.category}
              </Text>
            </View>
            <Text className="text-white text-3xl font-bold mb-1">
              {demoWorkout.name}
            </Text>
            <Text className="text-white/80 text-sm mb-4">
              {demoWorkout.description}
            </Text>
            <View className="flex-row gap-6">
              <View>
                <Text className="text-white/70 text-xs">Duration</Text>
                <Text className="text-white text-lg font-bold">
                  {demoWorkout.duration}m
                </Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs">Calories</Text>
                <Text className="text-white text-lg font-bold">
                  {demoWorkout.calories}
                </Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs">Level</Text>
                <Text className="text-white text-lg font-bold">
                  {demoWorkout.difficulty}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="px-5 mt-6 mb-3 flex-row items-center justify-between">
          <Text className="text-white text-lg font-bold">Exercises</Text>
        </View>

        <View className="px-5 gap-3">
          {userWorkout
            ? userWorkout.exercises.map((we, idx) => {
                const ex = exercises.find((e) => e.id === we.exerciseId);
                const hasBadges =
                  we.tempo ||
                  we.isDropSet ||
                  we.groupType ||
                  (we.demoUrl && isSafeHttpUrl(we.demoUrl));
                return (
                  <View
                    key={we.id}
                    className="bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-9 h-9 bg-[#1F1F1F] rounded-xl items-center justify-center">
                        <Text className="text-zinc-400 text-sm font-bold">
                          {idx + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-sm font-bold">
                          {ex?.name ?? 'Exercise'}
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">
                          {ex?.category ?? 'Uncategorized'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white text-sm font-bold">
                          {we.sets} × {we.reps}
                        </Text>
                        <Text className="text-zinc-600 text-xs mt-0.5">
                          rest {we.restSeconds}s
                        </Text>
                      </View>
                    </View>
                    {hasBadges ? (
                      <View className="flex-row flex-wrap gap-1.5 mt-3 ml-12">
                        {we.tempo ? (
                          <View className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            <Text className="text-zinc-400 text-xs">
                              tempo {we.tempo}
                            </Text>
                          </View>
                        ) : null}
                        {we.isDropSet ? (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}
                          >
                            <Text
                              className="text-xs font-bold"
                              style={{ color: '#FBBF24' }}
                            >
                              DROP SET
                            </Text>
                          </View>
                        ) : null}
                        {we.groupType ? (
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                          >
                            <Text
                              className="text-xs font-bold"
                              style={{ color: LIME }}
                            >
                              {we.groupType === 'emom'
                                ? `EMOM ${we.emomSeconds ?? ''}s`.trim()
                                : we.groupType.toUpperCase()}
                              {we.supersetGroup ? ` · ${we.supersetGroup}` : ''}
                            </Text>
                          </View>
                        ) : null}
                        {we.demoUrl && isSafeHttpUrl(we.demoUrl) ? (
                          <Pressable
                            onPress={() => openExternalUrl(we.demoUrl!)}
                            className="px-2 py-0.5 rounded-full flex-row items-center active:opacity-70"
                            style={{ backgroundColor: 'rgba(96,165,250,0.15)' }}
                          >
                            <Ionicons
                              name="play-circle-outline"
                              size={12}
                              color="#60A5FA"
                            />
                            <Text
                              className="text-xs font-bold ml-1"
                              style={{ color: '#60A5FA' }}
                            >
                              Demo
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                    {we.note ? (
                      <Text className="text-zinc-500 text-xs mt-2 ml-12 italic">
                        {we.note}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            : demoWorkout?.exercises.map((ex, idx) => (
                <View
                  key={ex.id}
                  className="bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] flex-row items-center gap-3"
                >
                  <View className="w-9 h-9 bg-[#1F1F1F] rounded-xl items-center justify-center">
                    <Text className="text-zinc-400 text-sm font-bold">
                      {idx + 1}
                    </Text>
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
                    <Text className="text-zinc-600 text-xs mt-0.5">
                      rest {ex.rest}
                    </Text>
                  </View>
                </View>
              ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-5 pt-4 pb-8">
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/start-workout',
              params: { id: userWorkout?.id ?? demoWorkout?.id ?? id },
            })
          }
          className="rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-90"
          style={{ backgroundColor: NEON }}
        >
          <Ionicons name="play" size={18} color="#000" />
          <Text className="text-black text-base font-bold">Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
