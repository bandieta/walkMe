import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { placesApi, walksApi, usersApi } from '../../services/api';
import { Colors, Ramp } from '../../utils/theme';
import { Icon, IconName } from '../../components/Icon';
import { Btn, Hairline, ShelterHeartBadge, useScreenInsets } from '../../ui';
import { useToast } from '../../components/Toast';
import { LocationField } from '../../components/LocationField';
import { PickedLocation } from '../Location/PickLocationScreen';
import { walkCategoryLabel } from '../../utils/categoryLabels';
import type { TFunction } from 'i18next';

/**
 * "New walk" from the prototype (08 create walk): Cancel / title header, a scrolling form (type, title, meeting
 * point, day, start time, duration, max people, description) and a pill "Create walk" button on a hairline footer.
 * Submit posts the walk and replaces this screen with the created walk.
 */

const DIV = 'rgba(233,233,237,0.16)';
const CHIP_ON_BG = 'rgba(145,132,217,0.12)';
const WARSAW = { latitude: 52.2297, longitude: 21.0122 };

const CATEGORIES: { label: string; icon: IconName }[] = [
  { label: 'Park', icon: 'tree' },
  { label: 'Trail', icon: 'tree-evergreen' },
  { label: 'Lake', icon: 'waves' },
  { label: 'Beach', icon: 'umbrella-simple' },
  { label: 'Café', icon: 'coffee' },
  { label: 'City', icon: 'buildings' },
];
const TIMES = ['07:00', '08:30', '12:00', '17:30', '19:00'];
const DURATIONS = ['30 min', '1 h', '1.5 h', '2 h', '2 h+'];
// Server-parsed (ProfileScreen stats regex expects "<number> min|h"), so the stored value stays this format
// regardless of language — only DURATIONS' Chip *labels* would need translating, and "30 min"/"1 h" read fine
// as-is in all three languages, so they're left alone rather than risking that parser.
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_COUNT = 7;
const MIN_LEN = 3;

const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Today, Tomorrow, then "Fri 26"-style chips for the rest of the week. */
function buildDays(t: TFunction) {
  const today = startOf(new Date());
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const label = i === 0 ? t('common.today') : i === 1 ? t('common.tomorrow') : `${t(`common.weekdaysShort.${WEEKDAY_KEYS[date.getDay()]}`)} ${date.getDate()}`;
    return { label, date };
  });
}

function startAt(day: Date, time: string) {
  const [h, m] = time.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

/** The prototype's `chip(on)`: accent ring + 12% accent wash when selected, neutral-300 text otherwise. */
const chipStyle = (on: boolean) => ({
  borderColor: on ? Colors.primary : DIV,
  backgroundColor: on ? CHIP_ON_BG : 'transparent',
});
const chipColor = (on: boolean) => (on ? Colors.primary : Ramp.neutral[300]);

const Chip: React.FC<{
  label: string;
  on: boolean;
  onPress: () => void;
  icon?: IconName;
  shelter?: boolean;
  radius?: number;
  paddingH?: number;
  fixed?: boolean;
}> = ({ label, on, onPress, icon, shelter, radius = 8, paddingH = 13, fixed }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected: on }}
    style={[
      {
        height: 36, paddingHorizontal: paddingH, borderRadius: radius, borderWidth: 1, flexDirection: 'row', alignItems: 'center', columnGap: 6,
        flexShrink: fixed ? 0 : undefined,
      },
      chipStyle(on),
    ]}
  >
    {/* Shelter dogs get the design system's gradient heart badge instead of a flat icon — same as everywhere
        else a shelter dog needs to read as one at a glance. */}
    {shelter ? (
      <ShelterHeartBadge size={16} />
    ) : (
      icon && <Icon name={icon} size={13} color={chipColor(on)} />
    )}
    <Text style={{ fontSize: 13, color: chipColor(on) }}>{label}</Text>
  </Pressable>
);

// RN seats a text line about a point lower inside its 1.55 line box than CSS does; nudge the small labels back up.
const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={{ fontSize: 12, color: Ramp.neutral[400], transform: [{ translateY: -1 }] }}>{children}</Text>
);

