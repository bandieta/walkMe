import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { placesApi } from '../../services/api';

export interface Place {
  id: string;
  name: string;
  category: 'park' | 'cafe' | 'vet' | 'beach' | 'trail' | 'store' | 'lake';
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isOpen: boolean;
  description: string;
  emoji: string;
}

interface PlacesState {
  places: Place[];
  selectedPlace: Place | null;
  loading: boolean;
  error: string | null;
  activeFilter: string;
}

const initialState: PlacesState = {
  places: [],
  selectedPlace: null,
  loading: false,
  error: null,
  activeFilter: 'all',
};

export const fetchPlaces = createAsyncThunk('places/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await placesApi.list();
    return res.data as Place[];
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to load places');
  }
});

export const fetchPlaceById = createAsyncThunk('places/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    const res = await placesApi.getById(id);
    return res.data as Place;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Failed to load place');
  }
});

const placesSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    setSelectedPlace(state, action: PayloadAction<Place | null>) {
      state.selectedPlace = action.payload;
    },
    setActiveFilter(state, action: PayloadAction<string>) {
      state.activeFilter = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPlaces.pending, state => { state.loading = true; state.error = null; })
      .addCase(fetchPlaces.fulfilled, (state, action: PayloadAction<Place[]>) => { state.loading = false; state.places = action.payload; })
      .addCase(fetchPlaces.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchPlaceById.fulfilled, (state, action: PayloadAction<Place>) => { state.selectedPlace = action.payload; });
  },
});

export const { setSelectedPlace, setActiveFilter } = placesSlice.actions;
export default placesSlice.reducer;
