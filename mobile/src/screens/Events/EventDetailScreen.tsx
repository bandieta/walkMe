import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, Platform, ActivityIndicator, StatusBar, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchEventById, joinEvent, leaveEvent } from '../../store/slices/eventsSlice';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { Toast } from '../../components/Toast';
import { Hairline, Placeholder, Btn, useScreenInsets } from '../../ui';
import { whenLong } from '../Map/mapFormat';
import { resolveMediaUrl } from '../../utils/media';

const DIVIDER = 'rgba(233,233,237,0.16)';
const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
/** The prototype's 1.55 line-height snapped to the device pixel grid (RN rounds text boxes up, CSS does not). */
const lh = (fs: number) => Math.round(fs * 1.55 * 3) / 3;

/** The prototype's `.tag` (11px, padding 3/9, radius 6). Local so its 17px line box is exact (the shared Tag lets RN round it up). */
const Chip: React.FC<{ label: string; accent?: boolean }> = ({ label, accent }) => (
  <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 6, backgroundColor: accent ? Ramp.accent[800] : Ramp.neutral[800] }}>
    <Text style={{ fontSize: 11, lineHeight: 17, color: accent ? Ramp.accent[100] : Ramp.neutral[100], transform: [{ translateY: -1 }] }}>{label}</Text>
  </View>
);

/** Photo stand-in: 260px striped block, mono caption at (20, 130), 90px fade into the ground. */
const PhotoHeader: React.FC<{ caption?: string; photoUrl?: string; width: number }> = ({ caption, photoUrl, width }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const uri = resolveMediaUrl(photoUrl);
  const showImage = !!uri && !imgFailed;
  return (
    <Placeholder colors={['#1c1e2c', '#212332']} stripe={10} style={{ height: 260 }}>
      {showImage ? (
        <Image source={{ uri }} style={{ position: 'absolute', top: 0, left: 0, width, height: 260 }} resizeMode="cover" onError={() => setImgFailed(true)} />
      ) : (
        <Text style={{ position: 'absolute', left: 20, top: 128, fontFamily: MONO, fontSize: 10, fontWeight: '400', lineHeight: 15.5, color: Ramp.neutral[500] }}>
          {caption ? `event photo — ${caption}` : 'event photo'}
        </Text>
      )}
      <Svg width={width} height={90} style={{ position: 'absolute', left: 0, bottom: 0 }} pointerEvents="none">
        <Defs>
          <LinearGradient id="evFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.backgroundDark} stopOpacity={0} />
            <Stop offset="1" stopColor={Colors.backgroundDark} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={90} fill="url(#evFade)" />
      </Svg>
    </Placeholder>
  );
};

