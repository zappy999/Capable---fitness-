import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAccent, useStore } from '../../src/store/WorkoutStore';
import type { UserSettings } from '../../src/store/types';
import { shareJsonAsFile } from '../../src/lib/platform';

const ACCENT_OPTIONS = [
  '#22C55E',
  '#14B8A6',
  '#60A5FA',
  '#F87171',
  '#FBBF24',
  '#A78BFA',
  '#EC4899',
  '#C6F24E',
];

export default function SettingsScreen() {
  const router = useRouter();
  const store = useStore();
  const { settings, updateSettings } = store;
  const LIME = useAccent();

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
      settings: store.settings,
    };
    const ok = await shareJsonAsFile(dump, 'capable-backup');
    if (!ok) {
      Alert.alert('Export failed', 'Could not share the backup file.');
    }
  };

  const handleWipe = () => {
    Alert.alert(
      'Wipe all data?',
      'This deletes every workout, program, session, PR, custom exercise, and setting on this device. The built-in exercise library stays. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Last chance — tap Wipe again to erase.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Wipe',
                  style: 'destructive',
                  onPress: () => {
                    store.wipe();
                    router.back();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleImport = async () => {
    let pick: DocumentPicker.DocumentPickerResult;
    try {
      pick = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
    } catch {
      Alert.alert('Import failed', 'Could not open file picker.');
      return;
    }
    if (pick.canceled) return;
    const asset = pick.assets?.[0];
    if (!asset) return;

    let text: string;
    try {
      if (asset.file && typeof asset.file.text === 'function') {
        text = await asset.file.text();
      } else {
        const res = await fetch(asset.uri);
        text = await res.text();
      }
    } catch {
      Alert.alert('Import failed', 'Could not read file contents.');
      return;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      Alert.alert('Import failed', 'File is not valid JSON.');
      return;
    }

    let preview;
    try {
      preview = store.previewImport(raw);
    } catch {
      Alert.alert('Import failed', 'Backup format not recognized.');
      return;
    }
    const r = preview.report;
    const noop =
      r.workoutsImported +
        r.sessionsImported +
        r.customExercisesCreated +
        r.programsImported ===
      0;
    if (noop) {
      Alert.alert(
        'Nothing to import',
        'The file parsed but contained no importable data.',
      );
      return;
    }
    const lines = [
      r.programsImported > 0 ? `${r.programsImported} programs` : '',
      `${r.workoutsImported} workouts`,
      `${r.sessionsImported} sessions`,
      `${r.customExercisesCreated} new exercises`,
      r.warnings.length > 0 ? `\n${r.warnings.length} warnings ignored` : '',
    ].filter(Boolean);
    Alert.alert(
      'Import this backup?',
      `${lines.join('\n')}\n\nExisting entries with the same id are overwritten; anything else is kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'default',
          onPress: () => {
            const report = store.commitImport(preview);
            Alert.alert(
              'Import complete',
              `${report.workoutsImported} workouts · ${report.sessionsImported} sessions`,
            );
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
            Tweak defaults and back up your data.
          </Text>
        </View>

        <Section title="Training">
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
          <SelectRow<UserSettings['weekStartDay']>
            label="Week starts"
            value={settings.weekStartDay}
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
            onChange={(v) => patch({ weekStartDay: v })}
          />
          <View>
            <Text
              className="text-zinc-500 font-bold mb-2 mt-2"
              style={{ fontSize: 11, letterSpacing: 0.5 }}
            >
              ACCENT COLOUR
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
          </View>
        </Section>

        <Section title="Data">
          <Pressable
            onPress={handleImport}
            className="flex-row items-center px-4 py-3 rounded-2xl bg-[#0D0D0D] border border-[#1F1F1F] active:opacity-70 mb-2"
          >
            <Ionicons name="cloud-upload-outline" size={18} color={LIME} />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                Import JSON backup
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                Load programs, workouts, and sessions from a backup file.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
          </Pressable>
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

        <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
          <Text
            className="font-bold mb-3"
            style={{ color: '#F87171', fontSize: 18 }}
          >
            Danger zone
          </Text>
          <Pressable
            onPress={handleWipe}
            className="flex-row items-center px-4 py-3 rounded-2xl bg-[#0D0D0D] active:opacity-70"
            style={{ borderWidth: 1, borderColor: '#F8717155' }}
          >
            <Ionicons name="trash-outline" size={18} color="#F87171" />
            <View className="flex-1 ml-3">
              <Text
                className="font-bold"
                style={{ color: '#F87171', fontSize: 15 }}
              >
                Wipe account data
              </Text>
              <Text className="text-zinc-500 text-xs mt-0.5">
                Remove all local data. Export a backup first if you want to
                keep anything.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#3F3F46" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const LIME = useAccent();
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
