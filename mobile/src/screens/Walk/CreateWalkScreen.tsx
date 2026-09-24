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
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { placesApi, walksApi } from '../../services/api';
import { Colors, Ramp } from '../../utils/theme';
import { Icon, IconName } from '../../components/Icon';
import { Btn, Hairline, useScreenInsets } from '../../ui';
import { useToast } from '../../components/Toast';

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
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_COUNT = 7;
const MIN_LEN = 3;

const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Today, Tomorrow, then "Fri 26"-style chips for the rest of the week. */
function buildDays() {
  const today = startOf(new Date());
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;
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

const Chip: React.FC<{ label: string; on: boolean; onPress: () => void; icon?: IconName; radius?: number; paddingH?: number; fixed?: boolean }> = ({
  label, on, onPress, icon, radius = 8, paddingH = 13, fixed,
}) => (
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
    {icon && <Icon name={icon} size={13} color={chipColor(on)} />}
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
export interface CreateWalkParams { title?: string; point?: string; category?: string; description?: string }

export const CreateWalkScreen: React.FC<{ navigation: any; route?: { params?: CreateWalkParams } }> = ({ navigation, route }) => {
  const prefill = route?.params;
  const { top, bottom } = useScreenInsets();
  const dispatch = useDispatch<AppDispatch>();
  const userLocation = useSelector((s: RootState) => s.map.userLocation);
  const { show: showToast, element: toast } = useToast();

  const days = useMemo(buildDays, []);
  // Today's 17:30 may already be gone: then the form opens on Tomorrow instead of a start time in the past.
  const [dayIdx, setDayIdx] = useState(() => (startAt(days[0].date, '17:30').getTime() > Date.now() ? 0 : 1));
  const [category, setCategory] = useState(() => CATEGORIES.find((c) => c.label === prefill?.category)?.label ?? 'Park');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [point, setPoint] = useState(prefill?.point ?? '');
  const [time, setTime] = useState('17:30');
  const [duration, setDuration] = useState('1 h');
  const [max, setMax] = useState(8);
  const [desc, setDesc] = useState(prefill?.description ?? '');
  const [busy, setBusy] = useState(false);

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

  const pointRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  const create = async () => {
    if (invalid || busy) return;
    Keyboard.dismiss();
    const scheduledAt = startAt(days[dayIdx].date, time);
    if (scheduledAt.getTime() <= Date.now()) {
      showToast('That start time has already passed. Pick a later one.', 'warning');
      return;
    }
    const name = point.trim();
    const known = places.current.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    const where = known ? { latitude: known.lat, longitude: known.lng } : userLocation ?? WARSAW;
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
      });
      dispatch(fetchNearbyWalks());
      const id = res?.data?.id;
      if (id) navigation.replace('WalkDetail', { walkId: id });
      else navigation.goBack();
    } catch (err: any) {
      setBusy(false);
      showToast(err?.response?.data?.error?.message ?? err?.message ?? 'Could not create the walk. Please try again.', 'error');
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
          accessibilityLabel="Cancel"
          style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 15, color: Ramp.neutral[400] }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500' }}>New walk</Text>
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
          <Text style={{ fontSize: 11, lineHeight: 17, letterSpacing: 1.1, textTransform: 'uppercase', color: Ramp.neutral[500], transform: [{ translateY: -1 }] }}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.label} label={c.label} icon={c.icon} on={category === c.label} onPress={() => setCategory(c.label)} radius={18} paddingH={12} />
            ))}
          </View>
        </View>

        <View style={{ rowGap: 6 }} onLayout={measure('title')}>
          <Label>Title</Label>
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Morning park walk"
            error={titleErr}
            maxLength={80}
            returnKeyType="next"
            onSubmitEditing={() => pointRef.current?.focus()}
            onFocus={onFocusField('title')}
            onBlur={onBlurField('title')}
          />
          {titleErr && <Text style={{ fontSize: 12, color: Ramp.accent[300] }}>At least 3 characters.</Text>}
        </View>

        <View style={{ rowGap: 6 }} onLayout={measure('point')}>
          <Label>Meeting point</Label>
          <Input
            inputRef={pointRef}
            value={point}
            onChangeText={setPoint}
            placeholder="Park entrance, landmark or address"
            leftIcon="map-pin"
            maxLength={120}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            onFocus={onFocusField('point')}
            onBlur={onBlurField('point')}
          />
        </View>

        <View style={{ rowGap: 8 }}>
          <Label>Day</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
            {days.map((d, i) => (
              <Chip key={d.label} label={d.label} on={dayIdx === i} onPress={() => setDayIdx(i)} fixed />
            ))}
          </ScrollView>
        </View>

        <View style={{ rowGap: 8 }}>
          <Label>Start time</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} on={time === t} onPress={() => setTime(t)} fixed />
            ))}
          </ScrollView>
        </View>

        <View style={{ rowGap: 8 }}>
          <Label>Duration</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DURATIONS.map((d) => (
              <Chip key={d} label={d} on={duration === d} onPress={() => setDuration(d)} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14 }}>Max people</Text>
            <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>Including you</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderColor: DIV, borderRadius: 8 }}>
            <Pressable
              onPress={() => setMax((m) => Math.max(2, m - 1))}
              accessibilityRole="button"
              accessibilityLabel="Fewer"
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 7, borderBottomLeftRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="minus" size={16} color={Colors.textPrimary} />
            </Pressable>
            <Text style={{ width: 34, textAlign: 'center', fontSize: 15 }}>{max}</Text>
            <Pressable
              onPress={() => setMax((m) => Math.min(30, m + 1))}
              accessibilityRole="button"
              accessibilityLabel="More"
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 7, borderBottomRightRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="plus" size={16} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={{ rowGap: 6 }} onLayout={measure('desc')}>
          <Label>Description</Label>
          <Input
            inputRef={descRef}
            value={desc}
            onChangeText={setDesc}
            placeholder="Route, pace, what to bring"
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
        <Btn label="Create walk" shape="pill" height={52} fontSize={16} onPress={create} disabled={invalid} loading={busy} />
      </View>

      {toast}
    </KeyboardAvoidingView>
  );
};

/** The footer's 1px divider rule, absolutely placed along the top edge. */
const FooterRule: React.FC = () => <Hairline tone="divider" style={{ position: 'absolute', left: 0, right: 0, top: 0 }} />;
