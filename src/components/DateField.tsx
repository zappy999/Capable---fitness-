import { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

const LIME = '#22C55E';

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string | undefined): Date {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

type DateFieldProps = {
  label: string;
  value: string | undefined;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
};

export function DateField({ label, value, onChange, placeholder = 'Not set' }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selectedDate) {
        onChange(toISODate(selectedDate));
      }
      return;
    }
    if (selectedDate) onChange(toISODate(selectedDate));
  };

  const display = value ?? placeholder;
  const hasValue = Boolean(value);

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-bold" style={{ fontSize: 14 }}>
          {label}
        </Text>
        {hasValue ? (
          <Pressable onPress={() => onChange(undefined)} className="p-1 active:opacity-60">
            <Text className="text-zinc-500 text-xs">Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 flex-row items-center justify-between active:opacity-80"
        style={{ paddingVertical: 14 }}
      >
        <Text
          className="font-semibold"
          style={{ color: hasValue ? '#ffffff' : '#52525B', fontSize: 14 }}
        >
          {display}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={hasValue ? LIME : '#52525B'} />
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={parseISODate(value)}
          mode="date"
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#141414',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 16,
                paddingBottom: 32,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-bold" style={{ fontSize: 16 }}>
                  {label}
                </Text>
                <Pressable
                  onPress={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: LIME }}
                >
                  <Text className="text-black font-bold">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={parseISODate(value)}
                mode="date"
                display="spinner"
                themeVariant="dark"
                textColor="#ffffff"
                onChange={handleChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {open && Platform.OS === 'web' ? (
        <View className="mt-2">
          <DateTimePicker
            value={parseISODate(value)}
            mode="date"
            onChange={(event, selectedDate) => {
              if (selectedDate) onChange(toISODate(selectedDate));
              setOpen(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