/** 46px surface input, radius 8, 1px divider border that turns accent while focused (accent-300 on error). */
const Input: React.FC<{
  value: string; onChangeText: (t: string) => void; placeholder: string; error?: boolean; multiline?: boolean; leftIcon?: IconName;
  maxLength?: number; onFocus: () => void; onBlur: () => void; returnKeyType?: 'next' | 'done'; onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
}> = ({ value, onChangeText, placeholder, error, multiline, leftIcon, maxLength, onFocus, onBlur, returnKeyType, onSubmitEditing, inputRef }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        height: multiline ? 90 : 46, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
        borderColor: focused ? Colors.primary : error ? Ramp.accent[300] : DIV,
        paddingLeft: leftIcon ? 36 : 12, paddingRight: 12, paddingTop: multiline ? 10 : 0, paddingBottom: multiline ? 10 : 0,
        justifyContent: 'center',
      }}
    >
      {leftIcon && (
        <View style={{ position: 'absolute', left: 11, top: 13 }} pointerEvents="none">
          <Icon name={leftIcon} size={17} color={Ramp.neutral[500]} />
        </View>
      )}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Ramp.neutral[600]}
        selectionColor={Colors.primary}
        cursorColor={Colors.primary}
        multiline={multiline}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => { setFocused(true); onFocus(); }}
        onBlur={() => { setFocused(false); onBlur(); }}
        style={{
          fontSize: multiline ? 14 : 15, color: Colors.textPrimary, padding: 0, margin: 0,
          ...(multiline ? { flex: 1 } : { height: 44, lineHeight: 18 }),
        }}
      />
    </View>
  );
};

/** Optional prefill, as the prototype does for "Plan a walk here" (place + type) and "Plan walk" (title). */
export interface CreateWalkParams { title?: string; point?: string; category?: string; description?: string; pickedLocation?: PickedLocation }

