import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useStore } from '../../src/store/WorkoutStore';
import { DateField } from '../../src/components/DateField';

const LIME = '#C6F24E';

export default function NewProgramScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const { workouts, programs, saveProgram } = useStore();

  const editing = editId ? programs.find((p) => p.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [startDate, setStartDate] = useState<string | undefined>(editing?.startDate);
  const [endDate, setEndDate] = useState<string | undefined>(editing?.endDate);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>(editing?.workoutIds ?? []);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setStartDate(editing.startDate);
      setEndDate(editing.endDate);
      setPicked(editing.workoutIds);
    }
  }, [editing?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pickedSet = new Set(picked);
    return workouts.filter((w) => {
      if (pickedSet.has(w.id)) return false;
      if (!q) return true;
      return w.name.toLowerCase().includes(q);
    });
  }, [workouts, query, picked]);

  const toggle = (id: string) => {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveProgram({
      id: editing?.id,
      name: name.trim(),
      workoutIds: picked,
      startDate,
      endDate,
    });
    router.back();
  };

  const renderPickedItem = ({
    item: id,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<string>) => {
    const w = workouts.find((x) => x.id === id);
    if (!w) return null;
    const idx = (getIndex() ?? 0) + 1;
    return (
      <ScaleDecorator>
        <View className="px-5 mb-2">
          <View
            className="bg-[#0D0D0D] rounded-2xl border px-4 py-3 flex-row items-center"
            style={{
              borderColor: isActive ? LIME : '#1F1F1F',
              opacity: isActive ? 0.95 : 1,
            }}
          >
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              disabled={isActive}
              className="w-8 h-8 rounded-lg items-center justify-center active:opacity-60 mr-3"
              style={{ backgroundColor: '#1F1F1F' }}
            >
              <Ionicons name="reorder-three" size={18} color="#A1A1AA" />
            </TouchableOpacity>
            <Text className="text-white/40 font-bold w-6" style={{ fontSize: 12 }}>
              {String(idx).padStart(2, '0')}
            </Text>
            <View className="flex-1">
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                {w.name}
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                {w.exercises.length} exercise
                {w.exercises.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Pressable
              onPress={() => toggle(id)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
            >
              <Ionicons name="close" size={14} color="#F87171" />
            </Pressable>
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  const header = (
    <>
      <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
        <Text
          className="font-bold text-black/70"
          style={{ fontSize: 11, letterSpacing: 2 }}
        >
          PROGRAM
        </Text>
        <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
          {editing ? 'Edit Program' : 'New Program'}
        </Text>
        <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
          Add your workouts to create a training program.
        </Text>
      </View>

      <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
        <Text className="text-white font-bold mb-3" style={{ fontSize: 14 }}>
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
          <DateField label="Start date" value={startDate} onChange={setStartDate} />
          <DateField label="End date" value={endDate} onChange={setEndDate} />
        </View>
      </View>

      <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
        <Text className="text-white font-bold" style={{ fontSize: 20 }}>
          Add Workouts
        </Text>
        <Text className="text-zinc-500 text-sm mt-1 mb-4">
          Select from your existing workouts to add to this program.
        </Text>

        <Text className="text-white/80 font-bold mb-2" style={{ fontSize: 14 }}>
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
        ) : filtered.length === 0 ? (
          <Text className="text-zinc-500 text-sm italic py-2">
            {picked.length === workouts.length
              ? 'All workouts added.'
              : 'No workouts match your search.'}
          </Text>
        ) : (
          <View className="gap-2">
            {filtered.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => toggle(w.id)}
                className="bg-[#0D0D0D] rounded-2xl border border-[#1F1F1F] px-4 py-3 flex-row items-center active:opacity-80"
              >
                <View className="flex-1">
                  <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                    {w.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-0.5">
                    {w.exercises.length} exercise
                    {w.exercises.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{ backgroundColor: LIME }}
                >
                  <Ionicons name="add" size={18} color="#0A0A0A" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="px-5 mt-5 mb-3 flex-row items-center justify-between">
        <Text
          className="text-white/60 font-bold"
          style={{ fontSize: 11, letterSpacing: 1 }}
        >
          SELECTED · {picked.length}
        </Text>
        {picked.length > 1 ? (
          <Text className="text-zinc-500 text-xs italic">
            Long-press handle to reorder
          </Text>
        ) : null}
      </View>
      {picked.length === 0 ? (
        <View className="mx-5 bg-[#141414] rounded-2xl border border-[#1F1F1F] py-5 px-5 mb-3">
          <Text className="text-zinc-500 text-sm italic text-center">
            Tap workouts above to add them to this program.
          </Text>
        </View>
      ) : null}
    </>
  );

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
            {editing ? 'Save changes' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <DraggableFlatList
          data={picked}
          keyExtractor={(id) => id}
          onDragEnd={({ data }) => setPicked(data)}
          renderItem={renderPickedItem}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
