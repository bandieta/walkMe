import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Share,
  Alert,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { AppDispatch, RootState } from '../../store';
import { fetchWalkById, joinWalk, leaveWalk, updateWalkStatus } from '../../store/slices/walksSlice';
import { Icon, IconName } from '../../components/Icon';
import { Hairline, Tag, Btn, PrettyText, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { resolveMediaUrl } from '../../utils/media';
import { walkCategoryLabel } from '../../utils/categoryLabels';

const DIVIDER = 'rgba(233,233,237,0.16)';
// Same reference point the map uses for "x km away" until real device location is wired in.
const FALLBACK_CENTER = { latitude: 52.2297, longitude: 21.0122 };

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n: number) => String(n).padStart(2, '0');
/** The prototype's 1.55 line-height snapped to the device pixel grid (RN rounds text boxes up, CSS does not). */
const lh = (fs: number) => Math.round(fs * 1.55 * 3) / 3;

/** "Today · 11:45" / "Thu 25 Sep · 09:00" — the prototype's `whenLong`. */
function whenLong(t: TFunction, iso: string) {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const day = d.toDateString() === new Date().toDateString()
    ? t('common.today')
    : `${t(`common.weekdaysShort.${WEEKDAY_KEYS[d.getDay()]}`)} ${d.getDate()} ${t(`common.monthsShort.${MONTH_KEYS[d.getMonth()]}`)}`;
  return `${day} · ${time}`;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const initials = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
const firstName = (name?: string) => (name ?? '').split(' ')[0];

// Category -> icon, as in the prototype (unknown categories fall back to a path).
const CATEGORY_ICON: Record<string, IconName> = {
  Park: 'tree', Trail: 'tree-evergreen', Lake: 'waves', Beach: 'umbrella-simple', 'Café': 'coffee', City: 'buildings',
  Meetup: 'users-three', Playdate: 'dog', Competition: 'trophy', Wellness: 'flower-lotus', Walk: 'moon-stars',
};

/** Round initials chip (or the person's photo when they have one). */
const Bubble: React.FC<{ name?: string; uri?: string | null; size: number; fontSize: number; bg: string; fg: string }> = ({ name, uri, size, fontSize, bg, fg }) => {
  const [failed, setFailed] = useState(false);
  const source = resolveMediaUrl(uri);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {source && !failed ? (
        <Image source={{ uri: source }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontSize, lineHeight: lh(fontSize), fontWeight: '500', color: fg }}>{initials(name)}</Text>
      )}
    </View>
  );
};

/** The 44px round surface buttons floating over the map (a 1px #3f424d ring sits just outside them). */
const RoundBtn: React.FC<{ icon: IconName; label: string; onPress: () => void; style: object }> = ({ icon, label, onPress, style }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[{ position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center' }, style]}>
    <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: Ramp.neutral[800] }} />
    <Icon name={icon} size={19} color={Colors.textPrimary} />
  </Pressable>
);

