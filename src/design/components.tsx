import { ReactNode } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  MONO,
  accentAlpha,
  cardSmStyle,
  muscleColor,
  statCellStyle,
} from './tokens';

// ── ModernHeader ──────────────────────────────────────────────────────
// Used on every top-level + detail screen. Circular barbell mark on roots;
// pass `dropMark` on detail screens where the back arrow already frames the page.
export function ModernHeader({
  eyebrow = 'Capable',
  title,
  sub,
  badge,
  accent,
  back = false,
  action = true,
  onAction,
  actionIcon = 'settings-sharp',
  dropMark = false,
}: {
  eyebrow?: string;
  title: string | ReactNode;
  sub?: string;
  badge?: string;
  accent: string;
  back?: boolean;
  action?: boolean;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  dropMark?: boolean;
}) {
  return (
    <View
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: back ? 4 : 14,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {!dropMark && (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="barbell" size={13} color={COLORS.onAccent} />
            </View>
          )}
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: COLORS.muted,
              letterSpacing: -0.1,
            }}
          >
            {eyebrow}
          </Text>
          {badge ? (
            <View
              style={{
                paddingVertical: 2,
                paddingHorizontal: 7,
                borderRadius: 999,
                backgroundColor: accentAlpha(accent, 0.133),
                borderWidth: 1,
                borderColor: accentAlpha(accent, 0.22),
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: accent,
                  letterSpacing: -0.05,
                }}
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            lineHeight: 34,
            letterSpacing: -1,
            color: COLORS.text,
          }}
        >
          {title}
        </Text>
        {sub ? (
          <Text
            style={{
              fontSize: 13,
              color: COLORS.subtle,
              marginTop: 6,
              lineHeight: 18,
            }}
          >
            {sub}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable
          onPress={onAction}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={actionIcon} size={14} color={COLORS.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── NavTop (back chevron) ──────────────────────────────────────────────
export function NavTop({
  onBack,
  right,
}: {
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View
      style={{
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Pressable
        onPress={onBack}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chevron-back" size={18} color={COLORS.text} />
      </Pressable>
      {right ?? <View style={{ width: 38 }} />}
    </View>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────
export function Stat({
  icon,
  value,
  suffix,
  label,
  accent,
  iconColor,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  value: string | number;
  suffix?: string;
  label: string;
  accent: string;
  iconColor?: string;
}) {
  return (
    <View style={statCellStyle}>
      {icon ? (
        <Ionicons name={icon} size={18} color={iconColor ?? accent} />
      ) : null}
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: '800',
          letterSpacing: -0.44,
          color: COLORS.text,
          marginTop: 6,
          marginBottom: 2,
        }}
      >
        {value}
        {suffix ? (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: COLORS.muted,
            }}
          >
            {' '}
            {suffix}
          </Text>
        ) : null}
      </Text>
      <Text style={{ fontSize: 11, color: COLORS.subtle, letterSpacing: -0.1 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Segmented control ──────────────────────────────────────────────────
export function Segmented<T extends string>({
  tabs,
  active,
  onChange,
  accent,
}: {
  tabs: T[];
  active: T;
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 999,
        padding: 4,
        marginHorizontal: 20,
      }}
    >
      {tabs.map((t) => {
        const on = t === active;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: on ? accent : 'transparent',
            }}
          >
            <Text
              style={{
                color: on ? COLORS.onAccent : COLORS.muted,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Muscle tag (colored dot + uppercase label) ────────────────────────
export function MuscleTag({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View
        style={{
          width: small ? 5 : 6,
          height: small ? 5 : 6,
          borderRadius: small ? 2.5 : 3,
          backgroundColor: muscleColor(name),
        }}
      />
      <Text
        style={{
          fontSize: small ? 10 : 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: COLORS.muted,
          textTransform: 'uppercase',
        }}
      >
        {name}
      </Text>
    </View>
  );
}

// ── Badge (pill) ───────────────────────────────────────────────────────
export function Badge({
  children,
  variant = 'accent',
  accent,
  style,
  textStyle,
}: {
  children: ReactNode;
  variant?: 'accent' | 'muted' | 'yellow' | 'blue';
  accent: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const palette = {
    accent: {
      bg: accentAlpha(accent, 0.133),
      border: accentAlpha(accent, 0.22),
      color: accent,
    },
    muted: {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      color: COLORS.muted,
    },
    yellow: {
      bg: 'rgba(234,179,8,0.133)',
      border: 'rgba(234,179,8,0.4)',
      color: '#EAB308',
    },
    blue: {
      bg: 'rgba(96,165,250,0.133)',
      border: 'rgba(96,165,250,0.4)',
      color: '#60A5FA',
    },
  }[variant];
  return (
    <View
      style={[
        {
          paddingVertical: 3,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          { fontSize: 10, fontWeight: '800', color: palette.color, letterSpacing: -0.05 },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// ── Card primitive (use inline if you need extra props) ───────────────
export function Card({
  children,
  style,
  muscle,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  muscle?: string;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 24,
          padding: 20,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {muscle ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: muscleColor(muscle),
          }}
        />
      ) : null}
      {children}
    </View>
  );
}

export function CardSm({
  children,
  style,
  muscle,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  muscle?: string;
  onPress?: () => void;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={[cardSmStyle, { overflow: 'hidden' }, style]}
    >
      {muscle ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            backgroundColor: muscleColor(muscle),
          }}
        />
      ) : null}
      {children}
    </Wrap>
  );
}

// ── Number display (tabular monospace) ────────────────────────────────
export function NumMono({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[{ fontFamily: MONO, letterSpacing: -0.1 }, style]}>
      {children}
    </Text>
  );
}
