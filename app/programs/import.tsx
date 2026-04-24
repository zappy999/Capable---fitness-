import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAccent } from '../../src/store/WorkoutStore';
import {
  PROMPT_TEMPLATE,
  parseImportedProgram,
  stageImport,
} from '../../src/lib/programImport';

export default function ImportProgramScreen() {
  const router = useRouter();
  const LIME = useAccent();
  const [pasted, setPasted] = useState('');

  const handleCopyPrompt = async () => {
    try {
      await Share.share({ message: PROMPT_TEMPLATE });
    } catch {}
  };

  const handleReview = () => {
    const trimmed = pasted.trim();
    if (!trimmed) {
      Alert.alert('Nothing to parse', 'Paste the JSON from ChatGPT first.');
      return;
    }
    let cleaned = trimmed;
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    // Strip prose wrapping around the JSON object (ChatGPT preambles, trailing text).
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    // Replace smart quotes / unicode separators that break JSON.parse.
    cleaned = cleaned
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u00A0/g, ' ')
      // Strip trailing commas before ] or } — common LLM output mistake.
      .replace(/,\s*([\]}])/g, '$1');

    let raw: unknown;
    try {
      raw = JSON.parse(cleaned);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Syntax error.';
      Alert.alert(
        'Not valid JSON',
        `Make sure you pasted only the JSON object ChatGPT produced.\n\n${msg}`,
      );
      return;
    }
    try {
      const program = parseImportedProgram(raw);
      stageImport(program);
      router.replace('/programs/review');
    } catch (e: unknown) {
      Alert.alert(
        "Couldn't import",
        e instanceof Error ? e.message : 'Unknown parse error.',
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <View className="px-5 pt-2 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={18} color="#ffffff" />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View
          className="mx-5 mt-2 rounded-3xl p-6"
          style={{ backgroundColor: LIME }}
        >
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            IMPORT PROGRAM
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 32 }}>
            From your coach
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Use ChatGPT to convert an emailed program into JSON, then paste it
            here.
          </Text>
        </View>

        <Section title="Step 1 — copy this prompt">
          <Text className="text-zinc-400 mb-3" style={{ fontSize: 13 }}>
            Share the prompt below with ChatGPT, then paste your coach's program
            where it says{' '}
            <Text className="text-white font-bold">&lt;PASTE PROGRAM BELOW&gt;</Text>
            .
          </Text>
          <View className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-3 mb-3">
            <Text
              className="text-zinc-300"
              style={{ fontSize: 12, lineHeight: 18 }}
            >
              {PROMPT_TEMPLATE}
            </Text>
          </View>
          <Pressable
            onPress={handleCopyPrompt}
            className="flex-row items-center justify-center px-4 py-3 rounded-2xl active:opacity-90"
            style={{ backgroundColor: LIME }}
          >
            <Ionicons name="share-outline" size={16} color="#0A0A0A" />
            <Text
              className="text-black font-bold ml-2"
              style={{ fontSize: 14 }}
            >
              Share prompt
            </Text>
          </Pressable>
        </Section>

        <Section title="Step 2 — paste the JSON">
          <Text className="text-zinc-400 mb-3" style={{ fontSize: 13 }}>
            Copy ChatGPT's reply and paste the whole JSON block below. Code
            fences are OK.
          </Text>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            placeholder='{ "name": "…", "workouts": [ … ] }'
            placeholderTextColor="#52525B"
            multiline
            autoCorrect={false}
            autoCapitalize="none"
            className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
            style={{
              paddingVertical: 12,
              fontSize: 13,
              minHeight: 220,
              textAlignVertical: 'top',
              fontFamily: 'Courier',
            }}
          />
        </Section>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-white/5">
        <Pressable
          onPress={handleReview}
          style={{ backgroundColor: pasted.trim() ? LIME : '#1F1F1F' }}
          className="rounded-2xl py-4 items-center active:opacity-90"
        >
          <Text
            className="font-bold"
            style={{
              color: pasted.trim() ? '#0A0A0A' : '#71717A',
              fontSize: 15,
            }}
          >
            Review program
          </Text>
        </Pressable>
      </View>
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
    <View className="mx-5 mt-5 bg-[#1A1A1A] rounded-3xl border border-[#1F1F1F] p-5">
      <Text className="text-white font-bold mb-3" style={{ fontSize: 18 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}
