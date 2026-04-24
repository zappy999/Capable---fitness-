/**
 * AnimatedNumber — renders an integer that eases from 0 → value on mount,
 * and animates between values when `value` changes. Uses a JS interval
 * (react state) rather than Reanimated because we need to render the digits
 * through a React <Text> child; Reanimated can't animate text content.
 *
 * Short (420ms) default duration keeps it snappy on tile mounts.
 */
import { useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';

type Props = TextProps & {
  value: number;
  /** ms. Default 420. */
  duration?: number;
  /** Renderer; receives the current animated integer. */
  format?: (n: number) => string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function AnimatedNumber({
  value,
  duration = 420,
  format = (n) => String(n),
  ...rest
}: Props) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const start = useRef<number | null>(null);

  useEffect(() => {
    from.current = display;
    start.current = Date.now();
    let cancelled = false;
    const target = value;
    const initial = display;
    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      const elapsed = now - (start.current ?? now);
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = Math.round(initial + (target - initial) * eased);
      setDisplay(next);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
    // We deliberately ignore `display` as a dep — it's the output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <Text {...rest}>{format(display)}</Text>;
}
