import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import type { Food, MealPlan } from '../../src/store/types';

const LIME = '#C6F24E';

function planTotals(plan: MealPlan, foods: Food[]) {
  let kcal = 0;
  let p = 0;
  let c = 0;
  let f = 0;
  for (const meal of plan.meals) {
    for (const row of meal.rows) {
      const food = foods.find((x) => x.id === row.foodId);
      if (!food) continue;
      const mult = row.amountG / 100;
      kcal += food.kcalPer100g * mult;
      p += food.proteinPer100g * mult;
      c += food.carbsPer100g * mult;
      f += food.fatPer100g * mult;
    }
  }
  return { kcal, p, c, f };
}

export default function NutritionScreen() {
  const router = useRouter();
  const { mealPlans, foods, setActiveMealPlan } = useStore();

  const sorted = useMemo(
    () => [...mealPlans].sort((a, b) => b.createdAt - a.createdAt),
    [mealPlans],
  );

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
          onPress={() => router.push('/nutrition/plan/new')}
          className="px-5 py-2.5 rounded-2xl"
          style={{ backgroundColor: LIME }}
        >
          <Text className="text-black font-bold" style={{ fontSize: 14 }}>
            + New plan
          </Text>
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
            NUTRITION
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            Meal plans
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            One plan active at a time — totals appear on Home.
          </Text>
        </View>

        {sorted.length === 0 ? (
          <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-8 px-6 items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
              <Ionicons name="nutrition-outline" size={22} color="#71717A" />
            </View>
            <Text className="text-white font-bold" style={{ fontSize: 16 }}>
              No meal plans yet
            </Text>
            <Text className="text-zinc-500 text-sm text-center mt-1">
              Create one to define your daily macro targets.
            </Text>
          </View>
        ) : (
          <View className="px-5 mt-5 gap-3">
            {sorted.map((plan) => {
              const totals = planTotals(plan, foods);
              return (
                <Pressable
                  key={plan.id}
                  onPress={() =>
                    router.push({
                      pathname: '/nutrition/plan/[id]',
                      params: { id: plan.id },
                    })
                  }
                  className="bg-[#141414] rounded-3xl border border-[#1F1F1F] p-4 active:opacity-80"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-white font-bold flex-1"
                      style={{ fontSize: 18 }}
                    >
                      {plan.name}
                    </Text>
                    {plan.isActive ? (
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(198,242,78,0.15)' }}
                      >
                        <Text
                          className="font-bold"
                          style={{
                            color: LIME,
                            fontSize: 10,
                            letterSpacing: 1,
                          }}
                        >
                          ACTIVE
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setActiveMealPlan(plan.id);
                        }}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10"
                      >
                        <Text
                          className="text-white text-xs font-bold"
                          style={{ letterSpacing: 0.5 }}
                        >
                          SET ACTIVE
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <Text className="text-zinc-500 text-sm">
                    {plan.meals.length} meal{plan.meals.length === 1 ? '' : 's'} ·{' '}
                    {Math.round(totals.kcal)} kcal · P {Math.round(totals.p)} · C{' '}
                    {Math.round(totals.c)} · F {Math.round(totals.f)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
