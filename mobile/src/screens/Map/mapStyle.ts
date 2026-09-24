// Nocturne-toned dark map (Google provider on Android; iOS uses Apple's dark style via userInterfaceStyle).
// Shared between MapScreen and PickLocationScreen so both maps look the same.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1b1d2b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#161826' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#75798c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2c3b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#232532' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f424d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#12131e' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// Apple Maps can't be restyled, so a translucent ground-coloured sheet laid over the tiles (below the pins) pulls it into Nocturne.
export const TINT = [
  { latitude: 55, longitude: 17 }, { latitude: 55, longitude: 25 }, { latitude: 49.5, longitude: 25 }, { latitude: 49.5, longitude: 17 },
];
