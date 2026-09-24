import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { userUpdated } from '../../store/slices/authSlice';
import { usersApi, storageApi } from '../../services/api';
import { useScreenInsets } from '../../ui';
import { cssText } from '../../ui/cssLine';
import { Colors, Ramp } from '../../utils/theme';
import { ProfileAvatar } from './ProfileAvatar';
import { LocationField } from '../../components/LocationField';

// Prototype 14 "Edit profile": Cancel / title / Save header, avatar + "Change photo", Name, Neighbourhood, About you (160).

const DIV = 'rgba(233,233,237,0.16)';
const BIO_MAX = 160;

// iOS lays multiline TextInput lines ~10% tighter than the lineHeight it is given, so the design's 21px (1.5) needs ~24.6 there
// (and a 2px lift to keep the first line where the prototype has it). Android honours lineHeight as is.
const BIO_LINE = Platform.OS === 'ios' ? { lineHeight: 24.6, marginTop: -2 } : { lineHeight: 21 };

type Photo = { uri: string; name: string; type: string };

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={cssText(12, { color: Ramp.neutral[400], top: -1 })}>{children}</Text>
);

/** 46px surface input (radius 8, divider border, accent border while focused), 15px text. */
const TextBox: React.FC<{
  value: string; onChangeText: (v: string) => void; placeholder?: string; autoCapitalize?: 'words' | 'sentences' | 'none'; maxLength?: number;
}> = ({ value, onChangeText, placeholder, autoCapitalize = 'words', maxLength }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{
      height: 46, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
      borderColor: focused ? Colors.primary : DIV, paddingHorizontal: 12, justifyContent: 'center',
    }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Ramp.neutral[600]}
        selectionColor={Colors.primary}
        cursorColor={Colors.primary}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ fontSize: 15, lineHeight: 18, height: 44, padding: 0, color: Colors.textPrimary }}
      />
    </View>
  );
};

export const EditProfileScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const user = useSelector((s: RootState) => s.auth.user);

  const [name, setName] = useState(user?.displayName ?? '');
  const [loc, setLoc] = useState(user?.location ?? '');
  // Set when the neighbourhood is (or already was) an exact map pick, kept in lockstep with `loc` so the two can
  // never disagree — mirrors CreateWalk/CreateEventScreen's LocationField wiring. Typing again ("Change") clears
  // both; the server keeps whatever coordinates it already had, since lat/lng are simply left out of the save.
  const [locCoords, setLocCoords] = useState<{ lat: number; lng: number } | null>(
    user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : null,
  );
  const [bio, setBio] = useState(user?.bio ?? '');
  const [bioFocused, setBioFocused] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [saving, setSaving] = useState(false);

  const invalid = name.trim().length < 2;

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProfileHome'));

  // A pick returned from PickLocationScreen (`navigation.navigate({ name: 'EditProfile', params: { pickedLocation } })`).
  useEffect(() => {
    const picked = route?.params?.pickedLocation;
    if (!picked) return;
    setLoc(picked.name);
    setLocCoords({ lat: picked.lat, lng: picked.lng });
    navigation.setParams({ pickedLocation: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.pickedLocation]);

  const pickPhoto = async () => {
    let picker: any;
    try {
      picker = require('react-native-image-picker');
    } catch {
      Alert.alert('Photos unavailable', 'Photo picking is not available in this build.');
      return;
    }
    try {
      const res = await picker.launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 1200, maxHeight: 1200 });
      const asset = res?.assets?.[0];
      if (asset?.uri) setPhoto({ uri: asset.uri, name: asset.fileName ?? `profile-${Date.now()}.jpg`, type: asset.type ?? 'image/jpeg' });
    } catch {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  };

  const save = async () => {
    if (invalid || saving) return;
    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photo) {
        const up = await storageApi.upload({ uri: photo.uri, name: photo.name, type: photo.type });
        photoUrl = up.data.url as string;
      }
      const res = await usersApi.updateProfile({
        displayName: name.trim(),
        location: loc.trim(),
        bio: bio.trim(),
        ...(photoUrl ? { photoUrl } : {}),
        ...(locCoords ? { lat: locCoords.lat, lng: locCoords.lng } : {}),
      });
      const saved = res?.data ?? {};
      dispatch(userUpdated({
        displayName: saved.displayName ?? name.trim(),
        location: saved.location ?? loc.trim(),
        bio: saved.bio ?? bio.trim(),
        ...(saved.photoUrl || photoUrl ? { photoUrl: saved.photoUrl ?? photoUrl } : {}),
        ...(locCoords ? { lat: saved.lat ?? locCoords.lat, lng: saved.lng ?? locCoords.lng } : {}),
      }));
      navigation.navigate({ name: 'ProfileHome', params: { toast: 'Profile saved' }, merge: true });
    } catch (e: any) {
      Alert.alert('Could not save your profile', e?.response?.data?.error?.message ?? 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: top - 4, paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable onPress={close} accessibilityRole="button" style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={cssText(15, { color: Ramp.neutral[400] })}>Cancel</Text>
        </Pressable>
        <Text accessibilityRole="header" style={cssText(17, { fontWeight: '500' })}>Edit profile</Text>
        <Pressable
          onPress={save}
          disabled={invalid || saving}
          accessibilityRole="button"
          style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center', opacity: invalid ? 0.45 : saving ? 0.6 : 1 }}
        >
          <Text style={cssText(15, { fontWeight: '500', color: Colors.primary })}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 20, paddingBottom: 24, rowGap: 18 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 14 }}>
          <ProfileAvatar name={name} photoUrl={photo?.uri ?? user?.photoUrl} />
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            style={({ pressed }) => ({
              height: 36, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: DIV,
              alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
            })}
          >
            <Text style={cssText(13)}>Change photo</Text>
          </Pressable>
        </View>

        <View style={{ rowGap: 6 }}>
          <Label>Name</Label>
          <TextBox value={name} onChangeText={setName} />
        </View>

        <LocationField
          label="Neighbourhood"
          value={loc}
          onChangeText={setLoc}
          placeholder="Mokotów, Warsaw"
          maxLength={120}
          locked={!!locCoords}
          onPickFromMap={() => navigation.navigate('PickLocation', { initialLat: locCoords?.lat, initialLng: locCoords?.lng, returnTo: 'EditProfile' })}
          onChangeMode={() => setLocCoords(null)}
        />

        <View style={{ rowGap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Label>About you</Label>
            <Label>{`${bio.length}/${BIO_MAX}`}</Label>
          </View>
          <View style={{
            height: 110, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
            borderColor: bioFocused ? Colors.primary : DIV, paddingHorizontal: 12, paddingVertical: 10,
          }}>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={BIO_MAX}
              placeholderTextColor={Ramp.neutral[600]}
              selectionColor={Colors.primary}
              cursorColor={Colors.primary}
              textAlignVertical="top"
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              style={{ flex: 1, fontSize: 14, ...BIO_LINE, padding: 0, color: Colors.textPrimary }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