/** 44px round surface button floating over the photo (its 1px #3f424d ring sits just outside). */
const BackButton: React.FC<{ top: number; onPress: () => void }> = ({ top, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Back"
    onPress={onPress}
    style={{ position: 'absolute', top: top - 4, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center' }}
  >
    <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: Ramp.neutral[800] }} />
    <Icon name={Platform.OS === 'ios' ? 'caret-left' : 'arrow-left'} size={19} color={Colors.textPrimary} />
  </Pressable>
);

export const EventDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { eventId } = route.params as { eventId: string };
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();
  const { top, bottom } = useScreenInsets();
  const event = useSelector((s: RootState) => s.events.events.find((e) => e.id === eventId));
  const user = useSelector((s: RootState) => s.auth.user);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState<{ text: string; n: number } | null>(null);

  useEffect(() => {
    setFailed(false);
    dispatch(fetchEventById(eventId)).unwrap().catch(() => setFailed(true));
  }, [eventId, dispatch]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const view = useMemo(() => {
    if (!event) return null;
    const ended = event.status === 'ended';
    const live = event.status === 'live';
    const left = Math.max(0, event.maxParticipants - event.participantCount);
    const full = left === 0;
    const isOrganiser = event.organizerId === user?.id || event.organizer?.id === user?.id;
    return {
      ended, live, full,
      statusLabel: live ? 'Happening now' : ended ? 'Ended' : 'Upcoming',
      canJoin: !ended && !event.isJoined && !full,
      joined: !ended && event.isJoined,
      blocked: ended || (!event.isJoined && full),
      blockedLabel: ended ? 'This event has ended' : 'This event is full',
      when: whenLong(event.date),
      organiser: isOrganiser ? 'you' : event.organizer?.displayName ?? '',
      left,
      pct: Math.min(100, Math.round((event.participantCount / (event.maxParticipants || 1)) * 100)),
    };
  }, [event, user]);

  const toggle = async () => {
    if (!event || busy) return;
    const joining = !event.isJoined;
    setBusy(true);
    try {
      await (joining ? dispatch(joinEvent(eventId)) : dispatch(leaveEvent(eventId))).unwrap();
      setToast({ text: joining ? `You’re going to ${event.title}` : 'RSVP cancelled', n: Date.now() });
    } catch (e: any) {
      Alert.alert('Something went wrong', typeof e === 'string' ? e : e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!event || !view) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.backgroundDark, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        {failed ? (
          <View style={{ alignItems: 'center', rowGap: 14 }}>
            <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[400] }}>We couldn’t load this event.</Text>
            <Btn label="Try again" variant="neutral" onPress={() => { setFailed(false); dispatch(fetchEventById(eventId)).unwrap().catch(() => setFailed(true)); }} />
          </View>
        ) : (
          <ActivityIndicator color={Colors.primary} />
        )}
        <BackButton top={top} onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
        <View>
          <PhotoHeader caption={event.photoCaption} photoUrl={event.photoUrl} width={width} />
          <BackButton top={top} onPress={goBack} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 24, rowGap: 18 }}>
          {/* status + category, title */}
          <View style={{ rowGap: 8 }}>
            <View style={{ flexDirection: 'row', columnGap: 6 }}>
              <Chip label={view.statusLabel} accent={view.live} />
              <Chip label={event.category ?? 'Meetup'} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: '500', lineHeight: 29, letterSpacing: -0.39, transform: [{ translateY: 0.67 }] }}>{event.title}</Text>
          </View>

          {/* when / where / who */}
          <View style={{ rowGap: 9, transform: [{ translateY: 0.33 }] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <Icon name="calendar-blank" size={17} color={Ramp.neutral[400]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>{view.when}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <Icon name="map-pin" size={17} color={Ramp.neutral[400]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14), flexShrink: 1 }}>{event.location}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              <Icon name="user" size={17} color={Ramp.neutral[400]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>Organised by</Text>
              <Text style={{ fontSize: 14, lineHeight: lh(14), flexShrink: 1 }} numberOfLines={1}>{view.organiser}</Text>
            </View>
          </View>

          {/* going */}
          <View style={{ rowGap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', transform: [{ translateY: -0.67 }] }}>
              <Text style={{ fontSize: 15, lineHeight: lh(15), fontWeight: '500' }}>{event.participantCount} going</Text>
              <Text style={{ fontSize: 13, lineHeight: lh(13), color: Ramp.neutral[400] }}>{view.left} spots left</Text>
            </View>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: Ramp.neutral[900] }}>
              <View style={{ width: `${view.pct}%`, height: 3, borderRadius: 2, backgroundColor: Colors.primary }} />
            </View>
          </View>

          {/* about */}
          {!!event.description && (
            <View style={{ rowGap: 6 }}>
              <Text style={{ fontSize: 15, lineHeight: lh(15), fontWeight: '500', transform: [{ translateY: -1 }] }}>About</Text>
              <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[300] }}>{event.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* action bar: 12/20/36 padding, divider hairline along the top edge */}
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: bottom + 2, flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
        <Hairline tone="divider" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
        {view.canJoin && <Btn label="Join event" shape="pill" onPress={toggle} loading={busy} style={{ flex: 1 }} />}
        {view.joined && (
          <>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
              <Icon name="check-circle" weight="fill" size={18} color={Ramp.accent[300]} />
              <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.accent[300] }}>You're going</Text>
            </View>
            <Pressable
              onPress={toggle}
              disabled={busy}
              style={({ pressed }) => ({
                height: 50, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: DIVIDER, alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(233,233,237,0.14)' : 'transparent', opacity: busy ? 0.45 : 1,
              })}
            >
              <Text style={{ fontSize: 14, lineHeight: lh(14) }}>Can't make it</Text>
            </Pressable>
          </>
        )}
        {view.blocked && (
          <View style={{ flex: 1, height: 50, borderRadius: 25, borderWidth: 1, borderColor: DIVIDER, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, lineHeight: lh(14), color: Ramp.neutral[400] }}>{view.blockedLabel}</Text>
          </View>
        )}
      </View>

      <Toast visible={!!toast} message={toast?.text ?? ''} onHide={() => setToast(null)} />
    </View>
  );
};
