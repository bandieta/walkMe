import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { fetchPlaces } from '../../store/slices/placesSlice';
import { Icon } from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { MeMarker, PinMarker } from './MapPin';
import { MapSheet } from './MapSheet';
import { WalkPreviewCard } from './WalkPreviewCard';
import { darkMapStyle, TINT } from './mapStyle';
import {
  HOME, MapItem, Segment, categoryGlyph, distanceKm, eventWhen, isToday, walkWhen, whenLong,
} from './mapFormat';

const DIV = 'rgba(233,233,237,0.16)';
const RING = Ramp.neutral[800];
const SHEET_MIN = 300;

const CHIPS = [
  { key: 'live', label: 'Live now' },
  { key: 'today', label: 'Today' },
  { key: 'near', label: 'Under 2 km' },
  { key: 'mine', label: 'Joined' },
];

const PLACEHOLDER: Record<Segment, string> = {
  walks: 'Search walks and parks',
  events: 'Search events',
  places: 'Parks, cafés, vets',
};

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const me = useSelector((s: RootState) => s.auth.user);
  const { walks, loading } = useSelector((s: RootState) => s.walks);
  const { events } = useSelector((s: RootState) => s.events);
  const { places } = useSelector((s: RootState) => s.places);
  const userLocation = useSelector((s: RootState) => (s as any).map?.userLocation) as { latitude: number; longitude: number } | null | undefined;
  const origin = userLocation ?? HOME;

  const [segment, setSegment] = useState<Segment>('walks');
  const [chips, setChips] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [ready, setReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  const sheetMax = Math.min(600, Dimensions.get('window').height - 244);
  const sheetH = useRef(new Animated.Value(SHEET_MIN)).current;

  const load = useCallback(() => {
    dispatch(fetchNearbyWalks({ lat: HOME.latitude, lng: HOME.longitude, radiusKm: 10 }));
    dispatch(fetchEvents());
    dispatch(fetchPlaces());
  }, [dispatch]);

  useEffect(() => {
    load();
    // Pick up joins/leaves made on the detail screens when coming back to the map.
    return navigation.addListener?.('focus', load);
  }, [load, navigation]);

  const items: MapItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const on = (k: string) => chips.includes(k);
    const km = (lat: number, lng: number) => distanceKm(origin, lat, lng);

    if (segment === 'walks') {
      return (walks as any[])
        .filter((w) => w.status !== 'ended')
        .filter((w) => !on('live') || w.status === 'live')
        .filter((w) => !on('today') || isToday(w.scheduledAt))
        .filter((w) => !on('near') || km(w.meetingLat, w.meetingLng) < 2)
        .filter((w) => !on('mine') || (w.participantIds ?? []).includes(me?.id))
        .filter((w) => !q || `${w.title} ${w.meetingPoint ?? ''}`.toLowerCase().includes(q))
        .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
        .map((w) => {
          const count = w.participants?.length ?? w.participantIds?.length ?? 0;
          return {
            id: w.id,
            lat: w.meetingLat,
            lng: w.meetingLng,
            icon: categoryGlyph(w.category, 'path'),
            live: w.status === 'live',
            tag: `Live · ${count}`,
            title: w.title,
            sub: `${walkWhen(w.scheduledAt, w.status)} · ${km(w.meetingLat, w.meetingLng).toFixed(1)} km · ${count} of ${w.maxParticipants}`,
            pv: `${whenLong(w.scheduledAt)} · ${w.meetingPoint}`,
            cta: 'View walk',
            act: () => navigation.navigate('WalkDetail', { walkId: w.id }),
          };
        });
    }

    if (segment === 'events') {
      return (events as any[])
        .filter((e) => e.status !== 'ended' && e.lat != null && e.lng != null)
        .filter((e) => !q || `${e.title} ${e.location ?? ''}`.toLowerCase().includes(q))
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))
        .map((e) => ({
          id: e.id,
          lat: e.lat,
          lng: e.lng,
          icon: categoryGlyph(e.category, 'calendar-blank'),
          live: e.status === 'live',
          tag: 'Today',
          title: e.title,
          sub: `${eventWhen(e.date, e.status)} · ${e.participantCount} going${e.isJoined ? ' · you’re going' : ''}`,
          pv: `${whenLong(e.date)} · ${e.location}`,
          cta: 'View event',
          act: () => navigation.navigate('EventDetail', { eventId: e.id }),
        }));
    }

    return (places as any[])
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => km(a.lat, a.lng) - km(b.lat, b.lng))
      .map((p) => {
        const note = (p.tags ?? []).slice(0, 2).join(' · ');
        const rating = Number(p.rating).toFixed(1);
        return {
          id: p.id,
          lat: p.lat,
          lng: p.lng,
          icon: categoryGlyph(p.category, 'map-pin'),
          live: false,
          tag: '',
          title: p.name,
          sub: `Rated ${rating} · ${p.isOpen ? 'Open now' : 'Closed'}${note ? ` · ${note}` : ''}`,
          pv: `Rated ${rating}${note ? ` · ${note}` : ''}`,
          cta: 'Plan a walk here',
          // pickedLocation matches CreateWalkParams — CreateWalkScreen treats it exactly like a map pick,
          // so the walk's coordinates are this place's, not a fuzzy name match against the typed text.
          act: () => navigation.navigate('CreateWalk', { category: p.category, pickedLocation: { name: p.name, lat: p.lat, lng: p.lng } }),
        };
      });
  }, [segment, chips, query, walks, events, places, me?.id, navigation, origin]);

  const sel = items.find((i) => i.id === selected);

  const settle = useCallback(
    (open: boolean) => {
      setSheetOpen(open);
      if (open) setSelected(null);
      Animated.timing(sheetH, {
        toValue: open ? sheetMax : SHEET_MIN, duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false,
      }).start();
    },
    [sheetH, sheetMax],
  );

  // Frame the pins nearest the user (far-away ones stay reachable by panning) whenever the segment or its data changes.
  const fitKey = `${segment}:${items.length > 0 ? 1 : 0}`;
  useEffect(() => {
    if (!ready) return;
    const near = items.filter((i) => distanceKm(origin, i.lat, i.lng) < 12).map((i) => ({ latitude: i.lat, longitude: i.lng }));
    mapRef.current?.fitToCoordinates([origin, ...near], {
      edgePadding: { top: 170, right: 56, bottom: SHEET_MIN + 40, left: 56 },
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, ready]);

  const pickSegment = (s: Segment) => {
    setSegment(s);
    setSelected(null);
    setQuery('');
  };
  const toggleChip = (k: string) => {
    setSelected(null);
    setChips((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  };
  const recenter = () => {
    setSelected(null);
    settle(false);
    mapRef.current?.animateToRegion({ ...origin, latitudeDelta: 0.06, longitudeDelta: 0.045 }, 400);
    setToast(true);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...HOME, latitudeDelta: 0.12, longitudeDelta: 0.09 }}
        userInterfaceStyle="dark"
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        customMapStyle={darkMapStyle}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsIndoors={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        onMapReady={() => setReady(true)}
        onPress={() => setSelected(null)}
      >
        {Platform.OS === 'ios' && <Polygon coordinates={TINT} fillColor="rgba(24,26,40,0.74)" strokeColor="transparent" strokeWidth={0} />}
        <MeMarker latitude={origin.latitude} longitude={origin.longitude} />
        {items.map((i) => (
          <PinMarker
            key={`${segment}-${i.id}`}
            latitude={i.lat}
            longitude={i.lng}
            icon={i.icon}
            live={i.live}
            selected={i.id === selected}
            tag={i.tag}
            onPress={() => {
              setSelected(i.id);
              settle(false);
            }}
          />
        ))}
      </MapView>

      <View pointerEvents="box-none" style={[styles.top, { paddingTop: top - 2 }]}>
        <View style={{ flexDirection: 'row', columnGap: 8 }}>
          <View style={styles.pill}>
            <Icon name="magnifying-glass" size={17} color={Ramp.neutral[400]} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setSelected(null); }}
              placeholder={PLACEHOLDER[segment]}
              placeholderTextColor={Ramp.neutral[600]}
              selectionColor={Colors.primary}
              cursorColor={Colors.primary}
              returnKeyType="search"
              autoCorrect={false}
              style={styles.input}
            />
            <View pointerEvents="none" style={styles.pillRing} />
          </View>
          <Pressable onPress={recenter} accessibilityLabel="Recenter" style={styles.round}>
            <Icon name="crosshair" size={18} color={Colors.textPrimary} />
            <View pointerEvents="none" style={styles.pillRing} />
          </Pressable>
        </View>
        {segment === 'walks' && (
          <View style={{ flexDirection: 'row', columnGap: 6 }}>
            {CHIPS.map((c) => {
              const on = chips.includes(c.key);
              return (
                <Pressable
                  key={c.key}
                  onPress={() => toggleChip(c.key)}
                  style={{
                    height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                    borderColor: on ? Colors.primary : DIV, backgroundColor: on ? Colors.backgroundDark : Colors.surfaceDark,
                  }}
                >
                  <Text style={{ fontSize: 12, color: on ? Colors.primary : Ramp.neutral[300] }}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {sel && !sheetOpen && (
        <WalkPreviewCard
          bottom={Animated.add(sheetH, 12)}
          icon={sel.icon}
          title={sel.title}
          sub={sel.pv}
          cta={sel.cta}
          onClose={() => setSelected(null)}
          onOpen={sel.act}
        />
      )}

      <MapSheet
        height={sheetH}
        min={SHEET_MIN}
        max={sheetMax}
        open={sheetOpen}
        onSettle={(o) => { if (!o || !sheetOpen) setSelected(null); settle(o); }}
        segment={segment}
        onSegment={pickSegment}
        items={items}
        loading={loading}
      />

      <Toast visible={toast} message={`Centred on ${(me as any)?.location?.split(',')[0] || 'Mokotów'}`} onHide={() => setToast(false)} />
    </View>
  );
};

const pillShadow = { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 9 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#181a28' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, rowGap: 10 },
  pill: {
    flex: 1, height: 46, borderRadius: 23, backgroundColor: Colors.surfaceDark, flexDirection: 'row', alignItems: 'center',
    columnGap: 8, paddingHorizontal: 16, ...pillShadow,
  },
  round: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center', ...pillShadow,
  },
  // box-shadow: 0 0 0 1px #3f424d — a ring just outside the box
  pillRing: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 24, borderWidth: 1, borderColor: RING },
  input: { flex: 1, minWidth: 0, height: 24, paddingVertical: 0, paddingLeft: 2, paddingRight: 2, fontSize: 14, color: Colors.textPrimary },
});
