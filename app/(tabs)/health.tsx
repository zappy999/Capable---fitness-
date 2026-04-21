import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/WorkoutStore';
import type { CardioSession, DailyHealthMetric } from '../../src/store/types';
import { LineChart, type ChartPoint } from '../../src/components/LineChart';
import { DateField } from '../../src/components/DateField';

const LIME = '#C6F24E';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

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
            Today
          </Text>
          <Text className="text-black/70 mt-1" style={{ fontSize: 14 }}>
            Log bodyweight, recovery, and daily metrics.
          </Text>
        </View>

        <BodyweightSection />
        <DailyMetricsSection />
        <CardioSection />
        <SupplementsSection />
        <MedicationsSection />
        <WeeklyCheckinSection />
      </ScrollView>
    </SafeAreaView>
  );
}

function BodyweightSection() {
  const { bodyweight, upsertBodyweight, deleteBodyweight } = useStore();
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...bodyweight].sort((a, b) => a.date.localeCompare(b.date)),
    [bodyweight],
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const delta = latest && previous ? latest.weightKg - previous.weightKg : 0;

  const chartData = useMemo<ChartPoint[]>(
    () =>
      sorted
        .slice(-14)
        .map((b) => ({ label: b.date.slice(5), value: b.weightKg })),
    [sorted],
  );

  const avg7 = useMemo(() => {
    if (sorted.length === 0) return 0;
    const recent = sorted.slice(-7);
    return recent.reduce((a, b) => a + b.weightKg, 0) / recent.length;
  }, [sorted]);

  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text
            className="text-zinc-500 font-bold"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            BODYWEIGHT
          </Text>
          {latest ? (
            <View className="flex-row items-baseline gap-2 mt-1">
              <Text className="text-white font-bold" style={{ fontSize: 28 }}>
                {latest.weightKg}
                <Text style={{ color: '#71717A', fontSize: 15 }}> kg</Text>
              </Text>
              {previous ? (
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: delta === 0 ? '#71717A' : delta > 0 ? '#FBBF24' : LIME,
                  }}
                >
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(1)}kg
                </Text>
              ) : null}
            </View>
          ) : (
            <Text className="text-zinc-500 text-sm mt-2">No entries yet.</Text>
          )}
          {sorted.length > 0 ? (
            <Text className="text-zinc-500 text-xs mt-1">
              7-day avg {avg7.toFixed(1)}kg · {sorted.length} logged
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setOpen(true)}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: LIME }}
        >
          <Text className="text-black font-bold" style={{ fontSize: 13 }}>
            + Log
          </Text>
        </Pressable>
      </View>

      {chartData.length > 1 ? (
        <LineChart data={chartData} color={LIME} height={140} />
      ) : null}

      {sorted.length > 0 ? (
        <View className="mt-3 gap-1.5">
          {[...sorted]
            .reverse()
            .slice(0, 5)
            .map((b) => (
              <View
                key={b.id}
                className="flex-row items-center justify-between px-3 py-2 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F]"
              >
                <Text className="text-white text-sm font-semibold">
                  {b.weightKg}
                  <Text style={{ color: '#71717A' }}> kg</Text>
                </Text>
                <Text className="text-zinc-500 text-xs">{b.date}</Text>
                <Pressable
                  onPress={() => deleteBodyweight(b.id)}
                  className="p-1 active:opacity-60"
                >
                  <Ionicons name="close" size={12} color="#71717A" />
                </Pressable>
              </View>
            ))}
        </View>
      ) : null}

      <BodyweightLogModal
        visible={open}
        onClose={() => setOpen(false)}
        onSave={(date, weightKg) => {
          upsertBodyweight({ date, weightKg });
          setOpen(false);
        }}
        initialDate={todayISO()}
        initialWeight={latest?.weightKg}
      />
    </View>
  );
}

