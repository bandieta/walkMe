import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../utils/theme';
import { Placeholder, PrettyText, ShelterHeartBadge, Tag } from '../ui';
import { resolveMediaUrl } from '../utils/media';
import { ageGroupFromAge, energyLabel, temperamentLabel } from '../utils/dogLabels';

export interface DogDetailsCardDog {
  name: string;
  breed: string;
  age: number;
  ageGroup?: string;
  energy?: string;
  personality?: string[];
  bio?: string;
  photoUrl?: string;
}

/**
 * The prototype's "dog details" bottom sheet (`dd.show` in the design handoff): a photo, name + breed, an
 * age/energy line, temperament tags and the dog's note, closed by the backdrop or the Close button. Generic —
 * any screen with a dog and a tap target can open it; the shelter heart badge only shows for `shelter` dogs,
 * same rule as everywhere else ShelterHeartBadge appears.
 */
export const DogDetailsCard: React.FC<{
  visible: boolean;
  dog: DogDetailsCardDog | null;
  shelter?: boolean;
  onClose: () => void;
}> = ({ visible, dog, shelter, onClose }) => {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      return;
    }
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const photo = dog ? resolveMediaUrl(dog.photoUrl) : undefined;
  const meta = dog
    ? [ageGroupFromAge(t, dog.age, dog.ageGroup), dog.energy && energyLabel(t, dog.energy)]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Modal
      visible={visible && !!dog}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(41,43,49,0.6)',
            opacity: anim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
        {dog && (
          <Animated.View
            style={{
              paddingTop: 10,
              paddingHorizontal: 24,
              paddingBottom: 34,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              backgroundColor: Colors.surfaceDark,
              rowGap: 14,
              // box-shadow: 0 0 0 1px neutral-500, 0 -16px 40px rgba(0,0,0,.65)
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -16 },
              shadowOpacity: 0.65,
              shadowRadius: 40,
              elevation: 24,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
              opacity: anim,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -1,
                left: -1,
                right: -1,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                borderWidth: 1,
                borderColor: Ramp.neutral[500],
              }}
            />
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Ramp.neutral[700],
                alignSelf: 'center',
              }}
            />

            <View style={{ height: 170, borderRadius: 12, overflow: 'hidden' }}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Placeholder
                  label={'dog photo'}
                  style={{ width: '100%', height: '100%' }}
                  padding={10}
                />
              )}
              {/* Bigger here than the 38px the prototype's small photo strip used — this is the one place a
                  shelter dog gets a full hero photo, so the badge reads at that same scale. */}
              {shelter && (
                <ShelterHeartBadge size={56} style={{ position: 'absolute', top: 12, left: 12 }} />
              )}
            </View>

            <View style={{ rowGap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: '500' }}>{dog.name}</Text>
                <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>{dog.breed}</Text>
              </View>
              {!!meta && <Text style={{ fontSize: 13, color: Ramp.accent[300] }}>{meta}</Text>}
            </View>

            {!!dog.personality?.length && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 5, rowGap: 5 }}>
                {dog.personality.map((p) => (
                  <Tag key={p} label={temperamentLabel(t, p)} tone="neutral" />
                ))}
              </View>
            )}

            {!!dog.bio && (
              <PrettyText style={{ fontSize: 14, lineHeight: 21, color: Ramp.neutral[300] }}>
                {dog.bio}
              </PrettyText>
            )}

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(233,233,237,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
              })}
            >
              <Text style={{ fontSize: 15, color: Colors.textPrimary }}>{t('common.close')}</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};
