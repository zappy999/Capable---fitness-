import { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WORKOUTS } from '../../src/data/workouts';

const CATEGORIES = ['All', 'Strength', 'Cardio', 'Core'];

export default function WorkoutsScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('All');

  const filtered = category === 'All' ? WORKOUTS : WORKOUTS.filter((w) => w.category === category);

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-white text-3xl font-bold">Workouts</Text>
        <Text className="text-zinc-500 text-sm mt-1">Choose your challenge</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        className="mb-4 flex-grow-0"
      >
        {CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: active ? '#22C55E' : '#141414',
                borderWidth: 1,
                borderColor: active ? '#22C55E' : '#1F1F1F',
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? '#000' : '#A1A1AA' }}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/workout/${item.id}`)}
            className="bg-[#141414] rounded-2xl p-4 border border-[#1F1F1F] active:opacity-80"
          >
            <View className="flex-row items-center gap-4">
              <View
                style={{ backgroundColor: `${item.color}20` }}
                className="w-14 h-14 rounded-2xl items-center justify-center"
              >
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-base font-bold">{item.name}</Text>
                  <View className="bg-[#1F1F1F] px-2 py-0.5 rounded-full">
                    <Text className="text-zinc-400 text-xs font-medium">{item.difficulty}</Text>
                  </View>
                </View>
                <Text className="text-zinc-500 text-xs mt-1" numberOfLines={1}>
                  {item.description}
                </Text>
                <View className="flex-row gap-3 mt-2">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={12} color="#52525B" />
                    <Text className="text-zinc-500 text-xs">{item.duration}m</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="flame-outline" size={12} color="#52525B" />
                    <Text className="text-zinc-500 text-xs">{item.calories} kcal</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="barbell-outline" size={12} color="#52525B" />
                    <Text className="text-zinc-500 text-xs">{item.exerciseCount} ex</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#2A2A2A" />
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
