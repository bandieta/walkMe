import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Coordinates {
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapState {
  userLocation: Coordinates | null;
  mapRegion: MapRegion;
  isFollowingUser: boolean;
  locationPermissionGranted: boolean;
}

const DEFAULT_REGION: MapRegion = {
  latitude: 52.229676,
  longitude: 21.012229,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const initialState: MapState = {
  userLocation: null,
  mapRegion: DEFAULT_REGION,
  isFollowingUser: true,
  locationPermissionGranted: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setUserLocation(state, action: PayloadAction<Coordinates>) {
      state.userLocation = action.payload;
      if (state.isFollowingUser) {
        state.mapRegion = {
          ...action.payload,
          latitudeDelta: state.mapRegion.latitudeDelta,
          longitudeDelta: state.mapRegion.longitudeDelta,
        };
      }
    },
    setMapRegion(state, action: PayloadAction<MapRegion>) {
      state.mapRegion = action.payload;
    },
    setFollowingUser(state, action: PayloadAction<boolean>) {
      state.isFollowingUser = action.payload;
    },
    setLocationPermission(state, action: PayloadAction<boolean>) {
      state.locationPermissionGranted = action.payload;
    },
  },
});

export const { setUserLocation, setMapRegion, setFollowingUser, setLocationPermission } = mapSlice.actions;
export default mapSlice.reducer;
