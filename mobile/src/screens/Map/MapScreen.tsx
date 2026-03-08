import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { fetchPlaces, setSelectedPlace } from '../../store/slices/placesSlice';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

// Category chips
const CATEGORIES = ['All', 'Walks', 'Parks', 'Cafes', 'Vets', 'Trails', 'Lakes'];

const PLACE_CATEGORY_MAP: Record<string, string[]> = {
  Parks: ['park'],
  Cafes: ['cafe'],
  Vets: ['vet'],
  Trails: ['trail'],
  Lakes: ['lake', 'beach'],
};

// Walk card in the bottom sheet list
const WalkCard: React.FC<{
  walk: any;
  onPress: () => void;
}> = ({ walk, onPress }) => (
  <TouchableOpacity style={cardStyles.container} onPress={onPress} activeOpacity={0.85}>
    <View style={cardStyles.header}>
      <View style={cardStyles.hostAvatar}>
        <Text style={cardStyles.avatarText}>
          {walk.host?.displayName?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <View style={cardStyles.headerInfo}>
        <Text style={cardStyles.title} numberOfLines={1}>{walk.title}</Text>
        <Text style={cardStyles.host}>{walk.host?.displayName}</Text>
      </View>
      <View style={cardStyles.distanceBadge}>
        <Text style={cardStyles.distanceText}>📍 Near</Text>
      </View>
    </View>

    <View style={cardStyles.meta}>
      <Text style={cardStyles.metaItem}>
        🕐 {new Date(walk.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>
      <Text style={cardStyles.metaItem}>
        👥 {walk.participants?.length ?? 0}/{walk.maxParticipants}
      </Text>
    </View>

    {walk.description && (
      <Text style={cardStyles.description} numberOfLines={2}>{walk.description}</Text>
    )}

    <View style={cardStyles.footer}>
      <View style={[cardStyles.statusBadge,
        walk.status === 'active' && { backgroundColor: 'rgba(29,209,161,0.15)' },
        walk.status === 'pending' && { backgroundColor: 'rgba(108,92,231,0.15)' },
      ]}>
        <Text style={[cardStyles.statusText,
          walk.status === 'active' && { color: Colors.success },
          walk.status === 'pending' && { color: Colors.primary },
        ]}>
          {walk.status === 'active' ? '● Active' : walk.status === 'pending' ? '◌ Upcoming' : walk.status}
        </Text>
      </View>
      <Text style={cardStyles.joinCta}>View details →</Text>
    </View>
  </TouchableOpacity>
);

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginRight: Spacing.md,
    width: width * 0.75,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  hostAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: { ...Typography.body, color: '#fff', fontWeight: '700' },
  headerInfo: { flex: 1 },
  title: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  host: { ...Typography.caption, color: Colors.textSecondary },
  distanceBadge: {
    backgroundColor: Colors.surfaceDark, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  distanceText: { ...Typography.caption, color: Colors.textSecondary },
  meta: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs },
  metaItem: { ...Typography.caption, color: Colors.textSecondary },
  description: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { ...Typography.caption, fontWeight: '600' },
  joinCta: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
});

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { walks, loading } = useSelector((s: RootState) => s.walks);
  const { places, selectedPlace } = useSelector((s: RootState) => s.places);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    dispatch(fetchNearbyWalks({ lat: 52.2297, lng: 21.0122, radiusKm: 10 }));
    dispatch(fetchPlaces());
  }, [dispatch]);

  const visibleWalks = activeCategory === 'All' || activeCategory === 'Walks' ? walks : [];
  const visiblePlaces = activeCategory === 'Walks' ? [] :
    activeCategory === 'All' ? places :
    places.filter(p => (PLACE_CATEGORY_MAP[activeCategory] ?? []).includes(p.category));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: 52.2297,
          longitude: 21.0122,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {visibleWalks.map((walk) => (
          <Marker
            key={walk.id}
            coordinate={{ latitude: walk.meetingLat, longitude: walk.meetingLng }}
            onPress={() => {
              dispatch(setSelectedPlace(null));
              navigation.navigate('WalkDetail', { walkId: walk.id });
            }}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerEmoji}>🚶</Text>
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>{walk.title}</Text>
            </View>
          </Marker>
        ))}

        {visiblePlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => dispatch(setSelectedPlace(place))}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.placeMarker]}>
                <Text style={styles.markerEmoji}>{place.emoji}</Text>
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>{place.name}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top safe area overlay */}
      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Explore</Text>
            <Text style={styles.headerSubtitle}>{walks.length} walks · {places.length} places</Text>
          </View>
          <TouchableOpacity style={styles.myLocationBtn}>
            <Text style={{ fontSize: 18 }}>◎</Text>
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Selected place info card */}
      {selectedPlace && (
        <View style={styles.placeCard}>
          <TouchableOpacity style={styles.placeCardClose} onPress={() => dispatch(setSelectedPlace(null))}>
            <Text style={{ color: Colors.textMuted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.placeEmoji}>{selectedPlace.emoji}</Text>
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{selectedPlace.name}</Text>
            <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
            <View style={styles.placeMetaRow}>
              <Text style={styles.placeMeta}>⭐ {selectedPlace.rating}</Text>
              <Text style={styles.placeMeta}>({selectedPlace.reviewCount})</Text>
              <View style={[styles.openBadge, !selectedPlace.isOpen && styles.openBadgeClosed]}>
                <Text style={[styles.openText, !selectedPlace.isOpen && styles.closedText]}>
                  {selectedPlace.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Bottom sheet — peek (walk cards) */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>
          {activeCategory === 'Walks' || activeCategory === 'All' ? 'Walks near you' : `${activeCategory} near you`}
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        ) : visibleWalks.length === 0 && activeCategory !== 'All' && activeCategory !== 'Walks' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📍</Text>
            <Text style={styles.emptyTitle}>Tap a pin to explore</Text>
          </View>
        ) : walks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>No walks nearby</Text>
            <Text style={styles.emptySubtitle}>Be the first to create one!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardList}>
            {(activeCategory === 'All' || activeCategory === 'Walks' ? walks : walks).map((walk) => (
              <WalkCard
                key={walk.id}
                walk={walk}
                onPress={() => navigation.navigate('WalkDetail', { walkId: walk.id })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateWalk')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
};

// Dark map style matching the design
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D0D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#16213E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#246786' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D0D2B' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1A2E1A' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  myLocationBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  chipsRow: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.borderLight,
    backgroundColor: Colors.cardDark,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.textPrimary, fontWeight: '700' },
  markerContainer: { alignItems: 'center' },
  marker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    ...Shadow.card,
  },
  markerEmoji: { fontSize: 18 },
  placeMarker: { backgroundColor: Colors.secondary },
  placeCard: {
    position: 'absolute',
    bottom: height * 0.28 + 72,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.modal,
  },
  placeCardClose: { position: 'absolute', top: 8, right: 12, padding: 4 },
  placeEmoji: { fontSize: 32 },
  placeInfo: { flex: 1, paddingRight: 20 },
  placeName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  placeAddress: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  placeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeMeta: { fontSize: 12, color: Colors.textSecondary },
  openBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, backgroundColor: `${Colors.success}20`, borderWidth: 1, borderColor: `${Colors.success}50` },
  openBadgeClosed: { backgroundColor: `${Colors.error}20`, borderColor: `${Colors.error}50` },
  openText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  closedText: { color: Colors.error },
    backgroundColor: Colors.surfaceDark,
    color: Colors.textPrimary,
    fontSize: 10, fontWeight: '600',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 8, marginTop: 3,
    maxWidth: 100,
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceDark,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: Colors.border,
    minHeight: height * 0.28,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  emptyState: { alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    bottom: height * 0.28 + 16,
    right: Spacing.lg,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  fabText: { fontSize: 26, color: '#fff', lineHeight: 30 },
});