function BodyweightLogModal({
  visible,
  onClose,
  onSave,
  initialDate,
  initialWeight,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (date: string, weightKg: number) => void;
  initialDate: string;
  initialWeight?: number;
}) {
  const [date, setDate] = useState<string | undefined>(initialDate);
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : '');

  const handleSave = () => {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) return;
    if (!date) return;
    onSave(date, Math.round(w * 10) / 10);
  };

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
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                  Log bodyweight
                </Text>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </Pressable>
              </View>
              <Text className="text-zinc-500 font-bold mb-2" style={{ fontSize: 11 }}>
                WEIGHT (KG)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-4"
                style={{ paddingVertical: 14, fontSize: 20, fontWeight: '700' }}
                autoFocus
              />
              <DateField label="Date" value={date} onChange={setDate} />
              <Pressable
                onPress={handleSave}
                className="mt-4 rounded-2xl items-center"
                style={{ backgroundColor: LIME, paddingVertical: 14 }}
              >
                <Text className="text-black font-bold" style={{ fontSize: 15 }}>
                  Save
                </Text>
              </Pressable>
              <View style={{ height: 24 }} />
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function DailyMetricsSection() {
  const { dailyMetrics, upsertDailyMetric } = useStore();
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);

  const metric = useMemo(
    () => dailyMetrics.find((m) => m.date === selectedDate),
    [dailyMetrics, selectedDate],
  );

  const recentDates = useMemo(
    () =>
      [...dailyMetrics]
        .map((m) => m.date)
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 14),
    [dailyMetrics],
  );

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const patch = (p: Partial<DailyHealthMetric>) =>
    upsertDailyMetric(selectedDate, p);

  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text
            className="text-zinc-500 font-bold"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            {isToday ? `TODAY · ${today}` : selectedDate.toUpperCase()}
          </Text>
          <Text className="text-white font-bold mt-1" style={{ fontSize: 20 }}>
            Daily metrics
          </Text>
        </View>
        {!isToday ? (
          <Pressable
            onPress={() => setSelectedDate(today)}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 active:opacity-70"
          >
            <Text className="text-white text-xs font-bold">Today</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2 mb-4">
        <Pressable
          onPress={() => setSelectedDate((d) => addDaysISO(d, -1))}
          className="w-9 h-9 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] items-center justify-center active:opacity-70"
        >
          <Ionicons name="chevron-back" size={16} color="#ffffff" />
        </Pressable>
        <View className="flex-1 h-9 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] items-center justify-center">
          <Text className="text-white text-sm font-semibold">
            {selectedDate}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (isFuture || isToday) return;
            setSelectedDate((d) => addDaysISO(d, 1));
          }}
          disabled={isToday}
          className="w-9 h-9 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] items-center justify-center active:opacity-70"
          style={{ opacity: isToday ? 0.4 : 1 }}
        >
          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
        </Pressable>
      </View>

      {recentDates.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingRight: 16 }}
          className="mb-4 flex-grow-0"
        >
          {recentDates.map((d) => {
            const active = d === selectedDate;
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDate(d)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: active ? LIME : '#0D0D0D',
                  borderWidth: 1,
                  borderColor: active ? LIME : '#1F1F1F',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: active ? '#0A0A0A' : '#A1A1AA' }}
                >
                  {d.slice(5)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View className="flex-row gap-3 mb-3">
        <NumField
          label="Sleep (h)"
          value={metric?.sleepHours}
          onChange={(v) => patch({ sleepHours: v })}
          decimal
        />
        <NumField
          label="Steps"
          value={metric?.steps}
          onChange={(v) => patch({ steps: v })}
        />
        <NumField
          label="Water (L)"
          value={metric?.waterLiters}
          onChange={(v) => patch({ waterLiters: v })}
          decimal
        />
      </View>

      <RatingRow
        label="Mood"
        value={metric?.mood}
        onChange={(v) => patch({ mood: v })}
      />
      <RatingRow
        label="Stress"
        value={metric?.stress}
        onChange={(v) => patch({ stress: v })}
      />
      <RatingRow
        label="Recovery"
        value={metric?.recovery}
        onChange={(v) => patch({ recovery: v })}
      />
      <RatingRow
        label="Soreness"
        value={metric?.soreness}
        onChange={(v) => patch({ soreness: v })}
      />

      <Text
        className="text-zinc-500 font-bold mt-5 mb-2"
        style={{ fontSize: 11, letterSpacing: 1 }}
      >
        NUTRITION
      </Text>
      <View className="flex-row gap-3 mb-2">
        <NumField
          label="Calories"
          value={metric?.calories}
          onChange={(v) => patch({ calories: v })}
        />
        <NumField
          label="Protein (g)"
          value={metric?.proteinG}
          onChange={(v) => patch({ proteinG: v })}
        />
      </View>
      <View className="flex-row gap-3">
        <NumField
          label="Carbs (g)"
          value={metric?.carbsG}
          onChange={(v) => patch({ carbsG: v })}
        />
        <NumField
          label="Fat (g)"
          value={metric?.fatG}
          onChange={(v) => patch({ fatG: v })}
        />
        <NumField
          label="Fiber (g)"
          value={metric?.fiberG}
          onChange={(v) => patch({ fiberG: v })}
        />
      </View>
    </View>
  );
}

