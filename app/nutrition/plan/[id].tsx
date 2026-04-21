import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../../src/store/WorkoutStore';
import type { Food, Meal, MealFoodRow } from '../../../src/store/types';

const LIME = '#C6F24E';

const MACRO_COLORS: Record<Food['macro'], string> = {
  protein: '#F87171',
  carb: '#60A5FA',
  fat: '#FBBF24',
  mixed: '#A78BFA',
};

function genLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function MealPlanEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId =
    typeof params.id === 'string' && params.id !== 'new' ? params.id : undefined;
  const { mealPlans, foods, saveMealPlan, deleteMealPlan } = useStore();
  const editing = editId ? mealPlans.find((p) => p.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [meals, setMeals] = useState<Meal[]>(editing?.meals ?? [defaultMeal('Meal 1')]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setMeals(editing.meals);
    }
  }, [editing?.id]);

  const canSave = name.trim().length > 0 && meals.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveMealPlan({ id: editing?.id, name: name.trim(), meals });
    router.back();
  };

  const handleDelete = () => {
    if (!editing) return;
    deleteMealPlan(editing.id);
    router.back();
  };

  const addMeal = () =>
    setMeals((prev) => [...prev, defaultMeal(`Meal ${prev.length + 1}`)]);

  const removeMeal = (id: string) =>
    setMeals((prev) => prev.filter((m) => m.id !== id));

  const patchMeal = (id: string, patch: Partial<Meal>) =>
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const addRow = (mealId: string, food: Food) => {
    const row: MealFoodRow = {
      id: genLocalId('row'),
      foodId: food.id,
      amountG: 100,
    };
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, rows: [...m.rows, row] } : m)),
    );
    setPickerFor(null);
  };

  const patchRow = (mealId: string, rowId: string, patch: Partial<MealFoodRow>) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? {
              ...m,
              rows: m.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
            }
          : m,
      ),
    );
  };

  const removeRow = (mealId: string, rowId: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId ? { ...m, rows: m.rows.filter((r) => r.id !== rowId) } : m,
      ),
    );
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
        <View className="flex-row gap-2">
          {editing ? (
            <Pressable
              onPress={handleDelete}
              className="w-10 h-10 rounded-full bg-[#141414] border border-[#1F1F1F] items-center justify-center active:opacity-70"
            >
              <Ionicons name="trash-outline" size={16} color="#F87171" />
            </Pressable>
          ) : null}
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
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
            <Text
              className="font-bold text-black/70"
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              MEAL PLAN
            </Text>
            <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
              {editing ? 'Edit plan' : 'New plan'}
            </Text>
            <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
              Add meals and food rows with target amounts.
            </Text>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
            <Text className="text-white font-bold mb-3" style={{ fontSize: 14 }}>
              Plan name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Cut 2500 kcal"
              placeholderTextColor="#52525B"
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
              style={{ paddingVertical: 14, fontSize: 15 }}
            />
          </View>

          {meals.map((meal) => {
            const totals = mealTotals(meal, foods);
            return (
              <View
                key={meal.id}
                className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5"
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <TextInput
                    value={meal.name}
                    onChangeText={(v) => patchMeal(meal.id, { name: v })}
                    placeholder="Meal name"
                    placeholderTextColor="#52525B"
                    className="flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
                    style={{ paddingVertical: 10, fontSize: 15, fontWeight: '600' }}
                  />
                  <Pressable
                    onPress={() => removeMeal(meal.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 items-center justify-center active:opacity-70"
                  >
                    <Ionicons name="close" size={14} color="#F87171" />
                  </Pressable>
                </View>

                <Text className="text-zinc-500 text-xs mb-3">
                  {Math.round(totals.kcal)} kcal · P {Math.round(totals.p)} · C{' '}
                  {Math.round(totals.c)} · F {Math.round(totals.f)}
                </Text>

                {meal.rows.length === 0 ? (
                  <Text className="text-zinc-500 text-sm italic mb-3">
                    No foods yet.
                  </Text>
                ) : (
                  <View className="gap-2 mb-3">
                    {meal.rows.map((row) => {
                      const food = foods.find((f) => f.id === row.foodId);
                      const color = food ? MACRO_COLORS[food.macro] : '#71717A';
                      return (
                        <View
                          key={row.id}
                          className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-3 py-2 flex-row items-center"
                        >
                          <View
                            style={{
                              backgroundColor: color,
                              width: 6,
                              height: 24,
                              borderRadius: 3,
                              marginRight: 10,
                            }}
                          />
                          <View className="flex-1">
                            <Text
                              className="text-white font-semibold"
                              style={{ fontSize: 14 }}
                            >
                              {food?.name ?? 'Food'}
                            </Text>
                            <Text className="text-zinc-500 text-xs">
                              {food
                                ? `${Math.round((food.kcalPer100g * row.amountG) / 100)} kcal · P ${(
                                    (food.proteinPer100g * row.amountG) /
                                    100
                                  ).toFixed(0)} · C ${(
                                    (food.carbsPer100g * row.amountG) /
                                    100
                                  ).toFixed(0)} · F ${(
                                    (food.fatPer100g * row.amountG) /
                                    100
                                  ).toFixed(0)}`
                                : '—'}
                            </Text>
                          </View>
                          <TextInput
                            value={String(row.amountG)}
                            onChangeText={(v) => {
                              const n = Number(v);
                              if (Number.isFinite(n) && n >= 0)
                                patchRow(meal.id, row.id, { amountG: n });
                            }}
                            keyboardType="number-pad"
                            className="w-16 bg-[#141414] border border-[#1F1F1F] rounded-lg px-2 text-white text-right"
                            style={{ paddingVertical: 6, fontSize: 13 }}
                          />
                          <Text className="text-zinc-500 text-xs ml-1 mr-2">g</Text>
                          <Pressable
                            onPress={() => removeRow(meal.id, row.id)}
                            className="p-1 active:opacity-60"
                          >
                            <Ionicons name="close" size={14} color="#71717A" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}

                <Pressable
                  onPress={() => setPickerFor(meal.id)}
                  className="self-start bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 py-2.5 active:opacity-70 flex-row items-center"
                >
                  <Ionicons name="add" size={14} color={LIME} />
                  <Text
                    className="font-bold ml-1.5"
                    style={{ color: LIME, fontSize: 13 }}
                  >
                    Add food
                  </Text>
                </Pressable>
              </View>
            );
          })}

          <View className="mx-5 mt-5">
            <Pressable
              onPress={addMeal}
              className="bg-[#141414] border border-dashed border-[#2A2A2A] rounded-3xl py-5 items-center active:opacity-70"
            >
              <Ionicons name="add" size={20} color={LIME} />
              <Text
                className="font-bold mt-1"
                style={{ color: LIME, fontSize: 14 }}
              >
                Add meal
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FoodPicker
        visible={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onPick={(food) => {
          if (pickerFor) addRow(pickerFor, food);
        }}
        foods={foods}
      />
    </SafeAreaView>
  );
}

function defaultMeal(name: string): Meal {
  return { id: genLocalId('meal'), name, rows: [] };
}

function mealTotals(meal: Meal, foods: Food[]) {
  let kcal = 0;
  let p = 0;
  let c = 0;
  let f = 0;
  for (const row of meal.rows) {
    const food = foods.find((x) => x.id === row.foodId);
    if (!food) continue;
    const mult = row.amountG / 100;
    kcal += food.kcalPer100g * mult;
    p += food.proteinPer100g * mult;
    c += food.carbsPer100g * mult;
    f += food.fatPer100g * mult;
  }
  return { kcal, p, c, f };
}

function FoodPicker({
  visible,
  onClose,
  onPick,
  foods,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (food: Food) => void;
  foods: Food[];
}) {
  const [query, setQuery] = useState('');
  const [macro, setMacro] = useState<Food['macro'] | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      if (macro !== 'all' && f.macro !== macro) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [foods, query, macro]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#141414',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '80%',
          }}
        >
          <View className="p-5 flex-row items-center justify-between border-b border-[#1F1F1F]">
            <Text className="text-white font-bold" style={{ fontSize: 18 }}>
              Pick food
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>
          </View>
          <View className="px-5 pt-4 pb-2">
            <View className="flex-row items-center bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 mb-3">
              <Ionicons name="search" size={16} color="#52525B" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search foods"
                placeholderTextColor="#52525B"
                className="flex-1 text-white ml-2"
                style={{ paddingVertical: 12, fontSize: 15 }}
                autoFocus
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 16 }}
            >
              {(['all', 'protein', 'carb', 'fat', 'mixed'] as const).map((m) => {
                const active = macro === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMacro(m)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? LIME : '#0D0D0D',
                      borderWidth: 1,
                      borderColor: active ? LIME : '#1F1F1F',
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: active ? '#0A0A0A' : '#A1A1AA' }}
                    >
                      {m[0].toUpperCase() + m.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((food) => (
              <Pressable
                key={food.id}
                onPress={() => onPick(food)}
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 py-3 flex-row items-center active:opacity-70"
              >
                <View
                  style={{
                    backgroundColor: MACRO_COLORS[food.macro],
                    width: 6,
                    height: 24,
                    borderRadius: 3,
                    marginRight: 10,
                  }}
                />
                <View className="flex-1">
                  <Text className="text-white font-semibold" style={{ fontSize: 14 }}>
                    {food.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs">
                    {food.kcalPer100g} kcal · P {food.proteinPer100g} · C{' '}
                    {food.carbsPer100g} · F {food.fatPer100g} / 100g
                  </Text>
                </View>
                <Ionicons name="add" size={18} color={LIME} />
              </Pressable>
            ))}
            {filtered.length === 0 ? (
              <Text className="text-zinc-500 text-sm italic text-center py-4">
                No foods match your search.
              </Text>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
