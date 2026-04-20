import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const GREEN = '#22C55E';

const ACHIEVEMENTS: { id: string; title: string; icon: IoniconName; color: string; unlocked: boolean }[] = [
  { id: 'a1', title: '7-Day Streak', icon: 'flame', color: GREEN, unlocked: true },
  { id: 'a2', title: 'Early Bird', icon: 'sunny', color: '#FBBF24', unlocked: true },
  { id: 'a3', title: '100 Workouts', icon: 'trophy', color: '#8B5CF6', unlocked: true },
  { id: 'a4', title: 'Iron Warrior', icon: 'barbell', color: '#EF4444', unlocked: false },
];

const MENU_ITEMS: { id: string; icon: IoniconName; label: string; color: string }[] = [
  { id: 'm1', icon: 'person-outline', label: 'Personal Info', color: '#3B82F6' },
  { id: 'm2', icon: 'heart-outline', label: 'Health Data', color: '#EF4444' },
  { id: 'm3', icon: 'notifications-outline', label: 'Notifications', color: GREEN },
  { id: 'm4', icon: 'shield-checkmark-outline', label: 'Privacy', color: '#8B5CF6' },
  { id: 'm5', icon: 'help-circle-outline', label: 'Help & Support', color: '#52525B' },
  { id: 'm6', icon: 'settings-outline', label: 'Settings', color: '#52525B' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile header */}
        <View className="px-5 pt-2 pb-5 items-center">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: GREEN }}
          >
            <Text className="text-black font-bold text-3xl">AM</Text>
          </View>
          <Text className="text-white text-xl font-bold">Alex Morgan</Text>
          <Text className="text-zinc-500 text-sm">alex.morgan@email.com</Text>
          <View className="flex-row gap-2 mt-3">
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
              <Text className="text-xs font-semibold" style={{ color: GREEN }}>Capable Pro</Text>
            </View>
            <View className="bg-[#1F1F1F] px-3 py-1 rounded-full">
              <Text className="text-zinc-400 text-xs font-semibold">Level 24</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="mx-5 mb-5 bg-[#141414] rounded-2xl p-5 border border-[#1F1F1F]">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">147</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Workouts</Text>
            </View>
            <View className="w-px bg-[#1F1F1F]" />
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">84h</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Total Time</Text>
            </View>
            <View className="w-px bg-[#1F1F1F]" />
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">12</Text>
              <Text className="text-zinc-500 text-xs mt-0.5">Streak</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View className="px-5 mb-3 flex-row items-center justify-between">
          <Text className="text-white text-base font-bold">Achievements</Text>
          <Pressable>
            <Text className="text-xs font-semibold" style={{ color: GREEN }}>See all</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          className="mb-5"
        >
          {ACHIEVEMENTS.map((a) => (
            <View
              key={a.id}
              className="w-28 items-center p-4 rounded-2xl border"
              style={{
                backgroundColor: a.unlocked ? '#141414' : '#0F0F0F',
                borderColor: a.unlocked ? '#1F1F1F' : '#171717',
              }}
            >
              <View
                style={{ backgroundColor: a.unlocked ? `${a.color}20` : '#1A1A1A' }}
                className="w-12 h-12 rounded-full items-center justify-center mb-2"
              >
                <Ionicons name={a.icon} size={24} color={a.unlocked ? a.color : '#3F3F46'} />
              </View>
              <Text
                className="text-xs font-semibold text-center"
                style={{ color: a.unlocked ? '#ffffff' : '#3F3F46' }}
              >
                {a.title}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Menu */}
        <View className="mx-5 bg-[#141414] rounded-2xl border border-[#1F1F1F] overflow-hidden">
          {MENU_ITEMS.map((item, idx) => (
            <Pressable
              key={item.id}
              className="flex-row items-center px-4 py-4 active:opacity-70"
              style={{ borderBottomWidth: idx < MENU_ITEMS.length - 1 ? 1 : 0, borderBottomColor: '#1F1F1F' }}
            >
              <View
                style={{ backgroundColor: `${item.color}18` }}
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text className="text-white text-sm font-semibold flex-1">{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#2A2A2A" />
            </Pressable>
          ))}
        </View>

        {/* Sign out */}
        <Pressable className="mx-5 mt-4 py-3.5 bg-[#141414] rounded-2xl border border-[#1F1F1F] items-center active:opacity-70">
          <Text className="text-red-500 text-sm font-semibold">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
