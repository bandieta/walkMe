import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image, Alert, Platform, KeyboardAvoidingView, ViewStyle,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { createDog, updateDog, fetchMyDogs, NewDog } from '../../store/slices/dogsSlice';
import { storageApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { Btn, Placeholder, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

// Prototype 02 "dog": one form serves onboarding step 1 and the "Add a dog" screen (mode picks title / header / CTA).

export type DogFormMode = 'onboarding' | 'add';

const DIV = 'rgba(233,233,237,0.16)';
const AGES = ['Puppy', 'Adult', 'Senior'] as const;
const ENERGIES = ['Calm', 'Balanced', 'High'] as const;
const TEMPS = ['Friendly', 'Playful', 'Calm', 'Shy with big dogs', 'Loves fetch', 'Pulls on leash', 'Swimmer'];
// The API stores an integer age next to the design's Puppy / Adult / Senior group; these keep the two consistent
// (the profile screens fall back to <1 = Puppy, >8 = Senior when a dog has no ageGroup).
const AGE_YEARS: Record<(typeof AGES)[number], number> = { Puppy: 0, Adult: 3, Senior: 9 };

const COPY = {
  onboarding: { title: 'Tell us about your dog', body: 'Matches start with your dog, then you.', cta: 'Continue' },
  add: { title: 'Another dog in the family', body: 'Each dog gets their own card in Discover.', cta: 'Save dog' },
};

type Photo = { uri: string; name: string; type: string; remoteUrl?: string };

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={{ fontSize: 12, color: Ramp.neutral[400], top: -1 }}>{children}</Text>
);

const TextBox: React.FC<{
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string; style?: ViewStyle;
}> = ({ label, value, onChangeText, placeholder, style }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ flex: 1, minWidth: 0 }, style]}>
      <Label>{label}</Label>
      <View style={{
        height: 46, marginTop: 5, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
        borderColor: focused ? Colors.primary : DIV, paddingHorizontal: 12, justifyContent: 'center',
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Ramp.neutral[600]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: 15, lineHeight: 18, height: 44, padding: 0, color: Colors.textPrimary }}
        />
      </View>
    </View>
  );
};

