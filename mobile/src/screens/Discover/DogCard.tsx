import React, { useState } from 'react';
import { View, Text, Animated, Image, Platform, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Placeholder, Tag, ShelterHeartBadge } from '../../ui';
import { resolveMediaUrl } from '../../utils/media';
import { Colors, Ramp } from '../../utils/theme';
import { temperamentLabel } from '../../utils/dogLabels';
import type { DeckCard as DeckCardType } from '../../store/slices/matchesSlice';

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

/** One swipe card: either a person with their dog, or (see ShelterHeartBadge) a shelter's individual adoptable dog. */
export const DogCard: React.FC<{
  card: DeckCardType;
  likeOpacity?: Animated.AnimatedInterpolation<number> | number;
  nopeOpacity?: Animated.AnimatedInterpolation<number> | number;
}> = ({ card, likeOpacity = 0, nopeOpacity = 0 }) => {
  const { t } = useTranslation();
  const isShelterDog = card.kind === 'shelterDog';
  const view = card.kind === 'shelterDog'
    ? {
        dog: card.dog,
        loc: neighbourhood(card.shelter.location),
        subtitle: t('discover.card.fromShelter', { name: firstName(card.shelter.displayName) }),
        // A shelter dog has no separate "owner" — only its own note is shown.
        note: card.dog.bio,
        ownerBio: undefined as string | undefined,
      }
    : {
        dog: card.dogs[0],
        loc: neighbourhood(card.location),
        subtitle: card.age
          ? t('discover.card.withPersonAge', { name: firstName(card.displayName), age: card.age })
          : t('discover.card.withPerson', { name: firstName(card.displayName) }),
        // The dog's own note is the card's main text; the person's own bio is a shorter line under it.
        note: card.dogs[0]?.bio,
        ownerBio: card.bio,
      };
  const { dog, loc, subtitle, note, ownerBio } = view;
  const dist = formatDistance(card.distanceKm);
  const photo = resolveMediaUrl(dog?.photoUrl);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: CARD_HEIGHT }}>
      {/* box-shadow: 0 0 0 1px #595d6c, 0 16px 40px rgba(0,0,0,.6) */}
      <View style={styles.shadow} />
      <View pointerEvents="none" style={styles.ring} />
      <Placeholder colors={['#1c1e2c', '#222435']} stripe={10} radius={18} style={StyleSheet.absoluteFillObject}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Text style={styles.photoLabel}>photo — {dog?.name} {subtitle}</Text>
        )}

        {isShelterDog && <ShelterHeartBadge size={44} style={styles.shelterBadge} />}

        {!!dist && (
          <View style={[styles.distPill, isShelterDog && { left: undefined, right: 14 }]}>
            <Icon name="map-pin" size={12} color={Colors.textPrimary} />
            <Text style={{ fontSize: 12 }}>{dist}</Text>
          </View>
        )}

        <Animated.View pointerEvents="none" style={[styles.stamp, { left: 22, borderColor: Colors.primary, opacity: likeOpacity as any, transform: [{ rotate: '-12deg' }] }]}>
          <Text style={[styles.stampText, { color: Colors.primary }]}>{t('discover.card.stampWalk')}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, { right: 22, borderColor: Ramp.neutral[300], opacity: nopeOpacity as any, transform: [{ rotate: '12deg' }] }]}>
          <Text style={[styles.stampText, { color: Ramp.neutral[300] }]}>{t('discover.card.stampPass')}</Text>
        </Animated.View>

        <View style={styles.info}>
          <FadeToBg />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '500', letterSpacing: -0.56 }}>{dog?.name}</Text>
            <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>{dog ? t('discover.card.breedAge', { breed: dog.breed, age: dog.age }) : ''}</Text>
          </View>
          <Text style={{ fontSize: 13, color: Ramp.accent[300] }}>{subtitle + (loc ? ` · ${loc}` : '')}</Text>
          {!!dog?.personality?.length && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 5, rowGap: 5 }}>
              {dog.personality.map((p) => (
                <Tag key={p} label={temperamentLabel(t, p)} tone="neutral" />
              ))}
            </View>
          )}
          {!!note && <Text style={{ fontSize: 14, lineHeight: 19.6, color: Colors.textPrimary }}>{note}</Text>}
          {!!ownerBio && <Text numberOfLines={1} style={{ fontSize: 12, lineHeight: 16.8, color: Ramp.neutral[400] }}>{ownerBio}</Text>}
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
  shelterBadge: { position: 'absolute', top: 12, left: 12 },
  stamp: { position: 'absolute', top: 40, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 2, borderRadius: 8 },
  stampText: { fontSize: 20, fontWeight: '500', letterSpacing: 1.2 },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 80, paddingHorizontal: 18, paddingBottom: 18, rowGap: 7 },
});