export const CreateWalkScreen: React.FC<{ navigation: any; route?: { params?: CreateWalkParams } }> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const prefill = route?.params;
  const { top, bottom } = useScreenInsets();
  const dispatch = useDispatch<AppDispatch>();
  const userLocation = useSelector((s: RootState) => s.map.userLocation);
  const { show: showToast, element: toast } = useToast();

  const days = useMemo(() => buildDays(t), [t]);
  // Today's 17:30 may already be gone: then the form opens on Tomorrow instead of a start time in the past.
  const [dayIdx, setDayIdx] = useState(() => (startAt(days[0].date, '17:30').getTime() > Date.now() ? 0 : 1));
  const [category, setCategory] = useState(() => CATEGORIES.find((c) => c.label === prefill?.category)?.label ?? 'Park');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [point, setPoint] = useState(prefill?.point ?? prefill?.pickedLocation?.name ?? '');
  // Set once a meeting point is picked on the map (or the screen opened from "Plan a walk here"): the exact
  // coordinates under the pin, kept in lockstep with `point` so the two can never disagree. Typing again ("Change")
  // clears both, falling back to the known-places name match below.
  const [pointCoords, setPointCoords] = useState<{ lat: number; lng: number } | null>(
    prefill?.pickedLocation ? { lat: prefill.pickedLocation.lat, lng: prefill.pickedLocation.lng } : null,
  );
  const [time, setTime] = useState('17:30');
  const [duration, setDuration] = useState('1 h');
  const [max, setMax] = useState(8);
  const [desc, setDesc] = useState(prefill?.description ?? '');
  const [busy, setBusy] = useState(false);

  // Dogs available to bring: your own, or any shelter dog you've been approved to walk (see ChatListScreen's
  // shelter-request inbox). `null` means going without a dog, always an option.
  const [walkableDogs, setWalkableDogs] = useState<{ ownDogs: any[]; shelterDogs: any[] }>({ ownDogs: [], shelterDogs: [] });
  const [dogId, setDogId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    usersApi.getWalkableDogs().then((r) => { if (alive) setWalkableDogs(r.data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  const dogChoices = useMemo(
    () => [
      ...walkableDogs.ownDogs.map((d) => ({ id: d.id, name: d.name, shelter: false })),
      ...walkableDogs.shelterDogs.map((d) => ({ id: d.id, name: d.name, shelter: true })),
    ],
    [walkableDogs],
  );

  // A pick returned from PickLocationScreen (`navigation.navigate({ name: 'CreateWalk', params: { pickedLocation } })`).
  useEffect(() => {
    const picked = route?.params?.pickedLocation;
    if (!picked) return;
    setPoint(picked.name);
    setPointCoords({ lat: picked.lat, lng: picked.lng });
    navigation.setParams({ pickedLocation: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.pickedLocation]);

  const trimmedTitle = title.trim();
  const titleErr = trimmedTitle.length > 0 && trimmedTitle.length < MIN_LEN;
  const invalid = trimmedTitle.length < MIN_LEN || point.trim().length < MIN_LEN;

  // Known places by name, so a meeting point picked from the map's places keeps its real coordinates.
  const places = useRef<{ name: string; lat: number; lng: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    placesApi.list().then((r: any) => { if (!cancelled && Array.isArray(r?.data)) places.current = r.data; }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  // Keep the focused field visible above the keyboard: the form shrinks with the keyboard, then scrolls to the field.
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});
  const focusedKey = useRef<string | null>(null);
  const keyboardUp = useRef(false);
  const [kb, setKb] = useState(false);
  const scrollToField = useCallback((key: string | null) => {
    const y = key ? fieldY.current[key] : undefined;
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  }, []);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      keyboardUp.current = true;
      setKb(true);
      const key = focusedKey.current;
      setTimeout(() => scrollToField(key), Platform.OS === 'ios' ? 280 : 60);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardUp.current = false;
      setKb(false);
    });
    return () => { show.remove(); hide.remove(); };
  }, [scrollToField]);
  const onFocusField = (key: string) => () => {
    focusedKey.current = key;
    if (keyboardUp.current) scrollToField(key);
  };
  const onBlurField = (key: string) => () => { if (focusedKey.current === key) focusedKey.current = null; };
  const measure = (key: string) => (e: any) => { fieldY.current[key] = e.nativeEvent.layout.y; };

  const descRef = useRef<TextInput>(null);

  const create = async () => {
    if (invalid || busy) return;
    Keyboard.dismiss();
    const scheduledAt = startAt(days[dayIdx].date, time);
    if (scheduledAt.getTime() <= Date.now()) {
      showToast(t('walks.create.pastTimeWarning'), 'warning');
      return;
    }
    const name = point.trim();
    const known = places.current.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    const where = pointCoords
      ? { latitude: pointCoords.lat, longitude: pointCoords.lng }
      : known
        ? { latitude: known.lat, longitude: known.lng }
        : userLocation ?? WARSAW;
    setBusy(true);
    try {
      const res = await walksApi.create({
        title: trimmedTitle,
        ...(desc.trim() ? { description: desc.trim() } : {}),
        category,
        meetingPoint: name,
        meetingLat: where.latitude,
        meetingLng: where.longitude,
        scheduledAt: scheduledAt.toISOString(),
        maxParticipants: max,
        duration,
        ...(dogId ? { dogId } : {}),
      });
      dispatch(fetchNearbyWalks());
      const id = res?.data?.id;
      if (id) navigation.replace('WalkDetail', { walkId: id });
      else navigation.goBack();
    } catch (err: any) {
      setBusy(false);
      showToast(err?.response?.data?.error?.message ?? err?.message ?? t('walks.create.couldNotCreate'), 'error');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Header: padding 52 12 8, Cancel (44px tall, 10px inset) / title / 66px spacer. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: top - 4, paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 15, color: Ramp.neutral[400] }}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500' }}>{t('walks.create.title')}</Text>
        <View style={{ width: 66 }} />
      </View>

      {/* Form: padding 10 20 24, gap 18. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24, rowGap: 18 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ rowGap: 8 }}>
          <Text style={{ fontSize: 11, lineHeight: 17, letterSpacing: 1.1, textTransform: 'uppercase', color: Ramp.neutral[500], transform: [{ translateY: -1 }] }}>{t('walks.create.type')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.label} label={walkCategoryLabel(t, c.label)} icon={c.icon} on={category === c.label} onPress={() => setCategory(c.label)} radius={18} paddingH={12} />
            ))}
          </View>
        </View>

        <View style={{ rowGap: 6 }} onLayout={measure('title')}>
          <Label>{t('walks.create.titleLabel')}</Label>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder={t('walks.create.titlePlaceholder')}
            error={titleErr}
            maxLength={80}
            returnKeyType="done"
            onFocus={onFocusField('title')}
            onBlur={onBlurField('title')}
          />
          {titleErr && <Text style={{ fontSize: 12, color: Ramp.accent[300] }}>{t('walks.create.titleTooShort')}</Text>}
        </View>

        <View onLayout={measure('point')}>
          <LocationField
            label={t('walks.create.meetingPoint')}
            value={point}
            onChangeText={setPoint}
            placeholder={t('walks.create.meetingPointPlaceholder')}
            maxLength={120}
            locked={!!pointCoords}
            onPickFromMap={() => {
              Keyboard.dismiss();
              navigation.navigate('PickLocation', {
                initialLat: pointCoords?.lat ?? userLocation?.latitude,
                initialLng: pointCoords?.lng ?? userLocation?.longitude,
                returnTo: 'CreateWalk',
              });
            }}
            onChangeMode={() => setPointCoords(null)}
          />
        </View>

        {dogChoices.length > 0 && (
          <View style={{ rowGap: 8 }}>
            <Label>{t('walks.create.bringDog')}</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
              <Chip label={t('walks.create.noDog')} on={dogId === null} onPress={() => setDogId(null)} fixed />
              {dogChoices.map((d) => (
                <Chip
                  key={d.id}
                  label={d.name}
                  shelter={d.shelter}
                  on={dogId === d.id}
                  onPress={() => setDogId(d.id)}
                  fixed
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ rowGap: 8 }}>
          <Label>{t('walks.create.day')}</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
            {days.map((d, i) => (
              <Chip key={d.label} label={d.label} on={dayIdx === i} onPress={() => setDayIdx(i)} fixed />
            ))}
          </ScrollView>
        </View>

        <View style={{ rowGap: 8 }}>
          <Label>{t('walks.create.startTime')}</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
            {TIMES.map((tm) => (
              <Chip key={tm} label={tm} on={time === tm} onPress={() => setTime(tm)} fixed />
            ))}
          </ScrollView>
        </View>

        <View style={{ rowGap: 8 }}>
          <Label>{t('walks.create.duration')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DURATIONS.map((d) => (
              <Chip key={d} label={d} on={duration === d} onPress={() => setDuration(d)} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14 }}>{t('walks.create.maxPeople')}</Text>
            <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>{t('walks.create.includingYou')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderColor: DIV, borderRadius: 8 }}>
            <Pressable
              onPress={() => setMax((m) => Math.max(2, m - 1))}
              accessibilityRole="button"
              accessibilityLabel={t('walks.create.fewer')}
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 7, borderBottomLeftRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="minus" size={16} color={Colors.textPrimary} />
            </Pressable>
            <Text style={{ width: 34, textAlign: 'center', fontSize: 15 }}>{max}</Text>
            <Pressable
              onPress={() => setMax((m) => Math.min(30, m + 1))}
              accessibilityRole="button"
              accessibilityLabel={t('walks.create.more')}
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 7, borderBottomRightRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="plus" size={16} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={{ rowGap: 6 }} onLayout={measure('desc')}>
          <Label>{t('walks.create.description')}</Label>
          <Input
            inputRef={descRef}
            value={desc}
            onChangeText={setDesc}
            placeholder={t('walks.create.descriptionPlaceholder')}
            multiline
            maxLength={1000}
            onFocus={onFocusField('desc')}
            onBlur={onBlurField('desc')}
          />
        </View>
      </ScrollView>

      {/* Footer: hairline on top (fading over 48px at each end), padding 12 20 36, 52px pill button. */}
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: kb ? 12 : bottom + 2 }}>
        <FooterRule />
        <Btn label={t('walks.create.cta')} shape="pill" height={52} fontSize={16} onPress={create} disabled={invalid} loading={busy} />
      </View>

      {toast}
    </KeyboardAvoidingView>
  );
};

/** The footer's 1px divider rule, absolutely placed along the top edge. */
const FooterRule: React.FC = () => <Hairline tone="divider" style={{ position: 'absolute', left: 0, right: 0, top: 0 }} />;