/** The prototype's option row: one 1px divider frame, equal buttons, the picked one gets an inset 1px accent ring (no separators). */
function OptionRow<K extends string>({ label, options, value, onChange }: {
  label: string; options: readonly K[]; value: K; onChange: (k: K) => void;
}) {
  return (
    <View>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', marginTop: 6, height: 44, borderWidth: 1, borderColor: DIV, borderRadius: 8, overflow: 'hidden' }}>
        {options.map((o) => {
          const on = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {on && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: Colors.primary }} />}
              <Text style={{ fontSize: 13, color: on ? Colors.primary : Colors.textPrimary }}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const Chip: React.FC<{ label: string; on: boolean; onPress: () => void }> = ({ label, on, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1,
      borderColor: on ? Ramp.accent[800] : DIV, backgroundColor: on ? Ramp.accent[800] : 'transparent',
    }}
  >
    <Text style={{ fontSize: 12, color: on ? Ramp.accent[100] : Ramp.neutral[300] }}>{label}</Text>
  </Pressable>
);

export const DogForm: React.FC<{
  mode: DogFormMode;
  onBack: () => void;
  /** called once the dog is saved on the server */
  onSaved: () => void;
  /** onboarding only: leave the step without adding a dog */
  onSkip?: () => void;
}> = ({ mode, onBack, onSaved, onSkip }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { top, bottom } = useScreenInsets();
  const copy = COPY[mode];

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<(typeof AGES)[number]>('Adult');
  const [energy, setEnergy] = useState<(typeof ENERGIES)[number]>('Balanced');
  const [temps, setTemps] = useState<string[]>(['Friendly']);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [saving, setSaving] = useState(false);
  // Onboarding can be revisited with the back button: keep updating the same dog instead of creating a second one.
  const savedId = useRef<string | null>(null);

  const invalid = name.trim().length < 2;
  const showSkip = mode === 'onboarding' && !!onSkip;

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
      if (asset?.uri) {
        setPhoto({ uri: asset.uri, name: asset.fileName ?? `dog-${Date.now()}.jpg`, type: asset.type ?? 'image/jpeg' });
      }
    } catch {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  };

  const onPhotoPress = () => {
    if (!photo) return pickPhoto();
    Alert.alert('Dog photo', undefined, [
      { text: 'Choose another', onPress: pickPhoto },
      { text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleTemp = (t: string) => setTemps((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const submit = async () => {
    if (invalid || saving) return;
    setSaving(true);
    try {
      let photoUrl = photo?.remoteUrl;
      if (photo && !photoUrl) {
        const up = await storageApi.upload({ uri: photo.uri, name: photo.name, type: photo.type });
        photoUrl = up.data.url as string;
        setPhoto({ ...photo, remoteUrl: photoUrl });
      }
      const body: NewDog = {
        name: name.trim(),
        breed: breed.trim() || 'Mixed breed',
        age: AGE_YEARS[age],
        ageGroup: age,
        energy,
        personality: temps,
        ...(photoUrl ? { photoUrl } : {}),
      };
      if (savedId.current) {
        await dispatch(updateDog({ dogId: savedId.current, changes: body })).unwrap();
      } else {
        const dog = await dispatch(createDog(body)).unwrap();
        savedId.current = dog.id;
      }
      dispatch(fetchMyDogs());
      onSaved();
    } catch (e: any) {
      Alert.alert('Could not save your dog', typeof e === 'string' ? e : 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';
  const backBtn = (extra?: ViewStyle) => (
    <Pressable
      onPress={onBack}
      accessibilityLabel="Back"
      style={({ pressed }) => [
        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        pressed && { backgroundColor: 'rgba(233,233,237,0.07)' },
        extra,
      ]}
    >
      <Icon name={backIcon} size={20} color={Colors.textPrimary} />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {mode === 'onboarding' ? (
        <View style={{ paddingTop: top - 2, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {backBtn({ marginLeft: -12 })}
            <View style={{ flex: 1, height: 2, marginLeft: 10, backgroundColor: Ramp.neutral[900] }}>
              <View style={{ width: '33%', height: 2, backgroundColor: Colors.primary }} />
            </View>
            <Text style={{ fontSize: 12, color: Ramp.neutral[500], marginLeft: 10 }}>1 of 3</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: top - 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 16 }}>
          {backBtn()}
          <Text style={{ fontSize: 17, fontWeight: '500', marginLeft: 4 }}>Add a dog</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 24, paddingBottom: showSkip ? 58 : 24, rowGap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={{ fontSize: 26, fontWeight: '500', lineHeight: 26 * 1.12, letterSpacing: -0.39, marginBottom: 6 }}>{copy.title}</Text>
          <Text style={{ fontSize: 13, color: Ramp.neutral[400] }}>{copy.body}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={onPhotoPress} accessibilityLabel="Dog photo" style={{ width: 76, height: 76 }}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={{ width: 76, height: 76, borderRadius: 38 }} />
            ) : (
              <Placeholder stripe={7} radius={38} style={{ width: 76, height: 76 }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 9, fontWeight: '500', color: Ramp.neutral[500], lineHeight: 14 }}>photo</Text>
                </View>
              </Placeholder>
            )}
            {!!photo && <View pointerEvents="none" style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 40, borderWidth: 2, borderColor: Colors.primary }} />}
            <View style={{
              position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14,
              backgroundColor: Colors.backgroundDark, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={photo ? 'check' : 'plus'} size={14} color={Colors.primary} />
            </View>
          </Pressable>
          <Text style={{ fontSize: 12, color: Ramp.neutral[400], lineHeight: 12 * 1.45, marginLeft: 14 }}>{'A clear, well-lit photo\ngets more walk requests.'}</Text>
        </View>

        <View style={{ flexDirection: 'row', columnGap: 10 }}>
          <TextBox label="Name" value={name} onChangeText={setName} placeholder="Luna" />
          <TextBox label="Breed" value={breed} onChangeText={setBreed} placeholder="Golden Retriever" />
        </View>

        <OptionRow label="Age" options={AGES} value={age} onChange={setAge} />
        <OptionRow label="Energy" options={ENERGIES} value={energy} onChange={setEnergy} />

        <View>
          <Label>Temperament</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {TEMPS.map((t) => <Chip key={t} label={t} on={temps.includes(t)} onPress={() => toggleTemp(t)} />)}
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: bottom + 4 }}>
        {showSkip && (
          // Not in the prototype: a quiet escape hatch floating in the empty space above the CTA (does not affect layout).
          <Pressable onPress={onSkip} hitSlop={8} style={{ position: 'absolute', top: -34, left: 0, right: 0, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, color: Ramp.neutral[500] }}>Skip for now</Text>
          </Pressable>
        )}
        <Btn label={copy.cta} shape="pill" height={52} fontSize={16} onPress={submit} disabled={invalid} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
};
