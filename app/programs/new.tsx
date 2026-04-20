import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';

const LIME = '#C6F24E';

export default function NewProgramScreen() {
  const router = useRouter();
  const { workouts, saveProgram } = useStore();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workouts;
    return workouts.filter((w) => w.name.toLowerCase().includes(q));
  }, [workouts, query]);

  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveProgram({
      name: name.trim(),
      workoutIds: picked,
      startDate: startDate.trim() || undefined,
      endDate: endDate.trim() || undefined,
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top', 'bottom']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={18} color="#ffffff" />
        </Pressable>
        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          className="px-5 py-2.5 rounded-2xl"
          style={{ backgroundColor: canSave ? LIME : '#1F1F1F' }}
        >
          <Text
            className="font-bold"
            style={{
              color: canSave ? '#0A0A0A' : '#52525B',
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
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
              New Program
            </Text>
            <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
              Add your workouts to create a training program.
            </Text>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <Text
              className="text-white font-bold mb-3"
              style={{ fontSize: 14 }}
            >
              Program name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Push Pull Legs"
              placeholderTextColor="#52525B"
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-4"
              style={{ paddingVertical: 14, fontSize: 15 }}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text
                  className="text-white font-bold mb-2"
                  style={{ fontSize: 14 }}
                >
                  Start date
                </Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#52525B"
                  className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                  style={{ paddingVertical: 14, fontSize: 14 }}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-white font-bold mb-2"
                  style={{ fontSize: 14 }}
                >
                  End date
                </Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#52525B"
                  className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                  style={{ paddingVertical: 14, fontSize: 14 }}
                />
              </View>
            </View>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <Text className="text-white font-bold" style={{ fontSize: 20 }}>
              Add Workouts
            </Text>
            <Text className="text-zinc-500 text-sm mt-1 mb-4">
              Select from your existing workouts to add to this program.
            </Text>

            <Text
              className="text-white/80 font-bold mb-2"
              style={{ fontSize: 14 }}
            >
              Search workouts
            </Text>
            <View className="flex-row items-center bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 mb-3">
              <Ionicons name="search" size={16} color="#52525B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search your workouts"
                placeholderTextColor="#52525B"
                className="flex-1 text-white ml-2"
                style={{ paddingVertical: 12, fontSize: 15 }}
              />
            </View>

            {workouts.length === 0 ? (
              <View className="items-center py-6">
                <Ionicons name="barbell-outline" size={24} color="#52525B" />
                <Text className="text-zinc-500 text-sm mt-2 text-center">
                  You don't have any workouts yet.
                </Text>
                <Pressable
                  onPress={() => router.replace('/workouts/new')}
                  className="mt-3 px-5 py-2.5 rounded-2xl"
                  style={{ backgroundColor: LIME }}
                >
                  <Text className="text-black font-bold" style={{ fontSize: 13 }}>
                    + Create Workout
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2">
                {filtered.map((w) => {
                  const added = picked.includes(w.id);
                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => toggle(w.id)}
                      className="bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] px-4 py-3 flex-row items-center active:opacity-80"
                    >
                      <View className="flex-1">
                        <Text
                          className="text-white font-bold"
                          style={{ fontSize: 15 }}
                        >
                          {w.name}
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">
                          {w.exercises.length} exercise
                          {w.exercises.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <View
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{
                          backgroundColor: added ? '#1F1F1F' : LIME,
                        }}
                      >
                        <Ionicons
                          name={added ? 'checkmark' : 'add'}
                          size={18}
                          color={added ? LIME : '#0A0A0A'}
                        />
                      </View>
                    </Pressable>
                  );
                })}
                {filtered.length === 0 ? (
                  <Text className="text-zinc-500 text-sm italic py-2">
                    No workouts match your search.
                  </Text>
                ) : null}
              </View>
            )}

            {picked.length > 0 ? (
              <View className="mt-4 pt-4 border-t border-[#1F1F1F]">
                <Text
                  className="text-white/60 font-bold"
                  style={{ fontSize: 11, letterSpacing: 1 }}
                >
                  SELECTED · {picked.length}
                </Text>
                <View className="mt-2 gap-1.5">
                  {picked.map((id, idx) => {
                    const w = workouts.find((x) => x.id === id);
                    if (!w) return null;
                    return (
                      <View
                        key={id}
                        className="flex-row items-center gap-2"
                      >
                        <Text
                          className="text-white/40 font-bold w-6"
                          style={{ fontSize: 12 }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </Text>
                        <Text
                          className="text-white/90 flex-1"
                          style={{ fontSize: 14 }}
                        >
                          {w.name}
                        </Text>
                        <Pressable
                          onPress={() => toggle(id)}
                          className="p-1 active:opacity-60"
                        >
                          <Ionicons name="close" size={14} color="#71717A" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
