import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logoutAndInvalidate } from '../../store/slices/authSlice';
import { fetchMyDogs } from '../../store/slices/dogsSlice';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { usersApi } from '../../services/api';
import { Icon, IconName } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Hairline, Toggle, Placeholder, useScreenInsets } from '../../ui';
import { cssText } from '../../ui/cssLine';
import { resolveMediaUrl } from '../../utils/media';
import { Colors, Ramp } from '../../utils/theme';
import { ProfileAvatar } from './ProfileAvatar';

const Overline: React.FC<{ children: string }> = ({ children }) => (
  <Text style={styles.overline}>{children.toUpperCase()}</Text>
);

export const ProfileScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const user = useSelector((s: RootState) => s.auth.user);
  const dogs = useSelector((s: RootState) => s.dogs.dogs) as any[];
  const walks = useSelector((s: RootState) => s.walks.walks) as any[];
  const events = useSelector((s: RootState) => s.events.events) as any[];
  const [stats, setStats] = useState<{ walks: number; friends: number; km: number } | null>(null);
  const [prefs, setPrefs] = useState({ push: true, loc: true, nearby: false });
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { show: showToast, element: toastElement } = useToast();

  useEffect(() => {
    dispatch(fetchMyDogs());
    dispatch(fetchNearbyWalks({}));
    dispatch(fetchEvents());
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

  const prefRows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'push', label: 'Push notifications', desc: 'Walk invites and messages' },
    { key: 'loc', label: 'Share location', desc: 'Visible to people on your walks' },
    { key: 'nearby', label: 'Nearby walk alerts', desc: `When a walk starts within ${radiusLabel}` },
  ];
  const menuRows: { icon: IconName; label: string; meta: string; go: () => void }[] = [
    { icon: 'path', label: 'Walks & events', meta: `${upcoming} upcoming`, go: () => navigation.navigate('MyWalks') },
    { icon: 'sliders-horizontal', label: 'Walking rhythm', meta: radiusLabel, go: () => navigation.navigate('Rhythm') },
    { icon: 'shield-check', label: 'Privacy & safety', meta: '', go: () => Alert.alert('Privacy & safety', 'Privacy settings come in the next round.') },
    { icon: 'question', label: 'Help & support', meta: '', go: () => Alert.alert('Help & support', 'The help centre comes in the next round.') },
  ];

  const doSignOut = () => {
    setSignOutOpen(false);
    dispatch(logoutAndInvalidate());
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>Profile</Text>
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={({ pressed }) => [styles.editBtn, pressed && { backgroundColor: 'rgba(233,233,237,0.07)' }]}>
          <Text style={cssText(13)}>Edit</Text>
        </Pressable>
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
            [stats?.walks ?? 0, 'Walks'],
            [stats?.friends ?? 0, 'Walk friends'],
            [stats?.km ?? 0, 'km together'],
          ].map(([value, label]) => (
            <View key={label}>
              <Text style={cssText(22, { fontWeight: '500' })}>{value}</Text>
              <Text style={cssText(12, { color: Ramp.neutral[500] })}>{label}</Text>
            </View>
          ))}
        </View>

        {/* dogs */}
        <View>
          <View style={styles.sectionHead}>
            <Text style={cssText(15, { fontWeight: '500' })}>Your dogs</Text>
            <Pressable onPress={() => navigation.navigate('MyDogs')} style={{ paddingVertical: 6 }}>
              <Text style={cssText(12, { color: Ramp.accent[300] })}>Manage</Text>
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
                    {d.breed} · {d.ageGroup ?? (d.age < 1 ? 'Puppy' : d.age > 8 ? 'Senior' : 'Adult')}
                  </Text>
                </View>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('AddDog')} style={styles.addDog}>
              <Icon name="plus" size={20} color={Ramp.neutral[400]} />
              <Text style={cssText(12, { color: Ramp.neutral[400], marginTop: 6 })}>Add a dog</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* preferences */}
        <View>
          <Overline>Preferences</Overline>
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
          <Overline>Account</Overline>
          {menuRows.map((m) => (
            <Pressable key={m.label} onPress={m.go} style={styles.menuRow}>
              <Icon name={m.icon} size={18} color={Ramp.neutral[400]} />
              <Text style={cssText(14, { flex: 1, marginLeft: 12 })}>{m.label}</Text>
              {!!m.meta && <Text style={cssText(12, { color: Ramp.neutral[500], marginRight: 12 })}>{m.meta}</Text>}
              <Icon name="caret-right" size={14} color={Ramp.neutral[600]} />
              <Hairline style={styles.rowRule} />
            </Pressable>
          ))}
          <Pressable onPress={() => setSignOutOpen(true)} style={styles.menuRow}>
            <Icon name="sign-out" size={18} color={Ramp.neutral[400]} />
            <Text style={cssText(14, { marginLeft: 12, color: Ramp.neutral[300] })}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toastElement}
      <ConfirmDialog
        visible={signOutOpen}
        title="Sign out?"
        message="You'll need to sign in again to see walks and messages."
        confirmLabel="Sign out"
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
  scroll: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 110, rowGap: 22 },
  identity: { flexDirection: 'row', alignItems: 'center', columnGap: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  bio: { ...cssText(14), color: Ramp.neutral[300], marginTop: -8, maxWidth: 320 },
  stats: { flexDirection: 'row', columnGap: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  dogCard: { width: 150, padding: 10, borderRadius: 12, backgroundColor: Colors.surfaceDark },
  addDog: { width: 110, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Ramp.neutral[700], alignItems: 'center', justifyContent: 'center' },
  overline: { ...cssText(11), letterSpacing: 1.1, color: Ramp.neutral[500], marginBottom: 2 },
  prefRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 12 },
  rowRule: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
});
