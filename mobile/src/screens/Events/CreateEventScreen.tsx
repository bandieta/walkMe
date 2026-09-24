import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Keyboard, Platform, StatusBar, Alert, TextInputProps,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { createEvent } from '../../store/slices/eventsSlice';
import { placesApi } from '../../services/api';
import { Colors, Ramp } from '../../utils/theme';
import { Icon, IconName } from '../../components/Icon';
import { Hairline, Placeholder, useScreenInsets } from '../../ui';

/**
 * "Create event" from the prototype: Cancel / New event header, cover-photo stand-in, type chips, name, location,
 * date + start-time chips, capacity stepper, description, and an anchored "Publish event" pill.
 */
const DIV = 'rgba(233,233,237,0.16)';
const ACCENT_TINT = 'rgba(145,132,217,0.12)';
const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const CATEGORIES: { label: string; icon: IconName; emoji: string }[] = [
  { label: 'Meetup', icon: 'users-three', emoji: '🎉' },
  { label: 'Playdate', icon: 'dog', emoji: '🐕' },
  { label: 'Competition', icon: 'trophy', emoji: '🏆' },
  { label: 'Wellness', icon: 'flower-lotus', emoji: '🧘' },
  { label: 'Walk', icon: 'moon-stars', emoji: '🌙' },
];
const TIMES = ['10:00', '12:00', '16:00', '19:00'];
const DEFAULT_TIME = '11:00';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Warsaw centre: used when the typed location is not one of the known places (no geocoder yet).
const FALLBACK_COORDS = { lat: 52.2297, lng: 21.0122 };

/** The next four weekend days ("Sat 27", "Sun 28", "Sat 4 Oct", "Sun 5 Oct"); the month shows only when it is not the current one. */
function weekendOptions(now: Date) {
  const out: { key: string; label: string; date: Date }[] = [];
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (out.length < 4) {
    if (d.getDay() === 6 || d.getDay() === 0) {
      const date = new Date(d);
      const month = date.getMonth() !== now.getMonth() ? ` ${MONTHS[date.getMonth()]}` : '';
      out.push({ key: date.toDateString(), label: `${WEEKDAYS[date.getDay()]} ${date.getDate()}${month}`, date });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const Chip: React.FC<{
  label: string; on: boolean; onPress: () => void; icon?: IconName; radius: number; paddingHorizontal: number;
}> = ({ label, on, onPress, icon, radius, paddingHorizontal }) => {
  const fg = on ? Colors.primary : Ramp.neutral[300];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        height: 36, paddingHorizontal, borderRadius: radius, borderWidth: 1, borderColor: on ? Colors.primary : DIV,
        backgroundColor: on ? ACCENT_TINT : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 6,
      }}
    >
      {icon && <Icon name={icon} size={13} color={fg} />}
      <Text style={{ fontSize: 13, color: fg }}>{label}</Text>
    </Pressable>
  );
};

const Label: React.FC<{ children: string }> = ({ children }) => (
  <Text style={{ fontSize: 12, color: Ramp.neutral[400], transform: [{ translateY: -1 }] }}>{children}</Text>
);

/** 46px (or multi-line) surface box with an accent border while focused. */
const Box: React.FC<TextInputProps & { left?: number; multiline?: boolean }> = ({ left = 12, multiline, style, onFocus, onBlur, ...rest }) => {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      placeholderTextColor={Ramp.neutral[600]}
      selectionColor={Colors.primary}
      cursorColor={Colors.primary}
      style={[
        {
          borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1, borderColor: focused ? Colors.primary : DIV,
          color: Colors.textPrimary, paddingLeft: left, paddingRight: 12,
        },
        multiline
          ? { minHeight: 90, paddingTop: 10, paddingBottom: 10, fontSize: 14, textAlignVertical: 'top' }
          : { height: 46, paddingTop: 0, paddingBottom: 5.5, fontSize: 15 },
        style,
      ]}
    />
  );
};