/** Stylised map card: a 30px grid, the meeting-point pin with its halo, a mono caption and a fade into the ground. */
const MapCard: React.FC<{ icon: IconName; width: number }> = ({ icon, width }) => {
  const H = 250;
  const cols = Math.ceil(width / 30);
  const rows = Math.ceil(H / 30);
  return (
    <View style={{ height: H, backgroundColor: '#181a28' }}>
      <Svg width={width} height={H} style={{ position: 'absolute' }}>
        {Array.from({ length: rows }, (_, i) => <Rect key={`h${i}`} x={0} y={i * 30} width={width} height={1} fill="#e9e9ed" fillOpacity={0.045} />)}
        {Array.from({ length: cols }, (_, i) => <Rect key={`v${i}`} x={i * 30} y={0} width={1} height={H} fill="#e9e9ed" fillOpacity={0.045} />)}
      </Svg>
      {/* pin: 48px disc, 1.5px accent ring, 8px translucent halo */}
      <View style={{ position: 'absolute', left: width / 2 - 32, top: H * 0.58 - 32, width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(145,132,217,0.14)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceDark, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={21} color={Colors.primary} />
        </View>
      </View>
      <Text style={{ position: 'absolute', left: 14, bottom: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 10, fontWeight: '500', color: Ramp.neutral[600] }}>
        map — meeting point
      </Text>
      <Svg width={width} height={60} style={{ position: 'absolute', left: 0, bottom: 0 }} pointerEvents="none">
        <Defs>
          <LinearGradient id="mapFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.backgroundDark} stopOpacity={0} />
            <Stop offset="1" stopColor={Colors.backgroundDark} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={60} fill="url(#mapFade)" />
      </Svg>
    </View>
  );
};

/** The prototype's toast (see 18-overlays): 12px radius surface, a 1px #595d6c ring and a soft drop shadow. */
const Toast: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute', left: 16, right: 16, top: top - 2, zIndex: 30, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
      backgroundColor: Colors.surfaceDark, flexDirection: 'row', alignItems: 'center', columnGap: 10,
      shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 9, shadowOffset: { width: 0, height: 6 },
    }}
  >
    <View style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 13, borderWidth: 1, borderColor: Ramp.neutral[700] }} />
    <Icon name="check-circle" weight="fill" size={18} color={Colors.primary} />
    <Text style={{ fontSize: 14, lineHeight: lh(14), flex: 1 }}>{text}</Text>
  </View>
);

