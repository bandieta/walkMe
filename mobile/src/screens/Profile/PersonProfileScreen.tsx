import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { usersApi } from '../../services/api';
import { Icon, IconName } from '../../components/Icon';
import { Placeholder, PrettyText, Btn, useScreenInsets } from '../../ui';
import { cssText } from '../../ui/cssLine';
import { ProfileAvatar } from './ProfileAvatar';
import { resolveMediaUrl } from '../../utils/media';
import { ageGroupFromAge } from '../../utils/dogLabels';
import { firstName } from '../Discover/DogCard';
import { Colors, Ramp } from '../../utils/theme';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';
const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];
const PROVIDER_ICON: Partial<Record<string, IconName>> = {
  google: 'google-logo',
  facebook: 'facebook-logo',
  apple: 'apple-logo',
  email: 'envelope',
};

/** "Mar 2026" — a coarser grain than whenLong's day-level dates suits "member since". */
function monthYear(t: TFunction, iso: string) {
  const d = new Date(iso);
  return `${t(`common.monthsShort.${MONTH_KEYS[d.getMonth()]}`)} ${d.getFullYear()}`;
}

interface PersonDog {
  id: string;
  name: string;
  breed: string;
  age: number;
  ageGroup?: string;
  energy?: string;
  bio?: string;
  photoUrl?: string;
}

interface PersonData {
  id: string;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  location?: string;
  provider?: string;
  createdAt: string;
  dogs: PersonDog[];
  stats: { walks: number; friends: number; km: number };
}

/**
 * A shelter's view of a walker in a dog-request conversation ("07b person profile" in the design handoff):
 * only real, computable trust signals — no invented rating. Reachable from DogRequestChatScreen's header,
 * shelter side only (see ThreadView's onTitlePress). Read-only: this is never the viewer's own profile, so
 * there's no edit affordance anywhere on the screen.
 */
export const PersonProfileScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { top } = useScreenInsets();
  const { userId, name, photoUrl } = route.params as {
    userId: string;
    name?: string;
    photoUrl?: string;
  };
  const [person, setPerson] = useState<PersonData | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  // Bumped by the "Try again" button to force the effect below to refetch without duplicating its body.
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setLoading(true);
    usersApi
      .getProfile(userId)
      .then((res) => alive && setPerson(res.data as PersonData))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, reloadTick]);

  const load = () => setReloadTick((n) => n + 1);

  const displayName = person?.displayName ?? name ?? '';
  const providerIcon = person?.provider && PROVIDER_ICON[person.provider];
  const providerLabel =
    person?.provider && t(`personProfile.providers.${person.provider}`, { defaultValue: '' });
  const showVerified = !!providerIcon && !!providerLabel;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 4,
          paddingTop: top - 4,
          paddingRight: 16,
          paddingBottom: 4,
          paddingLeft: 8,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
          })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('personProfile.title')}</Text>
      </View>

      {loading && !person ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : failed && !person ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            rowGap: 14,
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 14, color: Ramp.neutral[400], textAlign: 'center' }}>
            {t('personProfile.loadFailed')}
          </Text>
          <Btn label={t('personProfile.tryAgain')} variant="neutral" onPress={load} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: 32,
            rowGap: 26,
          }}
        >
          {/* identity */}
          <View style={{ alignItems: 'center', rowGap: 12 }}>
            <View style={{ width: 88, height: 88 }}>
              <ProfileAvatar
                name={displayName}
                photoUrl={person?.photoUrl ?? photoUrl}
                size={88}
                ring
              />
              {!!providerIcon && (
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    bottom: -2,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: Colors.surfaceDark,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: Colors.backgroundDark,
                  }}
                >
                  <Icon name={providerIcon} size={14} color={Ramp.neutral[200]} />
                </View>
              )}
            </View>
            <View style={{ alignItems: 'center', rowGap: 4 }}>
              <Text
                style={{ fontSize: 22, fontWeight: '500', letterSpacing: -0.3 }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 6,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {!!person?.location && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
                    <Icon name="map-pin" size={13} color={Ramp.neutral[500]} />
                    <Text style={cssText(13, { color: Ramp.neutral[400] })}>{person.location}</Text>
                  </View>
                )}
                {!!person?.location && !!person?.createdAt && (
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: Ramp.neutral[600],
                    }}
                  />
                )}
                {!!person?.createdAt && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
                    <Icon name="calendar-blank" size={13} color={Ramp.neutral[500]} />
                    <Text style={cssText(13, { color: Ramp.neutral[400] })}>
                      {t('personProfile.memberSince', { date: monthYear(t, person.createdAt) })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {showVerified && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: 'rgba(127,200,169,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(127,200,169,0.28)',
                }}
              >
                <Icon name="shield-check" size={13} color={Colors.success} />
                <Text style={cssText(12, { fontWeight: '500', color: Colors.success })}>
                  {t('personProfile.identityConfirmed', { provider: providerLabel })}
                </Text>
              </View>
            )}
          </View>

          {!!person?.bio && (
            <PrettyText style={cssText(14, { color: Ramp.neutral[300] })}>{person.bio}</PrettyText>
          )}

          {/* stats */}
          {!!person && (
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.1,
                  color: Ramp.neutral[500],
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                {t('personProfile.statsTitle')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: Colors.surfaceDark,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {[
                  [person.stats.walks, t('personProfile.stats.walks')],
                  [person.stats.friends, t('personProfile.stats.friends')],
                  [person.stats.km, t('personProfile.stats.km')],
                ].map(([value, label], i) => (
                  <View
                    key={label as string}
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 6,
                        alignItems: 'center',
                        rowGap: 2,
                      },
                      i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(233,233,237,0.10)' },
                    ]}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '500', letterSpacing: -0.2 }}>
                      {value}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={cssText(11, { color: Ramp.neutral[500], textAlign: 'center' })}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* trust note */}
          <View
            style={{
              flexDirection: 'row',
              columnGap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(145,132,217,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(145,132,217,0.20)',
            }}
          >
            <Icon name="info" size={16} color={Colors.primary} />
            <Text style={cssText(12.5, { color: Ramp.neutral[300], flex: 1 })}>
              {t('personProfile.trustNote')}
            </Text>
          </View>

          {/* their dogs */}
          {!!person?.dogs?.length && (
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.1,
                  color: Ramp.neutral[500],
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('personProfile.dogsTitle')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}
              >
                {person.dogs.map((d) => (
                  <View
                    key={d.id}
                    style={{
                      width: 132,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: Colors.surfaceDark,
                    }}
                  >
                    {d.photoUrl ? (
                      <Image
                        source={{ uri: resolveMediaUrl(d.photoUrl) }}
                        style={{ height: 76, borderRadius: 8, backgroundColor: '#1f2130' }}
                      />
                    ) : (
                      <Placeholder
                        label="dog photo"
                        style={{ height: 76, borderRadius: 8 }}
                        padding={6}
                      />
                    )}
                    <View style={{ marginTop: 8 }}>
                      <Text style={cssText(13.5, { fontWeight: '500' })} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={cssText(11.5, { color: Ramp.neutral[500] })} numberOfLines={1}>
                        {d.breed} · {ageGroupFromAge(t, d.age, d.ageGroup)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <Text
            style={cssText(11.5, { color: Ramp.neutral[600], textAlign: 'center', paddingTop: 4 })}
          >
            {t('personProfile.footerNote', { name: firstName(displayName) })}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};
