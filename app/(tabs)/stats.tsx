import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/WorkoutStore';
import { WEEKLY_ACTIVITY } from '../../src/data/workouts';

const LIME = '#C6F24E';
const NEON = '#22C55E';

export default function StatsScreen() {
  const { programs, workouts, exercises } = useStore();
  const totalMinutes = WEEKLY_ACTIVITY.reduce((s, d) => s + d.minutes, 0);
  const activeDays = WEEKLY_ACTIVITY.filter((d) => d.active).length;
  const maxMinutes = Math.max(...WEEKLY_ACTIVITY.map((d) => d.minutes), 1);
  const customExercises = exercises.filter((e) => e.isCustom).length;

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
          <StatCard label="This week" value={`${totalMinutes}m`} icon="time-outline" />
          <StatCard
            label="Active days"
            value={`${activeDays}/7`}
            icon="checkmark-circle-outline"
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

        <View className="mx-5 mt-6 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-base font-bold">Weekly Activity</Text>
            <Text className="text-zinc-600 text-xs">Last 7 days</Text>
          </View>
          <View className="flex-row items-end justify-between h-24">
            {WEEKLY_ACTIVITY.map((d) => (
              <View key={d.day} className="items-center flex-1">
                <View className="h-20 w-full items-center justify-end mb-2">
                  <View
                    style={{
                      height: `${(d.minutes / maxMinutes) * 100}%`,
                      backgroundColor: d.active ? NEON : '#2A2A2A',
                    }}
                    className="w-7 rounded-t-lg"
                  />
                </View>
                <Text className="text-zinc-600 text-xs font-medium">{d.day}</Text>
              </View>
            ))}
          </View>
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
