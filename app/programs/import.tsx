import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../../src/store/WorkoutStore';

const LIME = '#22C55E';

const PROMPT_TEMPLATE = `You convert free-form workout programs into JSON for the Capable app.

Output ONLY valid JSON with this exact shape — no commentary, no markdown fences:

{
  "program": {
    "name": "string — e.g. Phase 1",
    "phase": "optional string — e.g. 1 or Accumulation",
    "durationWeeks": 5,
    "restDays": 2
  },
  "workouts": [
    {
      "name": "string — e.g. WA - Push",
      "exercises": [
        {
          "name": "string — e.g. Incline Smith Machine Chest Press",
          "sets": 2,
          "reps": "string — e.g. 10,8 or 12-15 or AMRAP",
          "restSeconds": 150,
          "tempo": "optional 4-digit string like 3010",
          "note": "optional string — grip, cue, emphasis, or any bracketed detail",
          "demoUrl": "optional http(s) URL if one was provided, else empty string"
        }
      ]
    }
  ]
}

Rules:
- sets is a number; reps is a string
- restSeconds: parse to the FIRST number in the rest notation (e.g. "150s rest…..180s last set" -> 150)
- tempo: only include if 4 digits like 3010 are given; otherwise omit
- note: roll up any emphasis, grip, angle, or bracketed qualifier ("*pronated grip*", "focus on vastus lateralis", "each side") into one short string
- demoUrl: only a raw http/https URL; if the notation just mentioned a link in the note, put the URL in demoUrl and keep human text in note
- Preserve exercise order
- Workout name: use the heading as given (e.g. "WA - Push")
- Program name: derive from "Training Phase" if present (e.g. "Phase 1"); else use a short descriptive name
- durationWeeks from "Length Of Phase" (just the number of weeks)
- restDays: count the listed days off per week; omit if unclear

Program to convert follows below:

`;

export default function ImportProgramScreen() {
  const router = useRouter();
  const store = useStore();
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await Clipboard.setStringAsync(PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      Alert.alert('Copy failed', 'Could not access the clipboard.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const s = await Clipboard.getStringAsync();
      if (s) setText(s);
    } catch {
      // ignore
    }
  };

  const handleImport = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Nothing to import', 'Paste the JSON returned by ChatGPT.');
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      Alert.alert(
        'Not valid JSON',
        'Double-check the text — it should start with { and end with } with no surrounding prose.',
      );
      return;
    }
    let preview;
    try {
      preview = store.previewCoachImport(raw);
    } catch {
      Alert.alert('Import failed', 'JSON shape was not recognized.');
      return;
    }
    const r = preview.report;
    if (r.workoutsImported === 0) {
      Alert.alert(
        'Nothing to import',
        'The JSON parsed but no workouts were found inside.',
      );
      return;
    }
    const lines = [
      r.programsImported > 0 ? `${r.programsImported} program` : '',
      `${r.workoutsImported} workout${r.workoutsImported === 1 ? '' : 's'}`,
      `${r.customExercisesCreated} new exercises`,
      r.warnings.length > 0 ? `\n${r.warnings.length} warnings` : '',
    ].filter(Boolean);

    Alert.alert('Import this program?', lines.join('\n'), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'default',
        onPress: () => {
          store.commitImport(preview);
          router.back();
        },
      },
    ]);
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
          onPress={handleImport}
          disabled={text.trim().length === 0}
          className="px-5 py-2.5 rounded-2xl"
          style={{
            backgroundColor: text.trim().length > 0 ? LIME : '#1F1F1F',
          }}
        >
          <Text
            className="font-bold"
            style={{
              color: text.trim().length > 0 ? '#0A0A0A' : '#52525B',
              fontSize: 14,
            }}
          >
            Import
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View
            className="mx-5 mt-2 rounded-3xl p-6"
            style={{ backgroundColor: LIME }}
          >
            <Text
              className="font-bold text-black/70"
              style={{ fontSize: 11, letterSpacing: 2 }}
            >
              PROGRAM
            </Text>
            <Text className="text-black font-bold mt-2" style={{ fontSize: 30 }}>
              Import from coach
            </Text>
            <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
              Use ChatGPT to convert your coach's program into JSON, paste it
              back in here.
            </Text>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
            <Text
              className="text-zinc-500 font-bold"
              style={{ fontSize: 11, letterSpacing: 1 }}
            >
              STEP 1
            </Text>
            <Text className="text-white font-bold mt-1" style={{ fontSize: 16 }}>
              Copy the prompt
            </Text>
            <Text className="text-zinc-500 text-sm mt-1 mb-3">
              Open ChatGPT (or any LLM), paste this prompt, then paste your
              coach's program underneath it.
            </Text>
            <Pressable
              onPress={handleCopyPrompt}
              className="flex-row items-center justify-center rounded-2xl py-3 active:opacity-80"
              style={{ backgroundColor: LIME }}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={16}
                color="#0A0A0A"
              />
              <Text
                className="text-black font-bold ml-2"
                style={{ fontSize: 14 }}
              >
                {copied ? 'Copied!' : 'Copy prompt'}
              </Text>
            </Pressable>
            <Text className="text-zinc-600 text-xs mt-3 italic">
              The prompt includes rules ChatGPT follows to produce the exact
              JSON shape this screen accepts.
            </Text>
          </View>

          <View className="mx-5 mt-5 bg-[#141414] border border-[#1F1F1F] rounded-3xl p-5">
            <Text
              className="text-zinc-500 font-bold"
              style={{ fontSize: 11, letterSpacing: 1 }}
            >
              STEP 2
            </Text>
            <Text className="text-white font-bold mt-1" style={{ fontSize: 16 }}>
              Paste the JSON back
            </Text>
            <Text className="text-zinc-500 text-sm mt-1 mb-3">
              Copy what ChatGPT returns and paste it below, then tap Import.
            </Text>
            <View className="flex-row gap-2 mb-2">
              <Pressable
                onPress={handlePasteFromClipboard}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 active:opacity-70 flex-row items-center"
              >
                <Ionicons name="clipboard-outline" size={14} color="#ffffff" />
                <Text
                  className="text-white font-bold ml-2"
                  style={{ fontSize: 13 }}
                >
                  Paste from clipboard
                </Text>
              </Pressable>
              {text.length > 0 ? (
                <Pressable
                  onPress={() => setText('')}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 active:opacity-70 flex-row items-center"
                >
                  <Ionicons name="trash-outline" size={14} color="#F87171" />
                  <Text
                    className="text-white font-bold ml-2"
                    style={{ fontSize: 13 }}
                  >
                    Clear
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Paste the JSON here…"
              placeholderTextColor="#52525B"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
              style={{
                paddingVertical: 12,
                fontSize: 13,
                minHeight: 220,
                textAlignVertical: 'top',
                fontFamily: Platform.select({
                  ios: 'Menlo',
                  android: 'monospace',
                  default: 'monospace',
                }),
              }}
            />
            {text.length > 0 ? (
              <Text className="text-zinc-600 text-xs mt-2">
                {text.length.toLocaleString()} characters
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