function NumField({
  label,
  value,
  onChange,
  decimal,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  decimal?: boolean;
}) {
  const [local, setLocal] = useState(value != null ? String(value) : '');
  return (
    <View className="flex-1">
      <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={local}
        onChangeText={(t) => {
          setLocal(t);
          if (t.trim() === '') {
            onChange(undefined);
            return;
          }
          const n = Number(t);
          if (Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => setLocal(value != null ? String(value) : '')}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="—"
        placeholderTextColor="#3F3F46"
        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
        style={{ paddingVertical: 10, fontSize: 14 }}
      />
    </View>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <View className="mb-2">
      <Text
        className="text-zinc-500 font-bold mb-1.5"
        style={{ fontSize: 11, letterSpacing: 0.5 }}
      >
        {label.toUpperCase()}
      </Text>
      <View className="flex-row gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(active ? undefined : n)}
              className="flex-1 h-9 rounded-xl items-center justify-center"
              style={{
                backgroundColor: active ? LIME : '#0D0D0D',
                borderWidth: 1,
                borderColor: active ? LIME : '#1F1F1F',
              }}
            >
              <Text
                className="font-bold"
                style={{
                  color: active ? '#0A0A0A' : '#A1A1AA',
                  fontSize: 14,
                }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CardioSection() {
  const { cardio, upsertCardio, deleteCardio } = useStore();
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...cardio].sort((a, b) => b.date.localeCompare(a.date)),
    [cardio],
  );

  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold" style={{ fontSize: 20 }}>
            Cardio
          </Text>
          <Text className="text-zinc-500 text-xs">
            {sorted.length} logged session{sorted.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={() => setOpen(true)}
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: LIME }}
        >
          <Text className="text-black font-bold" style={{ fontSize: 13 }}>
            + Log
          </Text>
        </Pressable>
      </View>
      {sorted.length === 0 ? (
        <Text className="text-zinc-500 text-sm italic">No cardio yet.</Text>
      ) : (
        <View className="gap-2">
          {sorted.slice(0, 5).map((c) => (
            <View
              key={c.id}
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 py-3 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-white font-bold" style={{ fontSize: 15 }}>
                  {c.activityType}
                </Text>
                <Text className="text-zinc-500 text-xs mt-0.5">
                  {c.date} · {c.durationMin} min
                  {c.distanceKm ? ` · ${c.distanceKm} km` : ''}
                  {c.avgHr ? ` · ${c.avgHr} bpm` : ''}
                </Text>
              </View>
              <Pressable onPress={() => deleteCardio(c.id)} className="p-1 active:opacity-60">
                <Ionicons name="close" size={14} color="#71717A" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <CardioModal
        visible={open}
        onClose={() => setOpen(false)}
        onSave={(data) => {
          upsertCardio(data);
          setOpen(false);
        }}
      />
    </View>
  );
}

function CardioModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<CardioSession, 'id'>) => void;
}) {
  const [date, setDate] = useState<string | undefined>(todayISO());
  const [activityType, setActivityType] = useState('Run');
  const [durationMin, setDurationMin] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const canSave = date && activityType.trim() && Number(durationMin) > 0;

  const handleSave = () => {
    if (!canSave || !date) return;
    onSave({
      date,
      activityType: activityType.trim(),
      durationMin: Number(durationMin),
      distanceKm: distanceKm ? Number(distanceKm) : undefined,
      avgHr: avgHr ? Number(avgHr) : undefined,
      calories: calories ? Number(calories) : undefined,
      notes: notes.trim() || undefined,
    });
    setDurationMin('');
    setDistanceKm('');
    setAvgHr('');
    setCalories('');
    setNotes('');
  };

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
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-bold" style={{ fontSize: 20 }}>
                  Log cardio
                </Text>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 items-center justify-center"
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </Pressable>
              </View>

              <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
                ACTIVITY
              </Text>
              <TextInput
                value={activityType}
                onChangeText={setActivityType}
                placeholder="Run, Bike, Row, …"
                placeholderTextColor="#52525B"
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-3"
                style={{ paddingVertical: 14, fontSize: 15 }}
              />

              <DateField label="Date" value={date} onChange={setDate} />

              <View className="flex-row gap-3 mt-3">
                <TextNumberField
                  label="Duration (min)"
                  value={durationMin}
                  onChange={setDurationMin}
                />
                <TextNumberField
                  label="Distance (km)"
                  value={distanceKm}
                  onChange={setDistanceKm}
                  decimal
                />
              </View>
              <View className="flex-row gap-3 mt-3">
                <TextNumberField
                  label="Avg HR"
                  value={avgHr}
                  onChange={setAvgHr}
                />
                <TextNumberField
                  label="Calories"
                  value={calories}
                  onChange={setCalories}
                />
              </View>

              <Text className="text-zinc-500 font-bold mt-3 mb-1.5" style={{ fontSize: 11 }}>
                NOTES
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional"
                placeholderTextColor="#52525B"
                multiline
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
                style={{ paddingVertical: 12, fontSize: 14, minHeight: 60 }}
              />

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className="mt-4 rounded-2xl items-center"
                style={{
                  backgroundColor: canSave ? LIME : '#1F1F1F',
                  paddingVertical: 14,
                }}
              >
                <Text
                  className="font-bold"
                  style={{
                    color: canSave ? '#0A0A0A' : '#52525B',
                    fontSize: 15,
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TextNumberField({
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
    <View className="flex-1">
      <Text className="text-zinc-500 font-bold mb-1.5" style={{ fontSize: 11 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="—"
        placeholderTextColor="#3F3F46"
        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
        style={{ paddingVertical: 10, fontSize: 14 }}
      />
    </View>
  );
}

function SupplementsSection() {
  const { supplements, upsertSupplement, deleteSupplement } = useStore();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    upsertSupplement({ name: name.trim(), dose: dose.trim() || undefined });
    setName('');
    setDose('');
  };

  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <Text className="text-white font-bold mb-3" style={{ fontSize: 20 }}>
        Supplements
      </Text>
      <View className="flex-row gap-2 mb-3">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Creatine"
          placeholderTextColor="#52525B"
          className="flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
          style={{ paddingVertical: 10, fontSize: 14 }}
        />
        <TextInput
          value={dose}
          onChangeText={setDose}
          placeholder="5g"
          placeholderTextColor="#52525B"
          className="w-20 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
          style={{ paddingVertical: 10, fontSize: 14 }}
        />
        <Pressable
          onPress={handleAdd}
          disabled={!name.trim()}
          className="px-4 rounded-xl items-center justify-center"
          style={{ backgroundColor: name.trim() ? LIME : '#1F1F1F' }}
        >
          <Ionicons
            name="add"
            size={18}
            color={name.trim() ? '#0A0A0A' : '#52525B'}
          />
        </Pressable>
      </View>
      {supplements.length === 0 ? (
        <Text className="text-zinc-500 text-sm italic">No supplements yet.</Text>
      ) : (
        <View className="gap-2">
          {supplements.map((s) => (
            <View
              key={s.id}
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 py-2 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold">{s.name}</Text>
                {s.dose ? (
                  <Text className="text-zinc-500 text-xs">{s.dose}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => deleteSupplement(s.id)}
                className="p-1 active:opacity-60"
              >
                <Ionicons name="close" size={14} color="#71717A" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MedicationsSection() {
  const { medications, upsertMedication, deleteMedication } = useStore();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    upsertMedication({
      name: name.trim(),
      dose: dose.trim() || undefined,
      unit: unit.trim() || undefined,
      frequency: 'daily',
    });
    setName('');
    setDose('');
    setUnit('');
  };

  return (
    <View className="mx-5 mt-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <Text className="text-white font-bold mb-3" style={{ fontSize: 20 }}>
        Medications
      </Text>
      <View className="flex-row gap-2 mb-3">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#52525B"
          className="flex-1 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
          style={{ paddingVertical: 10, fontSize: 14 }}
        />
        <TextInput
          value={dose}
          onChangeText={setDose}
          placeholder="Dose"
          placeholderTextColor="#52525B"
          className="w-16 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
          style={{ paddingVertical: 10, fontSize: 14 }}
        />
        <TextInput
          value={unit}
          onChangeText={setUnit}
          placeholder="mg"
          placeholderTextColor="#52525B"
          className="w-14 bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 text-white"
          style={{ paddingVertical: 10, fontSize: 14 }}
        />
        <Pressable
          onPress={handleAdd}
          disabled={!name.trim()}
          className="px-4 rounded-xl items-center justify-center"
          style={{ backgroundColor: name.trim() ? LIME : '#1F1F1F' }}
        >
          <Ionicons
            name="add"
            size={18}
            color={name.trim() ? '#0A0A0A' : '#52525B'}
          />
        </Pressable>
      </View>
      {medications.length === 0 ? (
        <Text className="text-zinc-500 text-sm italic">No medications yet.</Text>
      ) : (
        <View className="gap-2">
          {medications.map((m) => (
            <View
              key={m.id}
              className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl px-3 py-2 flex-row items-center"
            >
              <View className="flex-1">
                <Text className="text-white text-sm font-semibold">{m.name}</Text>
                <Text className="text-zinc-500 text-xs">
                  {[m.dose, m.unit, m.frequency].filter(Boolean).join(' · ') ||
                    '—'}
                </Text>
              </View>
              <Pressable
                onPress={() => deleteMedication(m.id)}
                className="p-1 active:opacity-60"
              >
                <Ionicons name="close" size={14} color="#71717A" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function startOfWeek(iso: string) {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function WeeklyCheckinSection() {
  const { weeklyCheckins, upsertCheckin } = useStore();
  const weekDate = startOfWeek(todayISO());
  const current = useMemo(
    () => weeklyCheckins.find((c) => c.weekDate === weekDate),
    [weeklyCheckins, weekDate],
  );

  return (
    <View className="mx-5 mt-5 mb-5 bg-[#141414] rounded-3xl border border-[#1F1F1F] p-5">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text
            className="text-zinc-500 font-bold"
            style={{ fontSize: 11, letterSpacing: 1 }}
          >
            WEEK OF {weekDate}
          </Text>
          <Text className="text-white font-bold mt-1" style={{ fontSize: 20 }}>
            Weekly check-in
          </Text>
        </View>
      </View>

      <Text
        className="text-zinc-500 font-bold mb-1.5"
        style={{ fontSize: 11, letterSpacing: 0.5 }}
      >
        GOALS
      </Text>
      <TextInput
        value={current?.goals ?? ''}
        onChangeText={(v) => upsertCheckin(weekDate, { goals: v || undefined })}
        placeholder="What do you want to focus on this week?"
        placeholderTextColor="#52525B"
        multiline
        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white mb-3"
        style={{ paddingVertical: 12, fontSize: 14, minHeight: 50 }}
      />

      <Text
        className="text-zinc-500 font-bold mb-1.5"
        style={{ fontSize: 11, letterSpacing: 0.5 }}
      >
        NOTES
      </Text>
      <TextInput
        value={current?.notes ?? ''}
        onChangeText={(v) => upsertCheckin(weekDate, { notes: v || undefined })}
        placeholder="How did the week feel?"
        placeholderTextColor="#52525B"
        multiline
        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl px-4 text-white"
        style={{ paddingVertical: 12, fontSize: 14, minHeight: 60 }}
      />
    </View>
  );
}
