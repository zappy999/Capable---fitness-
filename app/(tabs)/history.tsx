import { View, Text, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HISTORY } from '../../src/data/workouts';

const GREEN = '#22C55E';

export default function HistoryScreen() {
  const totalWorkouts = HISTORY.length;
  const totalMinutes = HISTORY.reduce((s, h) => s + h.duration, 0);
  const totalCalories = HISTORY.reduce((s, h) => s + h.calories, 0);
  const totalVolume = HISTORY.reduce((s, h) => s + h.volume, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <FlatList
        data={HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View className="px-5 pt-2 pb-4">
              <Text className="text-white text-3xl font-bold">History</Text>
              <Text className="text-zinc-500 text-sm mt-1">Your progress over time</Text>
            </View>

            {/* Summary card */}
            <View className="mx-5 mb-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
              <Text className="text-zinc-600 text-xs font-semibold uppercase mb-4" style={{ letterSpacing: 1.2 }}>
                Last 30 Days
              </Text>
              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <Text className="text-white text-2xl font-bold">{totalWorkouts}</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Workouts</Text>
                </View>
                <View className="w-1/2 mb-4">
                  <Text className="text-white text-2xl font-bold">{totalMinutes}m</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Total time</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-white text-2xl font-bold">{totalCalories.toLocaleString()}</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Calories burned</Text>
                </View>
                <View className="w-1/2">
                  <Text className="text-white text-2xl font-bold">{(totalVolume / 1000).toFixed(1)}k</Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">Volume (lbs)</Text>
                </View>
              </View>
            </View>

            <View className="px-5 mb-3">
              <Text className="text-white text-base font-bold">Recent Sessions</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mx-5 mb-3 bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F]">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
                >
                  <Ionicons name="checkmark" size={20} color={GREEN} />
                </View>
                <View>
                  <Text className="text-white text-base font-bold">{item.workoutName}</Text>
                  <Text className="text-zinc-500 text-xs">{item.date}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-4 pl-1">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="time-outline" size={14} color="#52525B" />
                <Text className="text-zinc-400 text-xs font-medium">{item.duration}m</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="flame-outline" size={14} color="#52525B" />
                <Text className="text-zinc-400 text-xs font-medium">{item.calories} kcal</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="barbell-outline" size={14} color="#52525B" />
                <Text className="text-zinc-400 text-xs font-medium">{item.exercises} exercises</Text>
              </View>
              {item.volume > 0 && (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="trending-up-outline" size={14} color="#52525B" />
                  <Text className="text-zinc-400 text-xs font-medium">
                    {item.volume.toLocaleString()} lbs
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
