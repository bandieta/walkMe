import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { fetchPlaces } from '../../store/slices/placesSlice';
import { Icon, IconName, categoryIcon } from '../../components/Icon';
import { Colors, Spacing, Radius, Shadow, Ramp } from '../../utils/theme';

const { height } = Dimensions.get('window');

const CENTER = { latitude: 52.2297, longitude: 21.0122 };
type Segment = 'walks' | 'events' | 'places';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'walks', label: 'Walks' },
  { key: 'events', label: 'Events' },
  { key: 'places', label: 'Places' },
];

const CHIPS: Record<Segment, { key: string; label: string }[]> = {
  walks: [
    { key: 'live', label: 'Live now' },
    { key: 'today', label: 'Today' },
    { key: 'near', label: 'Under 2 km' },
    { key: 'mine', label: 'Joined' },
  ],
  events: [
    { key: 'live', label: 'Live now' },
    { key: 'today', label: 'Today' },
    { key: 'mine', label: 'Going' },
  ],
  places: [
    { key: 'park', label: 'Parks' },
    { key: 'cafe', label: 'Cafés' },
    { key: 'vet', label: 'Vets' },
    { key: 'trail', label: 'Trails' },
    { key: 'lake', label: 'Lakes' },
  ],
};

function distanceKm(lat: number, lng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - CENTER.latitude);
  const dLng = toRad(lng - CENTER.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(CENTER.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

function whenLabel(iso: string, status?: string) {
  if (status === 'live') return 'Live now';
  const d = new Date(iso);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return isToday(iso) ? `Today · ${time}` : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${time}`;
}

interface Item {
  id: string;
  lat: number;
  lng: number;
  icon: IconName;
  live: boolean;
  title: string;
  sub: string;
  cta: string;
  open: () => void;
}

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const me = useSelector((s: RootState) => s.auth.user);
  const { walks, loading } = useSelector((s: RootState) => s.walks);
  const { events } = useSelector((s: RootState) => s.events);
  const { places } = useSelector((s: RootState) => s.places);

  const [segment, setSegment] = useState<Segment>('walks');
  const [chips, setChips] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNearbyWalks({ lat: CENTER.latitude, lng: CENTER.longitude, radiusKm: 10 }));
    dispatch(fetchEvents());
    dispatch(fetchPlaces());
  }, [dispatch]);

  const items: Item[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const on = (k: string) => chips.includes(k);

    if (segment === 'walks') {
      return (walks as any[])
        .filter((w) => w.status !== 'ended')
        .filter((w) => !on('live') || w.status === 'live')
        .filter((w) => !on('today') || isToday(w.scheduledAt))
        .filter((w) => !on('near') || distanceKm(w.meetingLat, w.meetingLng) < 2)
        .filter((w) => !on('mine') || (w.participantIds ?? []).includes(me?.id))
        .filter((w) => !q || `${w.title} ${w.meetingPoint ?? ''}`.toLowerCase().includes(q))
        .map((w) => ({
          id: w.id,
          lat: w.meetingLat,
          lng: w.meetingLng,
          icon: categoryIcon(w.category),
          live: w.status === 'live',
          title: w.title,
          sub: `${whenLabel(w.scheduledAt, w.status)} · ${distanceKm(w.meetingLat, w.meetingLng).toFixed(1)} km · ${
            w.participants?.length ?? 0
          } of ${w.maxParticipants}`,
          cta: 'View walk',
          open: () => navigation.navigate('WalkDetail', { walkId: w.id }),
        }));
    }

    if (segment === 'events') {
      return (events as any[])
        .filter((e) => e.status !== 'ended' && e.lat != null && e.lng != null)
        .filter((e) => !on('live') || e.status === 'live')
        .filter((e) => !on('today') || isToday(e.date))
        .filter((e) => !on('mine') || e.isJoined)
        .filter((e) => !q || `${e.title} ${e.location}`.toLowerCase().includes(q))
        .map((e) => ({
          id: e.id,
          lat: e.lat,
          lng: e.lng,
          icon: categoryIcon(e.category),
          live: e.status === 'live',
          title: e.title,
          sub: `${whenLabel(e.date, e.status)} · ${e.participantCount} going${e.isJoined ? ' · you’re going' : ''}`,
          cta: 'View event',
          open: () => navigation.navigate('EventDetail', { eventId: e.id }),
        }));
    }

    return (places as any[])
      .filter((p) => !chips.length || chips.some((c) => (c === 'lake' ? ['lake', 'beach'] : [c]).includes(p.category)))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        icon: categoryIcon(p.category),
        live: false,
        title: p.name,
        sub: `Rated ${p.rating} · ${p.isOpen ? 'Open now' : 'Closed'}`,
        cta: 'Plan a walk here',
        open: () => navigation.navigate('CreateWalk'),
      }));
  }, [segment, chips, query, walks, events, places, me?.id, navigation]);

  const sel = items.find((i) => i.id === selected);
  const sheetHeight = sheetOpen ? Math.round(height * 0.62) : 300;

  const pickSegment = (s: Segment) => {
    setSegment(s);
    setChips([]);
    setSelected(null);
    setQuery('');
  };
  const toggleChip = (k: string) => {
    setSelected(null);
    setChips((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...CENTER, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
        onPress={() => setSelected(null)}
      >
        {items.map((item) => {
          const hi = item.id === selected || item.live;
          return (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              onPress={(e) => {
                e.stopPropagation?.();
                setSelected(item.id);
                setSheetOpen(false);
              }}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.pin,
                  { borderColor: hi ? Colors.primary : Ramp.neutral[600] },
                  item.id === selected && { backgroundColor: Ramp.accent[900] },
                ]}
              >
                <Icon name={item.icon} size={18} color={hi ? Colors.primary : Ramp.neutral[300]} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Icon name="locate" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.search}>
          <Icon name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${segment}`}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
          />
        </View>

        <View style={styles.seg}>
          {SEGMENTS.map((s, i) => {
            const active = segment === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.segOpt, i > 0 && styles.segDivider, active && styles.segActive]}
                onPress={() => pickSegment(s.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.segText, active && { color: Colors.primary }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CHIPS[segment].map((c) => {
            const active = chips.includes(c.key);
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleChip(c.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && { color: Colors.primary }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {sel && !sheetOpen && (
        <View style={[styles.preview, { bottom: sheetHeight + 12 }]}>
          <View style={styles.previewIcon}>
            <Icon name={sel.icon} size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle} numberOfLines={1}>{sel.title}</Text>
            <Text style={styles.previewSub} numberOfLines={1}>{sel.sub}</Text>
          </View>
          <TouchableOpacity style={styles.previewCta} onPress={sel.open} activeOpacity={0.7}>
            <Text style={styles.previewCtaText}>{sel.cta}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: sheetHeight + (sel && !sheetOpen ? 84 : 16) }]}
        onPress={() => navigation.navigate(segment === 'events' ? 'CreateEvent' : 'CreateWalk')}
        activeOpacity={0.7}
      >
        <Icon name="plus" size={22} color={Colors.primary} />
      </TouchableOpacity>

      <View style={[styles.sheet, { height: sheetHeight }]}>
        <TouchableOpacity onPress={() => setSheetOpen((o) => !o)} activeOpacity={0.7} style={styles.handleHit}>
          <View style={styles.handle} />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>
          {segment === 'walks' ? 'Walks near you' : segment === 'events' ? 'Events' : 'Places'}
          <Text style={styles.sheetCount}>{'  '}{items.length}</Text>
        </Text>

        {loading && !items.length ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name={segment === 'places' ? 'pin' : segment === 'events' ? 'calendar' : 'map'} size={26} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {segment === 'walks' ? 'No walks nearby' : segment === 'events' ? 'No events' : 'No places found'}
            </Text>
            <Text style={styles.emptySub}>
              {segment === 'places' ? 'Try another filter.' : 'Be the first to create one!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={item.open} activeOpacity={0.7}>
                <View style={[styles.rowIcon, item.live && styles.rowIconLive]}>
                  <Icon name={item.icon} size={18} color={item.live ? Ramp.accent[300] : Ramp.neutral[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.rowSub, item.live && { color: Ramp.accent[300] }]} numberOfLines={1}>
                    {item.sub}
                  </Text>
                </View>
                <Icon name="chevronRight" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

// Nocturne-toned dark map.
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1b1d2b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#161826' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#75798c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2c3b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#232532' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f424d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12131e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1d2230' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: Colors.backgroundDark, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Ramp.neutral[800],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 24, fontWeight: '500', color: Colors.textPrimary, letterSpacing: -0.4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: 10, minHeight: 38,
    backgroundColor: Colors.surfaceDark, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 6 },
  seg: {
    flexDirection: 'row', alignSelf: 'flex-start', overflow: 'hidden',
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark,
  },
  segOpt: { paddingVertical: 7, paddingHorizontal: 14 },
  segDivider: { borderLeftWidth: 1, borderLeftColor: Colors.borderLight },
  segActive: { backgroundColor: 'rgba(145,132,217,0.12)' },
  segText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipsRow: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 6,
    borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.surfaceDark,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Ramp.accent[900] },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  pin: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceDark, borderWidth: 1.5, ...Shadow.subtle,
  },
  preview: {
    position: 'absolute', left: Spacing.md, right: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.surfaceDark, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Ramp.neutral[700], ...Shadow.card,
  },
  previewIcon: {
    width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Ramp.accent[900],
  },
  previewTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  previewSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  previewCta: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.primary,
  },
  previewCtaText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  fab: {
    position: 'absolute', right: Spacing.md, width: 46, height: 46, borderRadius: Radius.md,
    backgroundColor: Colors.surfaceDark, borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadow.fab,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceDark,
    borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg,
    borderTopWidth: 1, borderColor: Ramp.neutral[800], ...Shadow.modal,
  },
  handleHit: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  handle: { width: 36, height: 3, borderRadius: 2, backgroundColor: Ramp.neutral[700] },
  sheetTitle: { fontSize: 18, fontWeight: '500', color: Colors.textPrimary, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sheetCount: { fontSize: 13, color: Colors.textMuted },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Ramp.neutral[900],
  },
  rowIconLive: { backgroundColor: Ramp.accent[900] },
  rowTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Ramp.neutral[500], marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: Spacing.lg },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginBottom: 2 },
  emptySub: { fontSize: 13, color: Colors.textSecondary },
});
