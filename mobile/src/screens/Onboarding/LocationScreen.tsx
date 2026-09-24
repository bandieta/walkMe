import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Animated, Easing, Platform, PermissionsAndroid } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../store';
import { onboardingDraftSet, userUpdated } from '../../store/slices/authSlice';
import { setLocationPermission, setUserLocation } from '../../store/slices/mapSlice';
import { usersApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { StepHeader } from './StepHeader';
import { DEFAULT_AREA, radiusLabel, snapRadius, validTimes } from './rhythm';

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/**
 * Asks the OS for location access. Android has the runtime permission in core; on iOS the prompt comes from a
 * geolocation module, which the app does not ship yet — if one is installed as `navigator.geolocation` it is used.
 * Never throws: onboarding carries on whatever the answer is.
 */
async function requestLocation(dispatch: AppDispatch): Promise<void> {
  try {
    let granted = false;
    if (Platform.OS === 'android') {
      granted = (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const geo = (globalThis as any).navigator?.geolocation;
      if (geo?.requestAuthorization) geo.requestAuthorization();
      granted = !!geo;
    }
    dispatch(setLocationPermission(granted));
    const geo = (globalThis as any).navigator?.geolocation;
    if (granted && geo?.getCurrentPosition) {
      geo.getCurrentPosition(
        (p: { coords: { latitude: number; longitude: number } }) => dispatch(setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude })),
        () => undefined,
        { timeout: 8000, maximumAge: 60000 },
      );
    }
  } catch {
    dispatch(setLocationPermission(false));
  }
}

/** `background-image: linear-gradient(rgba(233,233,237,.045) 1px, transparent 1px)` (and the 90deg twin), 30px cells. */
const Grid: React.FC = () => {
  const fill = 'rgba(233,233,237,0.045)';
  const lines = Array.from({ length: 22 }, (_, i) => i * 30);
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
      {lines.map((p) => (
        <React.Fragment key={p}>
          <Rect x={0} y={p} width="100%" height={1} fill={fill} />
          <Rect x={p} y={0} width={1} height="100%" fill={fill} />
        </React.Fragment>
      ))}
    </Svg>
  );
};

/** The 16px accent dot with the prototype's wmPulse: a ring growing 16px outwards while fading from 50% to 0 (1.8s, ease-out, looping). */
const PulsingDot: React.FC = () => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.bezier(0, 0, 0.58, 1), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', width: 16, height: 16, marginLeft: -8, marginTop: -8 }}>
      <Animated.View
        style={{
          position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }],
        }}
      />
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary }} />
    </View>
  );
};

/**
 * Onboarding step 3 of 3 — explains the location use, then finishes onboarding: the rhythm answers from step 2, the
 * location and `onboarded: true` are saved with one PATCH /users/me, and AppNavigator switches to the main app.
 * "Not now" finishes the same way without asking the OS for access.
 */
export const LocationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { bottom } = useScreenInsets();
  const user = useSelector((s: RootState) => s.auth.user);
  const draft = useSelector((s: RootState) => s.auth.onboardingDraft);
  const [busy, setBusy] = useState<'allow' | 'skip' | null>(null);
  const busyRef = useRef(false);

  const walkTimes = draft?.walkTimes ?? validTimes(user?.walkTimes);
  const radiusKm = draft?.radiusKm ?? snapRadius(user?.radiusKm);
  const label = radiusLabel(radiusKm);

  const onBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Rhythm');
  };

  const finish = async (allow: boolean) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(allow ? 'allow' : 'skip');
    try {
      if (allow) await requestLocation(dispatch);
      const payload = { walkTimes, radiusKm, location: user?.location || DEFAULT_AREA, onboarded: true };
      const res = await usersApi.updateProfile(payload);
      dispatch(userUpdated({ ...payload, ...(res?.data && typeof res.data === 'object' ? res.data : {}) }));
      dispatch(onboardingDraftSet(null));
    } catch {
      busyRef.current = false;
      setBusy(null);
      Alert.alert(t('onboarding.location.couldNotFinishTitle'), t('common.connectionError'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <StepHeader step={3} onBack={onBack} />

      <View style={{ flex: 1, paddingTop: 18, paddingHorizontal: 24, rowGap: 22 }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: '500', lineHeight: 29, letterSpacing: -0.39, marginBottom: 6, transform: [{ translateY: 0.67 }] }}>{t('onboarding.location.title')}</Text>
          <Text style={{ fontSize: 13, lineHeight: 20, color: Ramp.neutral[400] }}>
            {t('onboarding.location.subtitle', { radius: label })}
          </Text>
        </View>

        {/* map preview: box-shadow 0 0 0 1px #3f424d rings the 300px card from outside */}
        <View style={{ height: 300 }}>
          <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 15, borderWidth: 1, borderColor: Ramp.neutral[800] }} />
          <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: '#181a28' }}>
            <Grid />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', left: '50%', top: '50%', width: 230, height: 230, marginLeft: -115, marginTop: -115, borderRadius: 115,
                borderWidth: 1, borderStyle: 'dashed', borderColor: Ramp.accent[700], backgroundColor: 'rgba(145,132,217,0.05)',
              }}
            />
            <PulsingDot />
            <Text style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: MONO, fontSize: 10, fontWeight: '500', lineHeight: 12, color: Ramp.neutral[600] }}>
              {t('onboarding.location.mapPreview', { radius: label })}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: bottom + 4, rowGap: 6 }}>
        <Pressable
          onPress={() => finish(true)}
          disabled={!!busy}
          style={({ pressed }) => ({
            height: 52, borderRadius: 26, borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 8,
            backgroundColor: pressed ? 'rgba(145,132,217,0.12)' : 'transparent', opacity: busy === 'skip' ? 0.45 : 1,
          })}
        >
          <Icon name="navigation-arrow" size={16} color={Colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.primary }}>{t('onboarding.location.allow')}</Text>
        </Pressable>
        <Pressable onPress={() => finish(false)} disabled={!!busy} style={{ height: 44, alignItems: 'center', justifyContent: 'center', opacity: busy === 'allow' ? 0.45 : 1 }}>
          <Text style={{ fontSize: 14, color: Ramp.neutral[400] }}>{t('onboarding.location.notNow')}</Text>
        </Pressable>
      </View>
    </View>
  );
};