export const CreateEventScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { top, bottom } = useScreenInsets();
  const days = useMemo(() => weekendOptions(new Date()), []);

  const [cat, setCat] = useState(CATEGORIES[0].label);
  const [title, setTitle] = useState('');
  const [point, setPoint] = useState('');
  const [dayKey, setDayKey] = useState(days[0].key);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [max, setMax] = useState(20);
  const [desc, setDesc] = useState('');
  const [photo, setPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [places, setPlaces] = useState<{ name: string; lat: number; lng: number }[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Known places give the event real coordinates when the typed location names one of them.
  useEffect(() => {
    let alive = true;
    placesApi.list().then((res) => { if (alive && Array.isArray(res.data)) setPlaces(res.data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const invalid = title.trim().length < 3 || point.trim().length < 3;

  const trackY = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => { fieldY.current[key] = e.nativeEvent.layout.y; };
  // The keyboard shrinks the scroll area (KeyboardAvoidingView); bring the focused field to its top.
  const reveal = (key: string) => () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, (fieldY.current[key] ?? 0) - 12), animated: true }), 160);
  };

  const resolveCoords = (text: string) => {
    const q = text.trim().toLowerCase();
    const hit = places.find((p) => {
      const n = p.name.toLowerCase();
      return q.includes(n) || n.includes(q);
    });
    return hit ? { lat: hit.lat, lng: hit.lng } : FALLBACK_COORDS;
  };

  const publish = async () => {
    if (invalid || saving) return;
    const day = days.find((d) => d.key === dayKey) ?? days[0];
    const [hh, mm] = time.split(':').map(Number);
    const when = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), hh, mm);
    if (when.getTime() <= Date.now()) {
      Alert.alert('Pick a later time', 'That start time has already passed. Choose another day or time.');
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    const res = await dispatch(createEvent({
      title: title.trim(),
      ...(desc.trim() ? { description: desc.trim() } : {}),
      location: point.trim(),
      ...resolveCoords(point),
      date: when.toISOString(),
      maxParticipants: max,
      category: cat,
      emoji: CATEGORIES.find((c) => c.label === cat)?.emoji,
      photoCaption: photo ? 'your cover photo' : 'add a cover photo',
    }));
    setSaving(false);
    if (createEvent.fulfilled.match(res)) {
      navigation.replace('EventDetail', { eventId: res.payload.id });
    } else {
      Alert.alert('Could not publish the event', typeof res.payload === 'string' ? res.payload : 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.backgroundDark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Header: padding 52 12 8, Cancel (44px tap target, neutral-400) / title 17 / 66px spacer. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: top - 4, paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Cancel" style={{ height: 44, paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: Ramp.neutral[400] }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500' }}>New event</Text>
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
        {/* Cover photo stand-in (tap toggles the "added" state). */}
        <Pressable onPress={() => setPhoto((p) => !p)} accessibilityRole="button" style={{ height: 130 }}>
          <Placeholder colors={['#1c1e2c', '#212332']} stripe={10} radius={12} style={{ height: 130 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', rowGap: 6 }}>
              <View style={{ transform: [{ translateY: 3.4 }] }}>
                <Icon name={photo ? 'check' : 'image'} size={22} color={Ramp.neutral[400]} />
              </View>
              <Text style={{ fontFamily: MONO, fontWeight: '500', fontSize: 10, lineHeight: 15.5, color: Ramp.neutral[400], transform: [{ translateY: 0.5 }] }}>
                {photo ? 'cover photo added — tap to remove' : 'add a cover photo'}
              </Text>
            </View>
          </Placeholder>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, borderWidth: 1, borderColor: photo ? Colors.primary : 'transparent' }} />
        </Pressable>

        {/* Type */}
        <View style={{ rowGap: 8 }}>
          <Text style={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: Ramp.neutral[500], transform: [{ translateY: -0.8 }] }}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.label} label={c.label} icon={c.icon} on={cat === c.label} onPress={() => setCat(c.label)} radius={18} paddingHorizontal={12} />
            ))}
          </View>
        </View>

        {/* Event name */}
        <View style={{ rowGap: 6 }} onLayout={trackY('title')}>
          <Label>Event name</Label>
          <Box value={title} onChangeText={setTitle} onFocus={reveal('title')} placeholder="Saturday puppy social" autoCapitalize="sentences" returnKeyType="next" maxLength={120} />
        </View>

        {/* Location */}
        <View style={{ rowGap: 6 }} onLayout={trackY('point')}>
          <Label>Location</Label>
          <View>
            <Box value={point} onChangeText={setPoint} onFocus={reveal('point')} placeholder="Park, café or address" left={36} autoCapitalize="words" returnKeyType="done" maxLength={200} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 13.5 }}>
              <Icon name="map-pin" size={17} color={Ramp.neutral[500]} />
            </View>
          </View>
        </View>

        {/* Date */}
        <View style={{ rowGap: 8 }}>
          <Label>Date</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ columnGap: 6 }}>
            {days.map((d) => (
              <Chip key={d.key} label={d.label} on={dayKey === d.key} onPress={() => setDayKey(d.key)} radius={8} paddingHorizontal={13} />
            ))}
          </ScrollView>
        </View>

        {/* Start time */}
        <View style={{ rowGap: 8 }}>
          <Label>Start time</Label>
          <View style={{ flexDirection: 'row', columnGap: 6 }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} on={time === t} onPress={() => setTime(t)} radius={8} paddingHorizontal={13} />
            ))}
          </View>
        </View>

        {/* Capacity */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14 }}>Capacity</Text>
            <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>Dogs and owners</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1, borderColor: DIV, borderRadius: 8 }}>
            <Pressable
              onPress={() => setMax((m) => Math.max(2, m - 5))}
              accessibilityLabel="Fewer"
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 7, borderBottomLeftRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="minus" size={16} color={Colors.textPrimary} />
            </Pressable>
            <Text style={{ width: 34, textAlign: 'center', fontSize: 15 }}>{max}</Text>
            <Pressable
              onPress={() => setMax((m) => Math.min(200, m + 5))}
              accessibilityLabel="More"
              style={({ pressed }) => ({ width: 44, height: 42, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 7, borderBottomRightRadius: 7, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
            >
              <Icon name="plus" size={16} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Description */}
        <View style={{ rowGap: 6 }} onLayout={trackY('desc')}>
          <Label>Description</Label>
          <Box value={desc} onChangeText={setDesc} onFocus={reveal('desc')} placeholder="What happens, who it's for, what to bring" multiline maxLength={1000} />
        </View>
      </ScrollView>

      {/* Footer: padding 12 20 36 with the fading divider along its top edge. */}
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: keyboardUp ? 12 : bottom + 2 }}>
        <Hairline tone="divider" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        <Pressable
          onPress={publish}
          disabled={invalid || saving}
          accessibilityRole="button"
          accessibilityLabel="Publish event"
          style={({ pressed }) => ({
            height: 52, borderRadius: 26, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? ACCENT_TINT : 'transparent', opacity: invalid || saving ? 0.45 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.primary }}>{saving ? 'Publishing…' : 'Publish event'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};
