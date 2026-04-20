import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';

const LIME = '#C6F24E';
const NEON = '#22C55E';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { programs, workouts, setActiveProgram, deleteProgram } = useStore();

  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <SafeAreaView className="flex-1 bg-[#0D0D0D] items-center justify-center">
        <Text className="text-zinc-500">Program not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10"
        >
          <Text className="text-white font-bold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const programWorkouts = program.workoutIds
    .map((wid) => workouts.find((w) => w.id === wid))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const handleDelete = () => {
    deleteProgram(program.id);
    router.back();
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
        <Pressable
          onPress={handleDelete}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="trash-outline" size={16} color="#F87171" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            PROGRAM
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            {program.name}
          </Text>
          <View className="flex-row gap-4 mt-3">
            <Text className="text-black/70 text-sm">
              {programWorkouts.length} workout{programWorkouts.length === 1 ? '' : 's'}
            </Text>
            {program.startDate ? (
              <Text className="text-black/70 text-sm">
                · from {program.startDate}
              </Text>
            ) : null}
            {program.endDate ? (
              <Text className="text-black/70 text-sm">· to {program.endDate}</Text>
            ) : null}
          </View>
          <View className="flex-row gap-2 mt-4">
            {program.isActive ? (
              <Pressable
                onPress={() => setActiveProgram(null)}
                className="px-4 py-2 rounded-full bg-black/80 active:opacity-80"
              >
                <Text
                  className="font-bold"
                  style={{ color: NEON, fontSize: 11, letterSpacing: 1 }}
                >
                  ACTIVE · TAP TO UNSET
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setActiveProgram(program.id)}
                className="px-4 py-2 rounded-full bg-black/80 active:opacity-80"
              >
                <Text
                  className="font-bold text-white"
                  style={{ fontSize: 11, letterSpacing: 1 }}
                >
                  SET ACTIVE
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="px-5 mt-6 mb-3 flex-row items-center justify-between">
          <Text className="text-white font-bold" style={{ fontSize: 20 }}>
            Workouts
          </Text>
          <Pressable
            onPress={() => router.push('/workouts/new')}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 active:opacity-70"
          >
            <Text className="text-white font-bold" style={{ fontSize: 13 }}>
              + New workout
            </Text>
          </Pressable>
        </View>

        {programWorkouts.length === 0 ? (
          <View className="mx-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-8 px-6 items-center">
            <Ionicons name="barbell-outline" size={22} color="#71717A" />
            <Text className="text-white font-bold mt-3" style={{ fontSize: 16 }}>
              No workouts in this program
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              Edit this program to add workouts.
            </Text>
          </View>
        ) : (
          <View className="px-5 gap-3">
            {programWorkouts.map((w, idx) => (
              <Pressable
                key={w.id}
                onPress={() => router.push(`/workouts/${w.id}`)}
                className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center gap-4 active:opacity-80"
              >
                <View className="w-12 h-12 rounded-xl items-center justify-center bg-[#1F1F1F]">
                  <Text
                    className="font-bold"
                    style={{ color: LIME, fontSize: 15 }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                    {w.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {w.exercises.length} exercise
                    {w.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
