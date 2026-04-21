import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/WorkoutStore';
import type { SyncCategory, UserSettings } from '../../src/store/types';
import { shareContent } from '../../src/lib/platform';

const LIME = '#C6F24E';

const ACCENT_OPTIONS = [
  '#C6F24E',
  '#22C55E',
  '#60A5FA',
  '#F87171',
  '#FBBF24',
  '#A78BFA',
  '#EC4899',
  '#10B981',
];

const SYNC_LABELS: Record<SyncCategory, string> = {
  workouts: 'Workouts',
  programs: 'Programs',
  health: 'Health',
  peds: 'PEDs',
  settings: 'Settings',
  meals: 'Meals',
  habits: 'Habits',
  social: 'Social',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsScreen() {
  const router = useRouter();
  const store = useStore();
  const { settings, updateSettings } = store;

  const patch = (p: Partial<UserSettings>) => updateSettings(p);

  const handleExport = async () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      version: 'capable.store.v2',
      exercises: store.exercises.filter((e) => e.isCustom),
      workouts: store.workouts,
      programs: store.programs,
      sessions: store.sessions,
      personalRecords: store.personalRecords,
      bodyweight: store.bodyweight,
      dailyMetrics: store.dailyMetrics,
      cardio: store.cardio,
      supplements: store.supplements,
      medications: store.medications,
      weeklyCheckins: store.weeklyCheckins,
      foods: store.foods.filter((f) => f.isCustom),
      mealPlans: store.mealPlans,
      mealLogs: store.mealLogs,
      habits: store.habits,
      habitLogs: store.habitLogs,
      settings: store.settings,
    };
    const json = JSON.stringify(dump, null, 2);
    const ok = await shareContent({
      title: 'Capable backup',
      message: json,
    });
    if (!ok) {
      Alert.alert('Export failed', 'Could not share the backup file.');
    }
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
            SETTINGS
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 34 }}>
            Preferences
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Tweak defaults, goals, and sync categories.
          </Text>
        </View>

        <Section title="Preferences">
          <NumRow
            label="Weight increment (kg)"
            value={String(settings.weightIncrementKg)}
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n) && n > 0) patch({ weightIncrementKg: n });
            }}
            decimal
          />
          <NumRow
            label="Default rest (seconds)"
            value={String(settings.defaultRestSeconds)}
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n) && n >= 0) patch({ defaultRestSeconds: n });
            }}
          />
          <SelectRow
            label="Week starts"
            value={settings.weekStartDay}
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
            onChange={(v) => patch({ weekStartDay: v as UserSettings['weekStartDay'] })}
          />
          <SelectRow
            label="Check-in day"
            value={String(settings.checkInDay)}
            options={DAYS.map((d, i) => ({ value: String(i), label: d }))}
            onChange={(v) => patch({ checkInDay: Number(v) })}
          />
          <View className="mb-4">
            <Text
              className="text-zinc-500 font-bold mb-2"
              style={{ fontSize: 11, letterSpacing: 0.5 }}
            >
              ACCENT COLOR
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCENT_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => patch({ accentColor: c })}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: c + '30',
                    borderWidth: 2,
                    borderColor: settings.accentColor === c ? c : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: c,
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <Text className="text-zinc-600 text-xs mt-2 italic">
              Applied to new visuals as the theme is migrated.
            </Text>
          </View>
        </Section>

        <Section title="Goals">
          <NumRow
            label="Bodyweight (kg)"
            value={strOrEmpty(settings.goals.bodyweightKg)}
            onChange={(v) => patch({ goals: { bodyweightKg: parseOpt(v) } })}
            decimal
          />
          <NumRow
            label="Calories"
            value={strOrEmpty(settings.goals.calories)}
            onChange={(v) => patch({ goals: { calories: parseOpt(v) } })}
          />
          <NumRow
            label="Protein (g)"
            value={strOrEmpty(settings.goals.proteinG)}
            onChange={(v) => patch({ goals: { proteinG: parseOpt(v) } })}
          />
          <NumRow
            label="Carbs (g)"
            value={strOrEmpty(settings.goals.carbsG)}
            onChange={(v) => patch({ goals: { carbsG: parseOpt(v) } })}
          />
          <NumRow
            label="Fat (g)"
            value={strOrEmpty(settings.goals.fatG)}
            onChange={(v) => patch({ goals: { fatG: parseOpt(v) } })}
          />
          <NumRow
            label="Cardio (min/week)"
            value={strOrEmpty(settings.goals.cardioMinutes)}
            onChange={(v) => patch({ goals: { cardioMinutes: parseOpt(v) } })}
          />
          <Text className="text-zinc-600 text-xs italic">
            Active meal plan totals override these macro goals on Home.
          </Text>
        </Section>

        <Section title="Sync">
          <Text className="text-zinc-500 text-xs mb-3">
            Gates per-category cloud sync. No effect while cloud is disabled.
          </Text>
          {(Object.keys(SYNC_LABELS) as SyncCategory[]).map((k) => (
            <View
              key={k}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-white font-semibold">{SYNC_LABELS[k]}</Text>
              <Switch
                value={settings.sync[k]}
                onValueChange={(v) => patch({ sync: { [k]: v } as Partial<Record<SyncCategory, boolean>> })}
                trackColor={{ false: '#1F1F1F', true: LIME }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </Section>

        <Section title="Feature flags">
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 pr-3">
              <Text className="text-white font-semibold">PEDs tracking</Text>
              <Text className="text-zinc-500 text-xs mt-1">
                Harm-reduction cycle + dose logging. Off by default.
              </Text>
            </View>
            <Switch
              value={settings.featureFlags.peds}
              onValueChange={(v) =>
                patch({ featureFlags: { peds: v } })
              }
              trackColor={{ false: '#1F1F1F', true: LIME }}
              thumbColor="#ffffff"
            />
          </View>
        </Section>

        <Section title="Data">
          <Pressable
            onPress={handleExport}
            className="flex-row items-center px-4 py-3 rounded-2xl bg-[#0D0D0D] border border-[#1F1F1F] active:opacity-70"
          >
            <Ionicons name="cloud-download-outline" size={18} color={LIME} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                Export JSON backup
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                Shares a snapshot of your local data.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
          </Pressable>
        </Section>

        <Section title="Account">
          <Text className="text-zinc-500 text-sm">
            Sign in, email and password changes land with cloud sync.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function strOrEmpty(v: number | undefined) {
  return v != null ? String(v) : '';
}

function parseOpt(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <Text className="text-white font-bold mb-3" style={{ fontSize: 18 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function NumRow({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-[#1F1F1F]">
      <Text className="text-white font-semibold flex-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="—"
        placeholderTextColor="#3F3F46"
        className="w-24 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white text-right"
        style={{ paddingVertical: 8, fontSize: 14 }}
      />
    </View>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View className="py-2.5 border-b border-[#1F1F1F]">
      <Text className="text-white font-semibold mb-2">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: active ? LIME : '#0D0D0D',
                borderWidth: 1,
                borderColor: active ? LIME : '#1F1F1F',
              }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: active ? '#0A0A0A' : '#A1A1AA' }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
