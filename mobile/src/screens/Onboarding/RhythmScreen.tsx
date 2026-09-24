import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, PanResponder } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { onboardingDraftSet, userUpdated } from '../../store/slices/authSlice';
import { usersApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { Btn, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { StepHeader } from './StepHeader';
import { WALK_TIMES, MIN_RADIUS_KM, MAX_RADIUS_KM, snapRadius, radiusLabel, validTimes } from './rhythm';

const TILE_RADIUS = 10;

/** One time-of-day chip: surface card, icon, label and hours; a selected one gets a 1px accent ring and a check badge. */
const TimeTile: React.FC<{ item: (typeof WALK_TIMES)[number]; on: boolean; onPress: () => void }> = ({ item, on, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: on }}
    accessibilityLabel={`${item.label} ${item.range}`}
    style={{ flex: 1, padding: 12, borderRadius: TILE_RADIUS, backgroundColor: Colors.surfaceDark, rowGap: 6, alignItems: 'flex-start' }}
  >
    <Icon name={item.icon} size={20} color={on ? Colors.primary : Ramp.neutral[400]} />
    <Text style={{ fontSize: 14, lineHeight: 21.66 }}>{item.label}</Text>
    <Text style={{ fontSize: 11, lineHeight: 17, color: Ramp.neutral[500] }}>{item.range}</Text>
    {on && (
      <>
        {/* box-shadow: inset 0 0 0 1px accent */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: TILE_RADIUS, borderWidth: 1, borderColor: Colors.primary }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 10, right: 10 }}>
          <Icon name="check-circle" size={16} color={Colors.primary} weight="fill" />
        </View>
      </>
    )}
  </Pressable>
);

/**
 * The prototype's radius slider: a 28px-tall hit area with a 4px rail, an accent fill and a 24px ring thumb.
 * Tap or drag anywhere on it; the value snaps to 0.5 km steps between 0.5 and 5 km.
 */
const RadiusSlider: React.FC<{ value: number; onChange: (km: number) => void; onDragging: (on: boolean) => void }> = ({ value, onChange, onDragging }) => {
  const width = useRef(0);
  const startX = useRef(0);
  const cb = useRef({ onChange, onDragging });
  cb.current = { onChange, onDragging };

  const setFromX = (x: number) => {
    if (!width.current) return;
    const t = Math.min(1, Math.max(0, x / width.current));
    cb.current.onChange(Math.round((MIN_RADIUS_KM + t * (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 2) / 2);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        // The rail, fill and thumb ignore touches, so locationX is measured from the slider's own left edge.
        startX.current = e.nativeEvent.locationX;
        cb.current.onDragging(true);
        setFromX(startX.current);
      },
      onPanResponderMove: (_, g) => setFromX(startX.current + g.dx),
      onPanResponderRelease: () => cb.current.onDragging(false),
      onPanResponderTerminate: () => cb.current.onDragging(false),
    }),
  ).current;

  const pct = Math.round(((value - MIN_RADIUS_KM) / (MAX_RADIUS_KM - MIN_RADIUS_KM)) * 100);
  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => { width.current = e.nativeEvent.layout.width; }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Walking radius"
      accessibilityValue={{ text: radiusLabel(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(snapRadius(value + (e.nativeEvent.actionName === 'increment' ? 0.5 : -0.5)))}
      style={{ height: 28, justifyContent: 'center' }}
    >
      <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: Ramp.neutral[800] }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, borderRadius: 2, backgroundColor: Colors.primary }} />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: `${pct}%`, marginLeft: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.backgroundDark, borderWidth: 2, borderColor: Colors.primary }}
      />
    </View>
  );
};

/**
 * Onboarding step 2 of 3 — when and how far you walk. Also reachable from Profile > Walking rhythm (same screen in
 * the prototype): there Continue saves straight to the profile and goes back instead of moving on to Location.
 */
export const RhythmScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { bottom } = useScreenInsets();
  const user = useSelector((s: RootState) => s.auth.user);
  const draft = useSelector((s: RootState) => s.auth.onboardingDraft);
  const inProfile = !!user?.onboarded;
  const { show, element: toast } = useToast();

  const [times, setTimes] = useState<string[]>(() => validTimes(draft?.walkTimes ?? user?.walkTimes));
  const [radius, setRadius] = useState<number>(() => snapRadius(draft?.radiusKm ?? user?.radiusKm));
  const [scrollLocked, setScrollLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current); }, []);

  const toggle = (key: string) => setTimes((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(inProfile ? 'ProfileHome' : 'DogProfile');
  };

  const onContinue = async () => {
    if (!times.length || saving) return;
    const walkTimes = WALK_TIMES.map((t) => t.key).filter((k) => times.includes(k));
    if (!inProfile) {
      dispatch(onboardingDraftSet({ walkTimes, radiusKm: radius }));
      navigation.navigate('Location');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateProfile({ walkTimes, radiusKm: radius });
      dispatch(userUpdated({ walkTimes, radiusKm: radius }));
      show('Walking rhythm saved');
      // Give the confirmation a moment to be seen (the prototype shows it on the screen it returns to).
      leaveTimer.current = setTimeout(() => { if (navigation.isFocused()) onBack(); }, 700);
    } catch {
      setSaving(false);
      Alert.alert('Could not save your rhythm', 'Please check your connection and try again.');
    }
  };

  const rows = [0, 2, 4].map((i) => WALK_TIMES.slice(i, i + 2));
  const invalid = times.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <StepHeader step={2} onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        scrollEnabled={!scrollLocked}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 24, paddingBottom: 24, rowGap: 20 }}
      >
        <View>
          <Text style={{ fontSize: 26, fontWeight: '500', lineHeight: 29, letterSpacing: -0.39, marginBottom: 6, transform: [{ translateY: 0.67 }] }}>When do you usually walk?</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: Ramp.neutral[400] }}>We'll surface walks and people on your schedule.</Text>
        </View>

        <View style={{ rowGap: 8 }}>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', columnGap: 8 }}>
              {row.map((t) => (
                <TimeTile key={t.key} item={t} on={times.includes(t.key)} onPress={() => toggle(t.key)} />
              ))}
            </View>
          ))}
        </View>

        <View style={{ rowGap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 14, lineHeight: 21.66, transform: [{ translateY: -2 }] }}>How far will you go?</Text>
            <Text style={{ fontSize: 20, lineHeight: 31, fontWeight: '500', color: Ramp.accent[300], transform: [{ translateY: -1 }] }}>{radiusLabel(radius)}</Text>
          </View>
          <RadiusSlider value={radius} onChange={setRadius} onDragging={setScrollLocked} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', transform: [{ translateY: -0.67 }] }}>
            <Text style={{ fontSize: 11, lineHeight: 17, color: Ramp.neutral[500] }}>0.5 km</Text>
            <Text style={{ fontSize: 11, lineHeight: 17, color: Ramp.neutral[500] }}>5 km</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', columnGap: 10, alignItems: 'flex-start', transform: [{ translateY: 1 }] }}>
          <View style={{ marginTop: 1 }}>
            <Icon name="shield-check" size={16} color={Ramp.neutral[400]} />
          </View>
          <Text style={{ flex: 1, fontSize: 12, lineHeight: 17.33, color: Ramp.neutral[400] }}>Others see an approximate area, never your exact location.</Text>
        </View>
      </ScrollView>

      <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: bottom + 4 }}>
        <Btn label="Continue" shape="pill" height={52} fontSize={16} onPress={onContinue} disabled={invalid || saving} />
      </View>
      {toast}
    </View>
  );
};
