import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { Icon, IconName, categoryIcon } from '../../components/Icon';
import { Hairline, Segmented, useScreenInsets } from '../../ui';
import { whenLong } from '../Map/mapFormat';
import { Colors, Ramp } from '../../utils/theme';

type Seg = 'upcoming' | 'hosting' | 'past';
const SEGS: { key: Seg; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'hosting', label: 'Hosting' },
  { key: 'past', label: 'Past' },
];
const DIV = 'rgba(233,233,237,0.16)';

interface Row {
  id: string;
  icon: IconName;
  title: string;
  sub: string;
  kind: string;
  live: boolean;
  at: number;
  open: () => void;
}

export const MyWalksScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { walks } = useSelector((s: RootState) => s.walks);
  const { events } = useSelector((s: RootState) => s.events);
  const user = useSelector((s: RootState) => s.auth.user) as any;
  const [seg, setSeg] = useState<Seg>('upcoming');
  useScreenInsets();

  useEffect(() => {
    dispatch(fetchNearbyWalks({} as any));
    dispatch(fetchEvents());
  }, [dispatch]);

  const rows = useMemo(() => {
    const uid = user?.id;
    const walkRow = (w: any): Row => ({
      id: 'w' + w.id,
      icon: categoryIcon(w.category) === 'map-pin' ? 'path' : categoryIcon(w.category),
      title: w.title,
      sub: [whenLong(w.scheduledAt), w.meetingPoint].filter(Boolean).join(' · '),
      kind: w.host?.id === uid ? 'Hosting' : 'Walk',
      live: w.status === 'live',
      at: new Date(w.scheduledAt).getTime(),
      open: () => navigation.navigate('WalkDetail', { walkId: w.id }),
    });
    const eventRow = (e: any): Row => ({
      id: 'e' + e.id,
      icon: categoryIcon(e.category) === 'map-pin' ? 'calendar-blank' : categoryIcon(e.category),
      title: e.title,
      sub: [whenLong(e.date), e.location].filter(Boolean).join(' · '),
      kind: e.organizerId === uid ? 'Organising' : 'Event',
      live: false,
      at: new Date(e.date).getTime(),
      open: () => navigation.navigate('EventDetail', { eventId: e.id }),
    });
    const inWalk = (w: any) => w.host?.id === uid || (w.participantIds ?? w.participants?.map((p: any) => p.id) ?? []).includes(uid);
    let out: Row[];
    if (seg === 'upcoming') {
      out = [...walks.filter((w: any) => inWalk(w) && w.status !== 'ended').map(walkRow), ...events.filter((e) => e.isJoined && e.status !== 'ended').map(eventRow)];
    } else if (seg === 'hosting') {
      out = [...walks.filter((w: any) => w.host?.id === uid).map(walkRow), ...events.filter((e) => e.organizerId === uid).map(eventRow)];
    } else {
      out = [...walks.filter((w: any) => inWalk(w) && w.status === 'ended').map(walkRow), ...events.filter((e) => e.isJoined && e.status === 'ended').map(eventRow)];
    }
    return out;
  }, [seg, walks, events, user?.id, navigation]);

  const emptyText = seg === 'hosting' ? 'You haven’t hosted anything yet.' : seg === 'past' ? 'Past walks and events show up here.' : 'Nothing planned yet.';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: 52, paddingRight: 16, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name="caret-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500' }}>Walks & events</Text>
      </View>
      <Segmented options={SEGS} value={seg} onChange={setSeg} height={38} style={{ marginTop: 10, marginHorizontal: 20, marginBottom: 4 }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {rows.map((r) => (
          <Pressable key={r.id} onPress={r.open} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: r.live ? Ramp.accent[900] : Ramp.neutral[900] }}>
              <Icon name={r.icon} size={18} color={r.live ? Ramp.accent[300] : Ramp.neutral[400]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14 }}>{r.title}</Text>
              <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>{r.sub}</Text>
            </View>
            <View style={{ paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: DIV }}>
              <Text style={{ fontSize: 11, color: Ramp.neutral[300] }}>{r.kind}</Text>
            </View>
            <Hairline style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
          </Pressable>
        ))}
        {rows.length === 0 && (
          <View style={{ paddingVertical: 28, rowGap: 10, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 13, color: Ramp.neutral[500] }}>{emptyText}</Text>
            <Pressable onPress={() => navigation.navigate('CreateWalk')} style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, color: Colors.primary }}>Plan a walk</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
