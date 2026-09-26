import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../services/api';
import { Icon } from './Icon';
import { ShelterHeartBadge } from '../ui';
import { cssText } from '../ui/cssLine';
import { resolveMediaUrl } from '../utils/media';
import { Colors, Ramp } from '../utils/theme';

interface WalkableDog {
  id: string;
  name: string;
  breed: string;
  photoUrl?: string;
}

const DIV = 'rgba(233,233,237,0.16)';

/**
 * "Which dogs are you bringing?" — a multi-select list of every dog this user can bring (their own, plus any
 * shelter dog they're approved to walk — the same source CreateWalkScreen's single-select dog chip uses).
 * Shared by CreateEventScreen (organizer's dogs) and EventDetailScreen's join sheet (attendee's dogs), since an
 * event RSVP can name more than one dog, unlike a walk's single `dogId`.
 */
export const DogMultiSelect: React.FC<{
  selectedIds: string[];
  onToggle: (dogId: string) => void;
}> = ({ selectedIds, onToggle }) => {
  const { t } = useTranslation();
  const [dogs, setDogs] = useState<{ ownDogs: WalkableDog[]; shelterDogs: WalkableDog[] } | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    usersApi
      .getWalkableDogs()
      .then(
        (res) =>
          alive && setDogs(res.data as { ownDogs: WalkableDog[]; shelterDogs: WalkableDog[] }),
      )
      .catch(() => alive && setDogs({ ownDogs: [], shelterDogs: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const all = dogs
    ? [
        ...dogs.ownDogs.map((d) => ({ ...d, shelter: false })),
        ...dogs.shelterDogs.map((d) => ({ ...d, shelter: true })),
      ]
    : [];
  if (dogs && all.length === 0) {
    return null;
  }

  return (
    <View style={{ rowGap: 8 }}>
      {all.map((dog) => {
        const on = selectedIds.includes(dog.id);
        const uri = resolveMediaUrl(dog.photoUrl);
        return (
          <Pressable
            key={dog.id}
            onPress={() => onToggle(dog.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 10,
              height: 60,
              paddingHorizontal: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: on ? Colors.primary : DIV,
              backgroundColor: on ? 'rgba(145,132,217,0.10)' : Colors.surfaceDark,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: Ramp.accent[800],
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {uri ? (
                <Image source={{ uri }} style={{ width: 40, height: 40 }} />
              ) : (
                <Text style={cssText(12, { fontWeight: '600', color: Ramp.accent[200] })}>
                  {dog.name.slice(0, 2).toUpperCase()}
                </Text>
              )}
              {dog.shelter && (
                <ShelterHeartBadge
                  size={16}
                  style={{ position: 'absolute', bottom: -3, right: -3 }}
                />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={cssText(13.5, { fontWeight: '500' })}>
                {dog.name}
              </Text>
              <Text numberOfLines={1} style={cssText(11.5, { color: Ramp.neutral[500] })}>
                {dog.breed}
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 1.5,
                marginLeft: 'auto',
                borderColor: on ? Colors.primary : Ramp.neutral[500],
                backgroundColor: on ? Colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on && <Icon name="check" size={11} color={Colors.backgroundDark} />}
            </View>
          </Pressable>
        );
      })}
      {dogs === null && (
        <Text style={cssText(12, { color: Ramp.neutral[500] })}>
          {t('common.loading', { defaultValue: '…' })}
        </Text>
      )}
    </View>
  );
};
