import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Image, Alert, Platform, KeyboardAvoidingView, ViewStyle,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../../store';
import { createDog, updateDog, fetchMyDogs, Dog, NewDog } from '../../store/slices/dogsSlice';
import { resolveMediaUrl } from '../../utils/media';
import { ageGroupLabel, energyLabel, temperamentLabel } from '../../utils/dogLabels';
import { storageApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { Btn, Placeholder, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

// Prototype 02 "dog": one form serves onboarding step 1, "Add a dog" and "Edit dog" (mode picks title / header / CTA).

export type DogFormMode = 'onboarding' | 'add' | 'edit';

const DIV = 'rgba(233,233,237,0.16)';
// Fixed wire-format values (sent to the server as-is) — see utils/dogLabels.ts for their display translations.
const AGES = ['Puppy', 'Adult', 'Senior'] as const;
const ENERGIES = ['Calm', 'Balanced', 'High'] as const;
const TEMPS = ['Friendly', 'Playful', 'Calm', 'Shy with big dogs', 'Loves fetch', 'Pulls on leash', 'Swimmer'];
// The API stores an integer age next to the design's Puppy / Adult / Senior group; these keep the two consistent
// (the profile screens fall back to <1 = Puppy, >8 = Senior when a dog has no ageGroup).
const AGE_YEARS: Record<(typeof AGES)[number], number> = { Puppy: 0, Adult: 3, Senior: 9 };

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

const BIO_MAX = 500;

const NoteBox: React.FC<{
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
}> = ({ label, value, onChangeText, placeholder }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Label>{label}</Label>
        <Text style={{ fontSize: 11, color: Ramp.neutral[600] }}>{value.length}/{BIO_MAX}</Text>
      </View>
      <View style={{
        minHeight: 80, marginTop: 5, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
        borderColor: focused ? Colors.primary : DIV, paddingHorizontal: 12, paddingVertical: 10,
      }}>
        <TextInput
          value={value}
          onChangeText={(v) => onChangeText(v.slice(0, BIO_MAX))}
          placeholder={placeholder}
          placeholderTextColor={Ramp.neutral[600]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          autoCapitalize="sentences"
          multiline
          textAlignVertical="top"
          maxLength={BIO_MAX}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: 14, lineHeight: 20, minHeight: 60, padding: 0, color: Colors.textPrimary }}
        />
      </View>
    </View>
  );
};

