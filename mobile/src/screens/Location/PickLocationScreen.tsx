import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { placesApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { Btn, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { PinMarker } from '../Map/MapPin';
import { darkMapStyle, TINT } from '../Map/mapStyle';
import { HOME, distanceKm } from '../Map/mapFormat';

/** A dog-friendly place within this many metres of the map's centre counts as "on" that place. */
const SNAP_METERS = 60;

export interface PickedLocation {
  name: string;
  lat: number;
  lng: number;
}

/**
 * The map half of a location field's "type it or pick it" choice: pan the map until the fixed centre pin sits
 * where you mean, optionally snapping onto a known dog-friendly place, then confirm. Reached from LocationField's
 * map-pin button in CreateWalk, CreateEvent and EditProfile; returns its pick to `route.params.returnTo` via
 * `navigation.navigate({ name, params: { pickedLocation }, merge: true })`, the same pattern EditProfileScreen
 * already uses to hand a result back up the stack.
 */
export const PickLocationScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { initialLat, initialLng, returnTo } = route.params ?? {};
  const { top, bottom } = useScreenInsets();
  const userLocation = useSelector((s: RootState) => s.map.userLocation);
  const mapRef = useRef<MapView>(null);

  const start = useMemo(
    () => ({
      latitude: initialLat ?? userLocation?.latitude ?? HOME.latitude,
      longitude: initialLng ?? userLocation?.longitude ?? HOME.longitude,
    }),
    // Only used for the initial region — deliberately not re-derived as the user pans.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [center, setCenter] = useState(start);
  const [places, setPlaces] = useState<{ name: string; lat: number; lng: number }[]>([]);

  useEffect(() => {
    let alive = true;
    placesApi.list().then((res: any) => { if (alive && Array.isArray(res.data)) setPlaces(res.data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const snapped = places.find((p) => distanceKm(center, p.lat, p.lng) * 1000 < SNAP_METERS);
  const label = snapped ? snapped.name : t('location.picker.pinnedLocation', { lat: center.latitude.toFixed(4), lng: center.longitude.toFixed(4) });

  const onRegionChangeComplete = (r: Region) => setCenter({ latitude: r.latitude, longitude: r.longitude });

  const goTo = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.008 }, 350);
  };

  const confirm = () => {
    const picked: PickedLocation = { name: label, lat: center.latitude, lng: center.longitude };
    if (returnTo) navigation.navigate({ name: returnTo, params: { pickedLocation: picked }, merge: true });
    else navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <StatusBar barStyle="light-content" />
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ ...start, latitudeDelta: 0.02, longitudeDelta: 0.016 }}
        userInterfaceStyle="dark"
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        customMapStyle={darkMapStyle}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsIndoors={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {Platform.OS === 'ios' && <Polygon coordinates={TINT} fillColor="rgba(24,26,40,0.74)" strokeColor="transparent" strokeWidth={0} />}
        {places.map((p) => (
          <PinMarker
            key={p.name}
            latitude={p.lat}
            longitude={p.lng}
            icon="map-pin"
            live={false}
            selected={snapped?.name === p.name}
            tag=""
            onPress={() => goTo(p.lat, p.lng)}
          />
        ))}
      </MapView>

      {/* Fixed centre pin: the map moves under it, not the other way round — the coordinate the user confirms
          is always exactly what's under this glyph. */}
      <View pointerEvents="none" style={styles.centerPin}>
        <Icon name="map-pin" size={34} color={Colors.primary} weight="fill" />
      </View>

      <View style={[styles.header, { paddingTop: top - 4 }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel={t('common.cancel')} style={styles.headerBtn}>
          <Text style={{ fontSize: 15, color: Ramp.neutral[400] }}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500' }}>{t('location.picker.title')}</Text>
        <View style={{ width: 66 }} />
      </View>

      {userLocation && (
        <Pressable onPress={() => goTo(userLocation.latitude, userLocation.longitude)} accessibilityLabel={t('location.picker.useMyLocation')} style={styles.recenter}>
          <Icon name="crosshair" size={18} color={Colors.textPrimary} />
        </Pressable>
      )}

      <View style={[styles.footer, { paddingBottom: bottom + 12 }]}>
        <View style={styles.labelRow}>
          <Icon name="map-pin" size={15} color={snapped ? Colors.primary : Ramp.neutral[400]} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: snapped ? Colors.primary : Ramp.neutral[300] }}>{label}</Text>
        </View>
        <Btn label={t('location.picker.confirm')} shape="pill" height={50} fontSize={15} onPress={confirm} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerPin: {
    position: 'absolute', left: '50%', top: '50%', width: 34, height: 34, marginLeft: -17, marginTop: -34,
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 8,
  },
  headerBtn: { height: 44, paddingHorizontal: 10, justifyContent: 'center' },
  recenter: {
    position: 'absolute', right: 16, bottom: 132, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceDark, borderWidth: 1, borderColor: 'rgba(233,233,237,0.16)',
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, rowGap: 10,
    backgroundColor: Colors.backgroundDark, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: 'rgba(233,233,237,0.10)',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', columnGap: 8 },
});
