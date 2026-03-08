import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { walks } = useSelector((s: RootState) => s.walks);

  useEffect(() => {
    // Default to Warsaw coordinates; in production use Geolocation.getCurrentPosition
    dispatch(fetchNearbyWalks({ lat: 52.2297, lng: 21.0122, radiusKm: 10 }));
  }, [dispatch]);

  return (
    <View style={styles.container}>
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
        showsMyLocationButton
      >
        {walks.map((walk) => (
          <Marker
            key={walk.id}
            coordinate={{ latitude: walk.meetingLat, longitude: walk.meetingLng }}
            title={walk.title}
            description={`${walk.participants.length}/${walk.maxParticipants} participants`}
            pinColor="#4CAF50"
            onCalloutPress={() => navigation.navigate('WalkDetail', { walkId: walk.id })}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateWalk')}
      >
        <Text style={styles.fabText}>+ New Walk</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 28, elevation: 4, shadowColor: '#000', shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
