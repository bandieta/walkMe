import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The prototype lays screens out in a 390x844 frame with a 47pt status area on top (it starts content at y=56)
 * and a 34pt home-indicator area at the bottom. This maps those constants onto the real device insets, so the
 * layout matches the design exactly on a 390x844 iPhone and adapts everywhere else.
 */
export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  return {
    /** Where screen content starts. 56 on the design's 390x844 frame (47 inset + 9). */
    top: (Platform.OS === 'android' ? Math.max(insets.top, 47) : insets.top) + 9,
    /** Bottom clearance for anchored buttons. 34 on the design's frame. */
    bottom: Platform.OS === 'android' ? Math.max(insets.bottom, 34) : Math.max(insets.bottom, 24),
    insets,
  };
}
