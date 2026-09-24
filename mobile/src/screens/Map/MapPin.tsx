import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { Icon, IconName } from '../../components/Icon';
import { Colors, Ramp } from '../../utils/theme';

// Marker canvas: the 40px pin (+6px highlight ring) is centred in a fixed box, with room below for the live tag
// and above for symmetry, so the coordinate always sits at the pin's centre.
const W = 76;
const H = 96;
const CIRCLE = 40;
const RING = 52;

/** Keeps the native marker re-rendering for a moment after a visual change, then freezes it (cheap on both platforms). */
function useTracksViewChanges(...deps: unknown[]) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return tracks;
}

/** The prototype's map pin: 40px surface disc, 1.5px border, 17px glyph; live/selected pins turn accent with a 6px halo. */
export const PinMarker: React.FC<{
  latitude: number; longitude: number; icon: IconName; live: boolean; selected: boolean; tag: string; onPress: () => void;
}> = ({ latitude, longitude, icon, live, selected, tag, onPress }) => {
  const hi = selected || live;
  const tracks = useTracksViewChanges(hi, selected, tag, icon);
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      centerOffset={{ x: 0, y: 0 }}
      zIndex={selected ? 3 : live ? 2 : 1}
      tracksViewChanges={tracks}
      onPress={(e) => {
        (e as any).stopPropagation?.();
        onPress();
      }}
    >
      <View style={{ width: W, height: H, alignItems: 'center' }} collapsable={false}>
        <View style={{ position: 'absolute', top: (H - RING) / 2, width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
          {hi && <View style={{ position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, backgroundColor: 'rgba(145,132,217,0.16)' }} />}
          <View
            style={{
              width: CIRCLE, height: CIRCLE, borderRadius: CIRCLE / 2, alignItems: 'center', justifyContent: 'center',
              backgroundColor: selected ? Ramp.accent[900] : Colors.surfaceDark,
              borderWidth: 1.5, borderColor: hi ? Colors.primary : Ramp.neutral[600],
              ...(hi ? null : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 }),
            }}
          >
            <Icon name={icon} size={17} color={hi ? Colors.primary : Ramp.neutral[300]} />
          </View>
        </View>
        {live && (
          <View
            style={{
              position: 'absolute', top: H / 2 + CIRCLE / 2 + 4, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4,
              backgroundColor: Colors.backgroundDark,
            }}
          >
            <Text style={{ fontSize: 10, color: Ramp.accent[200] }} numberOfLines={1}>{tag}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

/** "You are here": 16px accent dot with a 2px ground-coloured rim and a slow 16px pulse (the prototype's wmPulse). */
export const MeMarker: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }} centerOffset={{ x: 0, y: 0 }} tracksViewChanges zIndex={0} tappable={false}>
      <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }} collapsable={false}>
        <Animated.View
          style={{
            position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
          }}
        />
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.backgroundDark }} />
      </View>
    </Marker>
  );
};