/** The prototype's option row: one 1px divider frame, equal buttons, the picked one gets an inset 1px accent ring (no separators). */
function OptionRow<K extends string>({ label, options, value, onChange, labelOf }: {
  label: string; options: readonly K[]; value: K; onChange: (k: K) => void; labelOf: (k: K) => string;
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
              {/* Equal-width segments: a longer translated label shrinks rather than wrapping or clipping. */}
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: 13, color: on ? Colors.primary : Colors.textPrimary, paddingHorizontal: 2 }}>
                {labelOf(o)}
              </Text>
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
  /** edit mode: the dog being edited, used to pre-fill every field */
  initialDog?: Dog;
}> = ({ mode, onBack, onSaved, onSkip, initialDog }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top, bottom } = useScreenInsets();
  const COPY = {
    onboarding: { title: t('dogs.form.onboarding.title'), body: t('dogs.form.onboarding.body'), cta: t('common.next') },
    add: { title: t('dogs.form.add.title'), body: t('dogs.form.add.body'), cta: t('dogs.form.add.cta') },
    edit: { title: t('dogs.form.edit.title'), body: t('dogs.form.edit.body'), cta: t('dogs.form.edit.cta') },
  };
  const copy = COPY[mode];

  const [name, setName] = useState(initialDog?.name ?? '');
  const [breed, setBreed] = useState(initialDog?.breed ?? '');
  const [age, setAge] = useState<(typeof AGES)[number]>(
    initialDog?.ageGroup ?? (initialDog ? (initialDog.age < 1 ? 'Puppy' : initialDog.age > 8 ? 'Senior' : 'Adult') : 'Adult'),
  );
  const [energy, setEnergy] = useState<(typeof ENERGIES)[number]>(initialDog?.energy ?? 'Balanced');
  const [temps, setTemps] = useState<string[]>(initialDog?.personality?.length ? initialDog.personality : ['Friendly']);
  const [bio, setBio] = useState(initialDog?.bio ?? '');
  const [photo, setPhoto] = useState<Photo | null>(
    initialDog?.photoUrl ? { uri: resolveMediaUrl(initialDog.photoUrl)!, name: '', type: '', remoteUrl: initialDog.photoUrl } : null,
  );
  const [saving, setSaving] = useState(false);
  // Onboarding can be revisited with the back button, and edit starts from an existing
  // dog: either way, keep updating the same dog instead of creating a second one.
  const savedId = useRef<string | null>(initialDog?.id ?? null);

  const invalid = name.trim().length < 2;
  const showSkip = mode === 'onboarding' && !!onSkip;

  const pickPhoto = async () => {
    let picker: any;
    try {
      picker = require('react-native-image-picker');
    } catch {
      Alert.alert(t('dogs.form.photosUnavailableTitle'), t('dogs.form.photosUnavailableBody'));
      return;
    }
    try {
      const res = await picker.launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 1200, maxHeight: 1200 });
      const asset = res?.assets?.[0];
      if (asset?.uri) {
        setPhoto({ uri: asset.uri, name: asset.fileName ?? `dog-${Date.now()}.jpg`, type: asset.type ?? 'image/jpeg' });
      }
    } catch {
      Alert.alert(t('dogs.form.couldNotOpenPhotosTitle'), t('common.connectionError'));
    }
  };

  const onPhotoPress = () => {
    if (!photo) return pickPhoto();
    Alert.alert(t('dogs.form.dogPhoto'), undefined, [
      { text: t('dogs.form.chooseAnother'), onPress: pickPhoto },
      { text: t('dogs.form.removePhoto'), style: 'destructive', onPress: () => setPhoto(null) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const toggleTemp = (temp: string) => setTemps((cur) => (cur.includes(temp) ? cur.filter((x) => x !== temp) : [...cur, temp]));

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
        breed: breed.trim() || t('dogs.form.mixedBreed'),
        age: AGE_YEARS[age],
        ageGroup: age,
        energy,
        personality: temps,
        bio: bio.trim(),
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
      Alert.alert(t('dogs.form.couldNotSaveTitle'), typeof e === 'string' ? e : t('common.connectionError'));
    } finally {
      setSaving(false);
    }
  };

  const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';
  const backBtn = (extra?: ViewStyle) => (
    <Pressable
      onPress={onBack}
      accessibilityLabel={t('common.back')}
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
            <Text style={{ fontSize: 12, color: Ramp.neutral[500], marginLeft: 10 }}>{t('onboarding.stepOf', { step: 1, total: 3 })}</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: top - 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 16 }}>
          {backBtn()}
          <Text style={{ fontSize: 17, fontWeight: '500', marginLeft: 4 }}>{mode === 'edit' ? t('dogs.form.editDog') : t('dogs.form.addDog')}</Text>
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
          <Pressable onPress={onPhotoPress} accessibilityLabel={t('dogs.form.dogPhoto')} style={{ width: 76, height: 76 }}>
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
          <Text style={{ fontSize: 12, color: Ramp.neutral[400], lineHeight: 12 * 1.45, marginLeft: 14 }}>{t('dogs.form.photoHint')}</Text>
        </View>

        <View style={{ flexDirection: 'row', columnGap: 10 }}>
          <TextBox label={t('dogs.form.name')} value={name} onChangeText={setName} placeholder={t('dogs.form.namePlaceholder')} />
          <TextBox label={t('dogs.form.breed')} value={breed} onChangeText={setBreed} placeholder={t('dogs.form.breedPlaceholder')} />
        </View>

        <OptionRow label={t('dogs.form.age')} options={AGES} value={age} onChange={setAge} labelOf={(o) => ageGroupLabel(t, o)} />
        <OptionRow label={t('dogs.form.energy')} options={ENERGIES} value={energy} onChange={setEnergy} labelOf={(o) => energyLabel(t, o)} />

        <View>
          <Label>{t('dogs.form.temperament')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {TEMPS.map((temp) => (
              <Chip key={temp} label={temperamentLabel(t, temp)} on={temps.includes(temp)} onPress={() => toggleTemp(temp)} />
            ))}
          </View>
        </View>

        <NoteBox label={t('dogs.form.note')} value={bio} onChangeText={setBio} placeholder={t('dogs.form.notePlaceholder')} />
      </ScrollView>

      <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: bottom + 4 }}>
        {showSkip && (
          // Not in the prototype: a quiet escape hatch floating in the empty space above the CTA (does not affect layout).
          <Pressable onPress={onSkip} hitSlop={8} style={{ position: 'absolute', top: -34, left: 0, right: 0, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, color: Ramp.neutral[500] }}>{t('dogs.form.skipForNow')}</Text>
          </Pressable>
        )}
        <Btn label={copy.cta} shape="pill" height={52} fontSize={16} onPress={submit} disabled={invalid} loading={saving} />
      </View>
    </KeyboardAvoidingView>
  );
};
