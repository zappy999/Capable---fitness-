/**
 * PressableScale — drop-in Pressable that scales down on press and springs
 * back on release. Matches the subtle tactile feedback native iOS controls
 * have. Use for cards, tiles, buttons, list rows — anything the user taps.
 *
 * Reanimated's native thread keeps the spring buttery; the layout thread
 * isn't touched, so this is cheap to sprinkle everywhere.
 */
import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  /** Target scale while pressed. 1 disables the effect. Default 0.97. */
  pressedScale?: number;
  /** If true, skip the animation entirely (useful for disabled states). */
  disableAnimation?: boolean;
  /** Passed through so Tailwind/NativeWind className works as expected. */
  className?: string;
  style?: AnimatedStyle<PressableProps['style']>;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export const PressableScale = forwardRef<View, Props>(function PressableScale(
  {
    onPressIn,
    onPressOut,
    pressedScale = 0.97,
    disableAnimation = false,
    style,
    children,
    ...rest
  },
  ref,
) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      ref={ref}
      {...rest}
      onPressIn={(e) => {
        if (!disableAnimation) scale.value = withSpring(pressedScale, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!disableAnimation) scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style as object]}
    >
      {children}
    </AnimatedPressable>
  );
});
