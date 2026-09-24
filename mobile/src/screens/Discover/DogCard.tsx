import React, { useState } from 'react';
import { View, Text, Animated, Image, Platform, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Icon } from '../../components/Icon';
import { Placeholder, Tag } from '../../ui';
import { resolveMediaUrl } from '../../utils/media';
import { Colors, Ramp } from '../../utils/theme';
import type { MatchUser, MatchDog } from '../../store/slices/matchesSlice';

export type DeckUser = MatchUser & { dogs: MatchDog[] };

export const CARD_HEIGHT = 470;

export const firstName = (name?: string) => (name ?? '').split(' ')[0];
/** "Żoliborz, Warsaw" -> "Żoliborz" (the prototype shows just the neighbourhood). */
export const neighbourhood = (location?: string) => (location ?? '').split(',')[0].trim();
export const formatDistance = (km?: number) => (km == null ? '' : `${km.toFixed(1)} km`);
export const initials = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/** linear-gradient(to bottom, transparent, rgba(22,24,38,.97) 42%): fills its (absolutely positioned) parent. */
const FadeToBg: React.FC = () => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="fade" x1="0" y1="0" x2="0" y2={String(size.h)} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#161826" stopOpacity={0} />
              <Stop offset="0.42" stopColor="#161826" stopOpacity={0.97} />
              <Stop offset="1" stopColor="#161826" stopOpacity={0.97} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={size.w} height={size.h} fill="url(#fade)" />
        </Svg>
      )}
    </View>
  );
};

/** The card behind the top one: same size, plain stripes, only visible while the top card is dragged away. */
export const BackCard: React.FC = () => (
  <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: CARD_HEIGHT }}>
    <Placeholder colors={['#1a1c29', '#1f2130']} stripe={10} radius={18} style={StyleSheet.absoluteFillObject} />
    <View pointerEvents="none" style={styles.ring3f} />
  </View>
);

/** One swipe card (a dog and its walker), drawn literally from the prototype's markup. */
export const DogCard: React.FC<{
  user: DeckUser;
  likeOpacity?: Animated.AnimatedInterpolation<number> | number;
  nopeOpacity?: Animated.AnimatedInterpolation<number> | number;
}> = ({ user, likeOpacity = 0, nopeOpacity = 0 }) => {
  const dog = user.dogs[0];
  const dist = formatDistance(user.distanceKm);
  const photo = resolveMediaUrl((dog as any)?.photoUrl);
  const loc = neighbourhood(user.location);
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: CARD_HEIGHT }}>
      {/* box-shadow: 0 0 0 1px #595d6c, 0 16px 40px rgba(0,0,0,.6) */}
      <View style={styles.shadow} />
      <View pointerEvents="none" style={styles.ring} />
      <Placeholder colors={['#1c1e2c', '#222435']} stripe={10} radius={18} style={StyleSheet.absoluteFillObject}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Text style={styles.photoLabel}>photo — {dog?.name} with {firstName(user.displayName)}</Text>
        )}

        {!!dist && (
          <View style={styles.distPill}>
            <Icon name="map-pin" size={12} color={Colors.textPrimary} />
            <Text style={{ fontSize: 12 }}>{dist}</Text>
          </View>
        )}

        <Animated.View pointerEvents="none" style={[styles.stamp, { left: 22, borderColor: Colors.primary, opacity: likeOpacity as any, transform: [{ rotate: '-12deg' }] }]}>
          <Text style={[styles.stampText, { color: Colors.primary }]}>WALK</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, { right: 22, borderColor: Ramp.neutral[300], opacity: nopeOpacity as any, transform: [{ rotate: '12deg' }] }]}>
          <Text style={[styles.stampText, { color: Ramp.neutral[300] }]}>PASS</Text>
        </Animated.View>

        <View style={styles.info}>
          <FadeToBg />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '500', letterSpacing: -0.56 }}>{dog?.name}</Text>
            <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>{dog ? `${dog.breed}, ${dog.age}` : ''}</Text>
          </View>
          <Text style={{ fontSize: 13, color: Ramp.accent[300] }}>
            {`with ${firstName(user.displayName)}${user.age ? `, ${user.age}` : ''}${loc ? ` · ${loc}` : ''}`}
          </Text>
          {!!dog?.personality?.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 5, rowGap: 5 }}>
              {dog.personality.map((t) => (
                <Tag key={t} label={t} tone="neutral" />
              ))}
            </View>
          )}
          {!!user.bio && <Text style={{ fontSize: 13, color: Ramp.neutral[300] }}>{user.bio}</Text>}
        </View>
      </Placeholder>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    ...StyleSheet.absoluteFillObject, borderRadius: 18, backgroundColor: '#1c1e2c',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 20,
  },
  ring: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 19, borderWidth: 1, borderColor: Ramp.neutral[700] },
  ring3f: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 19, borderWidth: 1, borderColor: Ramp.neutral[800] },
  photoLabel: { position: 'absolute', left: 16, top: 120, fontFamily: MONO, fontSize: 10, fontWeight: '400', lineHeight: 12, color: Ramp.neutral[500] },
  distPill: {
    position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', columnGap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(22,24,38,0.85)',
  },
  stamp: { position: 'absolute', top: 40, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 2, borderRadius: 8 },
  stampText: { fontSize: 20, fontWeight: '500', letterSpacing: 1.2 },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 80, paddingHorizontal: 18, paddingBottom: 18, rowGap: 7 },
});