export const WalkDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { walkId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();
  const { top, bottom } = useScreenInsets();
  const currentWalk = useSelector((s: RootState) => s.walks.currentWalk) as any;
  const user = useSelector((s: RootState) => s.auth.user);
  const userLocation = useSelector((s: RootState) => s.map.userLocation);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2300);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    setFailed(false);
    dispatch(fetchWalkById(walkId)).unwrap().catch(() => setFailed(true));
  }, [walkId, dispatch]);

  // The store keeps one "current" walk; never show a previously opened one while this one loads.
  const walk = currentWalk?.id === walkId ? currentWalk : null;

  const view = useMemo(() => {
    if (!walk) return null;
    const participants: any[] = walk.participants ?? [];
    const isHost = walk.host?.id === user?.id;
    const joined = participants.some((p) => p.id === user?.id);
    const ended = walk.status === 'ended';
    const live = walk.status === 'live';
    const full = participants.length >= walk.maxParticipants;
    const hostDog = walk.host?.dogs?.[0];
    const from = userLocation ?? FALLBACK_CENTER;
    const dist = distanceKm(from.latitude, from.longitude, Number(walk.meetingLat), Number(walk.meetingLng));
    // host first, everyone else in the order the API lists them
    const ordered = [...participants].sort((a, b) => Number(b.id === walk.host?.id) - Number(a.id === walk.host?.id));
    return {
      isHost, joined, ended, live, full,
      canJoin: !ended && !joined && !full,
      inside: !ended && joined,
      blocked: ended || (!joined && full),
      blockedLabel: ended ? t('walks.detail.blockedEnded') : t('walks.detail.blockedFull'),
      statusLabel: live ? t('walks.detail.statusLive') : ended ? t('walks.detail.statusEnded') : t('walks.detail.statusUpcoming'),
      icon: CATEGORY_ICON[walk.category ?? ''] ?? ('path' as IconName),
      when: whenLong(t, walk.scheduledAt),
      dur: walk.duration,
      point: walk.meetingPoint,
      dist: t('walks.detail.distAway', { dist: dist.toFixed(1) }),
      hostName: isHost ? null : walk.host?.displayName,
      hostIni: initials(isHost ? user?.displayName : walk.host?.displayName),
      hostDog: hostDog ? `${hostDog.name} · ${hostDog.breed}` : '',
      hostNote: hostDog?.bio ?? '',
      people: ordered.map((p) => ({
        id: p.id, name: p.displayName, photoUrl: p.photoUrl,
        me: p.id === user?.id,
        dog: p.id === user?.id ? 'You' : p.dogs?.[0]?.name ?? firstName(p.displayName),
      })),
      pct: Math.round((participants.length / (walk.maxParticipants || 1)) * 100),
    };
  }, [walk, user, userLocation, t]);

  const shareLink = useCallback(() => {
    if (!walk) return;
    Share.share({ message: t('walks.detail.shareMessage', { title: walk.title, link: `https://dogpals.app/walk/${walk.id}` }) }).catch(() => undefined);
  }, [walk, t]);

  const run = async (action: () => Promise<unknown>, okText?: string) => {
    setBusy(true);
    try {
      await action();
      if (okText) showToast(okText);
    } catch (e: any) {
      Alert.alert(t('walks.detail.errorTitle'), e?.message ?? t('walks.detail.errorMessage'));
    } finally {
      setBusy(false);
    }
  };
  const join = () => run(() => dispatch(joinWalk(walkId)).unwrap(), t('walks.detail.joinedToast'));
  const leave = () => run(() => dispatch(leaveWalk(walkId)).unwrap(), t('walks.detail.leftToast'));
  const openChat = () => navigation.navigate('WalkChat', { walkId, walkTitle: walk?.title });
  const setStatus = (status: 'live' | 'ended') => run(() => dispatch(updateWalkStatus({ id: walkId, status })).unwrap());
  const confirmEnd = () =>
    Alert.alert(t('walks.detail.endWalkTitle'), t('walks.detail.endWalkMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('walks.detail.endWalk'), style: 'destructive', onPress: () => setStatus('ended') },
    ]);

  const backBtn = (
    <RoundBtn icon={Platform.OS === 'ios' ? 'caret-left' : 'arrow-left'} label={t('walks.detail.back')} onPress={() => navigation.goBack()} style={{ top: top - 4, left: 14 }} />
  );

  if (!walk || !view) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.backgroundDark, alignItems: 'center', justifyContent: 'center' }}>
        {failed ? (
          <View style={{ alignItems: 'center', rowGap: 14 }}>
            <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[400] }}>{t('walks.detail.loadFailed')}</Text>
            <Btn label={t('walks.detail.tryAgain')} variant="neutral" onPress={() => { setFailed(false); dispatch(fetchWalkById(walkId)).unwrap().catch(() => setFailed(true)); }} />
          </View>
        ) : (
          <ActivityIndicator color={Colors.primary} />
        )}
        {backBtn}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        <View>
          <MapCard icon={view.icon} width={width} />
          {backBtn}
          <RoundBtn icon="export" label={t('walks.detail.share')} onPress={shareLink} style={{ top: top - 4, right: 14 }} />
        </View>

        <View style={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 24, rowGap: 18 }}>
          {/* status + category, title */}
          <View style={{ rowGap: 8 }}>
            <View style={{ flexDirection: 'row', columnGap: 6 }}>
              <Tag label={view.statusLabel} tone={view.live ? 'accent' : 'neutral'} />
              <Tag label={walk.category ? walkCategoryLabel(t, walk.category) : t('walks.detail.walkFallbackCategory')} tone="neutral" />
            </View>
            <PrettyText style={{ fontSize: 26, fontWeight: '500', lineHeight: 29, letterSpacing: -0.39 }}>{walk.title}</PrettyText>
          </View>

          {/* when / where */}
          <View style={{ rowGap: 9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <Icon name="clock" size={17} color={Ramp.neutral[400]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>{view.when}</Text>
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>·</Text>
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>{view.dur}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <Icon name="map-pin" size={17} color={Ramp.neutral[400]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14), flex: 1 }}>{view.point}</Text>
              <Text style={{ fontSize: 12, lineHeight: lh(12), color: Ramp.neutral[500] }}>{view.dist}</Text>
            </View>
          </View>

          {/* host */}
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.surfaceDark }}>
            <Bubble name={view.isHost ? user?.displayName : walk.host?.displayName} uri={view.isHost ? user?.photoUrl : walk.host?.photoUrl} size={40} fontSize={13} bg={Ramp.accent[800]} fg={Ramp.accent[200]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, lineHeight: lh(14) }} numberOfLines={1}>
                {view.hostName ? t('walks.detail.hostedBy', { name: view.hostName }) : t('walks.detail.hostedByYou')}
              </Text>
              {!!view.hostDog && <Text style={{ fontSize: 12, lineHeight: lh(12), color: Ramp.neutral[500] }} numberOfLines={1}>{view.hostDog}</Text>}
              {!!view.hostNote && (
                <PrettyText
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    lineHeight: lh(12),
                    color: Ramp.neutral[300],
                  }}
                >
                  {view.hostNote}
                </PrettyText>
              )}
            </View>
          </View>

          {/* going */}
          <View style={{ rowGap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 15, lineHeight: lh(15), fontWeight: '500' }}>{t('walks.detail.going')}</Text>
              <Text style={{ fontSize: 13, lineHeight: lh(13), color: Ramp.neutral[400] }}>{t('walks.detail.goingCount', { count: view.people.length, max: walk.maxParticipants })}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 10 }}>
              {view.people.map((p) => (
                <View key={p.id} style={{ width: 52, alignItems: 'center', rowGap: 4 }}>
                  <Bubble
                    name={p.name} uri={p.photoUrl} size={40} fontSize={12}
                    bg={p.me ? Ramp.accent[800] : Ramp.neutral[800]} fg={p.me ? Ramp.accent[200] : Ramp.neutral[100]}
                  />
                  <Text style={{ fontSize: 11, lineHeight: lh(11), color: Ramp.neutral[400], maxWidth: 52 }} numberOfLines={1}>{p.dog}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: Ramp.neutral[900] }}>
              <View style={{ width: `${Math.min(view.pct, 100)}%`, height: 3, borderRadius: 2, backgroundColor: Colors.primary }} />
            </View>
          </View>

          {/* about */}
          {!!walk.description && (
            <View style={{ rowGap: 6 }}>
              <Text style={{ fontSize: 15, lineHeight: lh(15), fontWeight: '500' }}>{t('walks.detail.about')}</Text>
              <PrettyText style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[300] }}>{walk.description}</PrettyText>
            </View>
          )}

          {/* host controls (not part of the prototype's markup: it has no way to start or end a walk) */}
          {view.isHost && !view.ended && (
            <Btn
              label={view.live ? t('walks.detail.endWalk') : t('walks.detail.startWalk')}
              variant={view.live ? 'neutral' : 'accent'}
              loading={busy}
              onPress={() => (view.live ? confirmEnd() : setStatus('live'))}
            />
          )}
        </View>
      </ScrollView>

      {/* action bar */}
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: bottom + 2, flexDirection: 'row', columnGap: 10 }}>
        <Hairline tone="divider" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        {view.canJoin && (
          <Btn label={t('walks.detail.joinWalk')} shape="pill" onPress={join} loading={busy} style={{ flex: 1 }} />
        )}
        {view.inside && (
          <>
            <Pressable
              onPress={openChat}
              style={({ pressed }) => ({
                flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', columnGap: 8, backgroundColor: pressed ? 'rgba(145,132,217,0.22)' : 'transparent',
              })}
            >
              <Icon name="chats-circle" size={15} color={Colors.primary} />
              <Text style={{ fontSize: 15, lineHeight: lh(15), fontWeight: '500', color: Colors.primary }}>{t('walks.detail.groupChat')}</Text>
            </Pressable>
            <Pressable
              onPress={view.isHost ? shareLink : leave}
              disabled={busy}
              style={({ pressed }) => ({
                height: 50, paddingHorizontal: 22, borderRadius: 25, borderWidth: 1, borderColor: DIVIDER, alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(233,233,237,0.14)' : 'transparent', opacity: busy ? 0.45 : 1,
              })}
            >
              <Text style={{ fontSize: 15, lineHeight: lh(15) }}>{view.isHost ? t('walks.detail.invite') : t('walks.detail.leave')}</Text>
            </Pressable>
          </>
        )}
        {view.blocked && (
          <View style={{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: DIVIDER, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[400] }}>{view.blockedLabel}</Text>
          </View>
        )}
      </View>

      {toast && <Toast text={toast} top={top} />}
    </View>
  );
};
