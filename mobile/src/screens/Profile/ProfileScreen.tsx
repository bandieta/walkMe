import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../store';
import { logoutAndInvalidate } from '../../store/slices/authSlice';
import { fetchMyDogs } from '../../store/slices/dogsSlice';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { fetchDogRequests } from '../../store/slices/shelterRequestsSlice';
import { usersApi } from '../../services/api';
import { ageGroupFromAge } from '../../utils/dogLabels';
import { Icon, IconName } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Hairline, Toggle, Placeholder, ShelterHeartBadge, useScreenInsets } from '../../ui';
import { cssText } from '../../ui/cssLine';
import { resolveMediaUrl } from '../../utils/media';
import { Colors, Ramp } from '../../utils/theme';
import { ProfileAvatar } from './ProfileAvatar';

const Overline: React.FC<{ children: string }> = ({ children }) => (
  <Text style={styles.overline}>{children.toUpperCase()}</Text>
);

export const ProfileScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const user = useSelector((s: RootState) => s.auth.user);
  const dogs = useSelector((s: RootState) => s.dogs.dogs) as any[];
  const walks = useSelector((s: RootState) => s.walks.walks) as any[];
  const events = useSelector((s: RootState) => s.events.events) as any[];
  const dogRequests = useSelector((s: RootState) => s.shelterRequests.requests);
  const unreadNotifications = useSelector((s: RootState) => s.notifications.unreadCount);
  const isShelter = user?.accountType === 'shelter';
  // A person's accepted shelter-dog connections — shown with the design system's heart badge (ShelterHeartBadge).
  const connectedShelterDogs = isShelter ? [] : dogRequests.filter((r) => r.status === 'accepted');
  const [stats, setStats] = useState<{ walks: number; friends: number; km: number } | null>(null);
  const [prefs, setPrefs] = useState({ loc: true });
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { show: showToast, element: toastElement } = useToast();

  useEffect(() => {
    dispatch(fetchMyDogs());
    dispatch(fetchNearbyWalks({}));
    dispatch(fetchEvents());
    dispatch(fetchDogRequests());
    usersApi.getStats().then((r) => setStats(r.data)).catch(() => undefined);
  }, [dispatch]);

  // Edit profile hands back "Profile saved" through a route param (the prototype toasts after popping back).
  const toastParam: string | undefined = route?.params?.toast;
  useEffect(() => {
    if (!toastParam) return;
    showToast(toastParam);
    navigation.setParams?.({ toast: undefined });
  }, [toastParam, showToast, navigation]);

  const radius = user?.radiusKm ?? 2;
  const radiusLabel = `${Number.isInteger(radius) ? radius : radius.toFixed(1)} km`;
  const upcoming =
    walks.filter((w) => w.status !== 'ended' && (w.participantIds ?? []).includes(user?.id)).length +
    events.filter((e) => e.isJoined && e.status !== 'ended').length;
  const ageGroupOf = (d: any) => ageGroupFromAge(t, d.age, d.ageGroup);

  const prefRows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'loc', label: t('profile.preferences.shareLocation.label'), desc: t('profile.preferences.shareLocation.desc') },
  ];
  const menuRows: { icon: IconName; label: string; meta: string; go: () => void }[] = [
    { icon: 'path', label: t('profile.account.walksEvents.label'), meta: t('profile.account.walksEvents.upcoming', { count: upcoming }), go: () => navigation.navigate('MyWalks') },
    { icon: 'sliders-horizontal', label: t('profile.account.rhythm'), meta: radiusLabel, go: () => navigation.navigate('Rhythm') },
    { icon: 'globe', label: t('profile.account.language'), meta: '', go: () => navigation.navigate('Language') },
    { icon: 'bell', label: t('profile.account.notifications'), meta: '', go: () => navigation.navigate('NotificationSettings') },
    { icon: 'shield-check', label: t('profile.account.privacy.label'), meta: '', go: () => Alert.alert(t('profile.account.privacy.alertTitle'), t('profile.account.privacy.alertBody')) },
    { icon: 'question', label: t('profile.account.help.label'), meta: '', go: () => Alert.alert(t('profile.account.help.alertTitle'), t('profile.account.help.alertBody')) },
  ];

  const doSignOut = () => {
    setSignOutOpen(false);
    dispatch(logoutAndInvalidate());
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
          <Pressable
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel={t('notifications.title')}
            style={({ pressed }) => [styles.bellBtn, pressed && { backgroundColor: 'rgba(233,233,237,0.07)' }]}
          >
            <Icon name="bell" size={18} color={Colors.textPrimary} />
            {unreadNotifications > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText} numberOfLines={1}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={({ pressed }) => [styles.editBtn, pressed && { backgroundColor: 'rgba(233,233,237,0.07)' }]}>
            <Text style={cssText(13)}>{t('profile.edit')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* identity */}
        <View style={styles.identity}>
          <ProfileAvatar name={user?.displayName} photoUrl={user?.photoUrl} ring />
          <View style={{ flex: 1, minWidth: 0, rowGap: 2 }}>
            <Text style={cssText(21, { fontWeight: '500' })} numberOfLines={1}>{user?.displayName}</Text>
            {!!user?.location && (
              <View style={styles.locRow}>
                <Icon name="map-pin" size={13} color={Ramp.neutral[400]} />
                <Text style={cssText(13, { color: Ramp.neutral[400], marginLeft: 4, flexShrink: 1 })} numberOfLines={1}>{user.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* text-wrap:pretty in the prototype keeps a lone word off the last line; a slightly narrower measure does the same here */}
        {!!user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.stats}>
          {[
            [stats?.walks ?? 0, t('profile.stats.walks')],
            [stats?.friends ?? 0, t('profile.stats.walkFriends')],
            [stats?.km ?? 0, t('profile.stats.kmTogether')],
          ].map(([value, label]) => (
            <View key={label}>
              <Text style={cssText(22, { fontWeight: '500' })}>{value}</Text>
              <Text numberOfLines={1} style={cssText(12, { color: Ramp.neutral[500] })}>{label}</Text>
            </View>
          ))}
        </View>

        {/* dogs */}
        <View>
          <View style={styles.sectionHead}>
            <Text style={cssText(15, { fontWeight: '500' })}>{isShelter ? t('profile.dogs.shelterTitle') : t('profile.dogs.title')}</Text>
            <Pressable onPress={() => navigation.navigate('MyDogs')} style={{ paddingVertical: 6 }}>
              <Text style={cssText(12, { color: Ramp.accent[300] })}>{t('profile.dogs.manage')}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}>
            {dogs.map((d) => (
              <View key={d.id} style={styles.dogCard}>
                {d.photoUrl ? (
                  <Image source={{ uri: resolveMediaUrl(d.photoUrl) }} style={{ height: 84, borderRadius: 8, backgroundColor: '#1f2130' }} />
                ) : (
                  <Placeholder label="dog photo" style={{ height: 84, borderRadius: 8 }} padding={6} />
                )}
                <View style={{ marginTop: 8 }}>
                  <Text style={cssText(14, { fontWeight: '500' })} numberOfLines={1}>{d.name}</Text>
                  <Text style={cssText(12, { color: Ramp.neutral[500] })} numberOfLines={1}>
                    {d.breed} · {ageGroupOf(d)}
                  </Text>
                  {!!d.bio && (
                    <Text
                      style={cssText(12, {
                        color: Ramp.neutral[300],
                        marginTop: 4,
                        lineHeight: 16.8,
                      })}
                      numberOfLines={2}
                    >
                      {d.bio}
                    </Text>
                  )}
                </View>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('AddDog')} style={styles.addDog}>
              <Icon name="plus" size={20} color={Ramp.neutral[400]} />
              <Text numberOfLines={1} style={cssText(12, { color: Ramp.neutral[400], marginTop: 6 })}>{t('profile.dogs.addDog')}</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* shelter dogs this person is connected to — a person can show up here for several different dogs */}
        {connectedShelterDogs.length > 0 && (
          <View>
            <View style={styles.sectionHead}>
              <Text style={cssText(15, { fontWeight: '500' })}>{t('profile.shelterDogs.title')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}>
              {connectedShelterDogs.map((r) => (
                <Pressable key={r.id} onPress={() => navigation.navigate('DogRequestChat', { requestId: r.id })} style={styles.dogCard}>
                  <View>
                    {r.dog.photoUrl ? (
                      <Image source={{ uri: resolveMediaUrl(r.dog.photoUrl) }} style={{ height: 84, borderRadius: 8, backgroundColor: '#1f2130' }} />
                    ) : (
                      <Placeholder label="dog photo" style={{ height: 84, borderRadius: 8 }} padding={6} />
                    )}
                    <ShelterHeartBadge size={34} style={styles.shelterDogBadge} />
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <Text style={cssText(14, { fontWeight: '500' })} numberOfLines={1}>{r.dog.name}</Text>
                    <Text style={cssText(12, { color: Ramp.neutral[500] })} numberOfLines={1}>{r.shelter.displayName}</Text>
                    {!!r.dog.bio && (
                      <Text
                        style={cssText(12, {
                          color: Ramp.neutral[300],
                          marginTop: 4,
                          lineHeight: 16.8,
                        })}
                        numberOfLines={2}
                      >
                        {r.dog.bio}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* preferences */}
        <View>
          <Overline>{t('profile.preferences.title')}</Overline>
          {prefRows.map((p) => (
            <View key={p.key} style={styles.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={cssText(14)}>{p.label}</Text>
                <Text style={cssText(12, { color: Ramp.neutral[500] })}>{p.desc}</Text>
              </View>
              <Toggle value={prefs[p.key]} onValueChange={(v) => setPrefs((s) => ({ ...s, [p.key]: v }))} accessibilityLabel={p.label} />
              <Hairline style={styles.rowRule} />
            </View>
          ))}
        </View>

        {/* account */}
        <View>
          <Overline>{t('profile.account.title')}</Overline>
          {menuRows.map((m) => (
            <Pressable key={m.label} onPress={m.go} style={styles.menuRow}>
              <Icon name={m.icon} size={18} color={Ramp.neutral[400]} />
              <Text numberOfLines={1} style={cssText(14, { flex: 1, marginLeft: 12 })}>{m.label}</Text>
              {!!m.meta && <Text numberOfLines={1} style={cssText(12, { color: Ramp.neutral[500], marginRight: 12, maxWidth: 100 })}>{m.meta}</Text>}
              <Icon name="caret-right" size={14} color={Ramp.neutral[600]} />
              <Hairline style={styles.rowRule} />
            </Pressable>
          ))}
          <Pressable onPress={() => setSignOutOpen(true)} style={styles.menuRow}>
            <Icon name="sign-out" size={18} color={Ramp.neutral[400]} />
            <Text style={cssText(14, { marginLeft: 12, color: Ramp.neutral[300] })}>{t('profile.account.signOut')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toastElement}
      <ConfirmDialog
        visible={signOutOpen}
        title={t('profile.signOutDialog.title')}
        message={t('profile.signOutDialog.message')}
        confirmLabel={t('profile.signOutDialog.confirm')}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={doSignOut}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  title: { ...cssText(24), fontWeight: '500', letterSpacing: -0.36 },
  editBtn: { height: 36, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(233,233,237,0.16)', alignItems: 'center', justifyContent: 'center' },
  bellBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(233,233,237,0.16)', alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.backgroundDark },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  scroll: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 110, rowGap: 22 },
  identity: { flexDirection: 'row', alignItems: 'center', columnGap: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  bio: { ...cssText(14), color: Ramp.neutral[300], marginTop: -8, maxWidth: 320 },
  stats: { flexDirection: 'row', columnGap: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dogCard: { width: 150, padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceDark },
  shelterDogBadge: { position: 'absolute', top: -10, right: -10 },
  addDog: { width: 110, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Ramp.neutral[700], alignItems: 'center', justifyContent: 'center' },
  overline: { ...cssText(11), letterSpacing: 1.1, color: Ramp.neutral[500], marginBottom: 2 },
  prefRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 12 },
  rowRule: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
});
