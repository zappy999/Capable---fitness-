import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LIME = '#C6F24E';

export default function HealthScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-5 mt-2 rounded-3xl p-6" style={{ backgroundColor: LIME }}>
          <Text
            className="font-bold text-black/70"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            HEALTH
          </Text>
          <Text className="text-black font-bold mt-2" style={{ fontSize: 36 }}>
            Body
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Track weight, sleep, and recovery.
          </Text>
        </View>

        <View className="px-5 mt-5 gap-3">
          <MetricCard icon="scale-outline" label="Weight" value="—" unit="kg" />
          <MetricCard icon="moon-outline" label="Sleep" value="—" unit="h" />
          <MetricCard icon="pulse-outline" label="Resting HR" value="—" unit="bpm" />
          <MetricCard icon="water-outline" label="Hydration" value="—" unit="L" />
        </View>

        <View className="mx-5 mt-6 bg-[#141414] rounded-3xl border border-[#1F1F1F] py-8 px-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-[#1F1F1F] items-center justify-center mb-3">
            <Ionicons name="heart-outline" size={22} color="#71717A" />
          </View>
          <Text className="text-white font-bold" style={{ fontSize: 16 }}>
            Health tracking coming soon
          </Text>
          <Text className="text-zinc-500 text-sm text-center mt-1">
            Log entries to see trends and recovery insights.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View className="bg-[#141414] rounded-2xl border border-[#1F1F1F] p-4 flex-row items-center">
      <View className="w-11 h-11 rounded-xl bg-[#1F1F1F] items-center justify-center">
        <Ionicons name={icon} size={20} color={LIME} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-zinc-500 text-xs font-bold" style={{ letterSpacing: 1 }}>
          {label.toUpperCase()}
        </Text>
        <Text className="text-white font-bold mt-0.5" style={{ fontSize: 20 }}>
          {value}
          <Text className="text-zinc-500" style={{ fontSize: 14 }}>
            {' '}
            {unit}
          </Text>
        </Text>
      </View>
    </View>
  );
}
