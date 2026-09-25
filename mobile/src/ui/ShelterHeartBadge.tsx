import React, { useRef } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle } from 'react-native-svg';
import { Icon } from '../components/Icon';
import { Colors } from '../utils/theme';

/**
 * Phosphor's "heart" glyph (fill weight), in its native 0 0 256 256 viewBox — copied out of
 * phosphor-react-native so this one glyph can be gradient-filled. `Icon` always renders a flat `color`;
 * there's no RN equivalent of the prototype's `background-clip: text` trick for gradient-filling a font icon.
 */
const HEART_PATH =
  'M240 102c0 70-103.79 126.66-108.21 129a8 8 0 0 1-7.58 0C119.79 228.66 16 172 16 102a62.07 62.07 0 0 1 62-62c20.65 0 38.73 8.88 50 23.89C139.27 48.88 157.35 40 178 40a62.07 62.07 0 0 1 62 62';

// The prototype's gradient is `linear-gradient(160deg, oklch(0.8 0.11 15) 0%, oklch(0.7 0.14 15) 45%,
// var(--color-accent) 100%)`. RN / react-native-svg don't parse oklch(), so these are that same gradient
// converted to sRGB, and GRADIENT_LINE is 160deg converted to SVG's objectBoundingBox start/end points.
const GRADIENT_STOPS: [string, string, string] = ['#fca0a7', '#e87782', Colors.primary];
const GRADIENT_LINE = { x1: '28%', y1: '-10%', x2: '72%', y2: '110%' };

let nextId = 0;

/**
 * The design system's mark for "this dog belongs to a shelter, not a person": a heart that fades from a soft
 * rose into the app's purple accent, with a small house glyph centred on it in solid ground colour, at 88%
 * opacity, and a soft accent-coloured glow behind it (the prototype's `drop-shadow` + `background-clip: text`
 * on a single icon). Used on a shelter dog's Discover card, on a connected shelter dog in a walker's profile,
 * on shelter-dog avatars in chat, and anywhere else a shelter dog needs to read as one at a glance.
 *
 * Both the gradient fill and the glow are drawn with react-native-svg rather than RN's `shadow*` / `elevation`
 * props — Android drops colour from shadows entirely (see SplashScreen's glow, which hit the same wall).
 */
export const ShelterHeartBadge: React.FC<{ size?: number; style?: object }> = ({ size = 28, style }) => {
  const id = useRef(`shelterHeart${nextId++}`).current;
  // filter: drop-shadow(0 0 Npx rgba(145,132,217,.45)) in the prototype, N scaling with the badge (5px at
  // 16px up to 15px at 44px) — approximated here as a soft radial glow sized relative to the badge.
  const glowSize = size * 2.2;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg
        width={glowSize}
        height={glowSize}
        style={{ position: 'absolute', left: (size - glowSize) / 2, top: (size - glowSize) / 2 }}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.45} />
            <Stop offset="55%" stopColor={Colors.primary} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill={`url(#${id}-glow)`} />
      </Svg>

      <View style={{ width: size, height: size, opacity: 0.88 }}>
        <Svg width={size} height={size} viewBox="0 0 256 256">
          <Defs>
            <LinearGradient id={`${id}-fill`} x1={GRADIENT_LINE.x1} y1={GRADIENT_LINE.y1} x2={GRADIENT_LINE.x2} y2={GRADIENT_LINE.y2}>
              <Stop offset="0%" stopColor={GRADIENT_STOPS[0]} />
              <Stop offset="45%" stopColor={GRADIENT_STOPS[1]} />
              <Stop offset="100%" stopColor={GRADIENT_STOPS[2]} />
            </LinearGradient>
          </Defs>
          <Path d={HEART_PATH} fill={`url(#${id}-fill)`} />
        </Svg>
        {/* The house sits centred on the heart, same as `left:50%;top:36%;transform:translateX(-50%)` in the prototype. */}
        <View style={{ position: 'absolute', top: size * 0.36, left: 0, right: 0, alignItems: 'center' }}>
          <Icon name="house" weight="fill" size={size * 0.42} color={Colors.backgroundDark} />
        </View>
      </View>
    </View>
  );
};
