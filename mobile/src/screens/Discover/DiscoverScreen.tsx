import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Easing,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import {
  fetchSwipeDeck,
  resetSwipes,
  swipeLeft,
  swipeRight,
  likeShelterDog,
  removeFromDeck,
  clearLatestMatch,
  DeckCard,
  DeckFilters,
} from '../../store/slices/matchesSlice';
import { fetchMyDogs } from '../../store/slices/dogsSlice';
import { Icon } from '../../components/Icon';
import { Btn, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import { BackCard, DogCard, CARD_HEIGHT } from './DogCard';
import { MatchModal } from './MatchModal';
import { SavedToast } from './SavedToast';
import { DiscoverFiltersSheet } from './DiscoverFiltersSheet';

const DIVIDER = 'rgba(233,233,237,0.16)';
const PRESSED = 'rgba(233,233,237,0.07)';
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Drag distance (pt) after which a release throws the card away. */
const THROW_AT = 100;

export const DiscoverScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const { swipeDeck, swipeLoading, latestMatch, deckFilters } = useSelector(
    (s: RootState) => s.matches,
  );
  const me = useSelector((s: RootState) => s.auth.user);
  const myDogs = useSelector((s: RootState) => s.dogs.dogs) as any[];

  // Cards whose swipe is on its way to the server: hidden at once so the next card shows without waiting.
  const [pending, setPending] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deck = useMemo(
    () =>
      (swipeDeck as DeckCard[]).filter(
        (c) => (c.kind === 'person' ? (c.dogs?.length ?? 0) > 0 : true) && !pending.includes(c.id),
      ),
    [swipeDeck, pending],
  );
  const current = deck[0];
  const next = deck[1];

  // Read via a ref so refocusing always sends whatever filters are currently applied without re-running this
  // effect (and re-fetching) on every filter change — applying a filter already triggers its own fetch.
  const deckFiltersRef = useRef(deckFilters);
  deckFiltersRef.current = deckFilters;
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchSwipeDeck(deckFiltersRef.current));
    }, [dispatch]),
  );
  useEffect(() => {
    dispatch(fetchMyDogs());
  }, [dispatch]);

  const radius = me?.radiusKm ?? 2;
  const radiusLabel = `${Number.isInteger(radius) ? radius : radius.toFixed(1)} km`;

  const applyFilters = (newFilters: DeckFilters) => {
    setFiltersOpen(false);
    dispatch(fetchSwipeDeck(newFilters));
  };

  // ── swipe: drag / buttons share one Animated.ValueXY ──────────────────────────────────────────────
  const position = useRef(new Animated.ValueXY()).current;
  const busy = useRef(false);
  const currentRef = useRef<DeckCard | undefined>(current);
  currentRef.current = current;

  const commit = (dir: 1 | -1, card: DeckCard) => {
    position.setValue({ x: 0, y: 0 });
    if (card.kind === 'shelterDog') {
      if (dir < 0) {
        dispatch(removeFromDeck(card.id));
        return;
      }
      setPending((p) => [...p, card.id]);
      dispatch(likeShelterDog(card.id))
        .unwrap()
        .then(() =>
          setToast(
            t('discover.requestSent', { dog: card.dog.name, shelter: card.shelter.displayName }),
          ),
        )
        .catch(() => undefined)
        .finally(() => setPending((p) => p.filter((id) => id !== card.id)));
      return;
    }
    setPending((p) => [...p, card.id]);
    dispatch(dir > 0 ? swipeRight(card.id) : swipeLeft(card.id)).finally(() =>
      setPending((p) => p.filter((id) => id !== card.id)),
    );
  };
  const fly = (dir: 1 | -1) => {
    const card = currentRef.current;
    if (!card || busy.current) {
      return;
    }
    busy.current = true;
    Animated.timing(position, {
      toValue: { x: dir * 520, y: 30 },
      duration: 260,
      easing: EASE,
      useNativeDriver: true,
    }).start(() => {
      commit(dir, card);
      busy.current = false;
    });
  };
  const snapBack = () =>
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 300,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  const flyRef = useRef(fly);
  flyRef.current = fly;
  const snapRef = useRef(snapBack);
  snapRef.current = snapBack;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !busy.current,
      onPanResponderGrant: () => position.stopAnimation(),
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.3 }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THROW_AT) {
          flyRef.current(1);
        } else if (g.dx < -THROW_AT) {
          flyRef.current(-1);
        } else {
          snapRef.current();
        }
      },
      onPanResponderTerminate: () => snapRef.current(),
    }),
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-20deg', '20deg'],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-90, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const backScale = position.x.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });
  const backY = position.x.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: [0, 14, 0],
    extrapolate: 'clamp',
  });

  const save = () => {
    if (!current || busy.current) {
      return;
    }
    // There is no shortlist on the server yet: like the prototype, remember it with a toast and move on to the next dog.
    const dogName = current.kind === 'shelterDog' ? current.dog.name : current.dogs[0]?.name;
    setToast(t('discover.savedToShortlist', { name: dogName ?? t('discover.defaultDogName') }));
    fly(-1);
  };

  // ── match modal ───────────────────────────────────────────────────────────────────────────────────
  const matchUser = latestMatch?.user;
  const sayHi = () => {
    if (!latestMatch) {
      return;
    }
    const { match, user } = latestMatch;
    dispatch(clearLatestMatch());
    navigation.navigate('ChatTab', {
      screen: 'DirectMessage',
      params: { matchId: match.id, userName: user.displayName },
      initial: false,
    });
  };

  const empty = !current && !swipeLoading;

  return (
    <View style={styles.screen}>
      {/* header */}
      <View style={[styles.header, { paddingTop: top }]}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '500', letterSpacing: -0.36 }}>
            {t('discover.title')}
          </Text>
          <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>
            {t('discover.dogsWithin', { radius: radiusLabel, count: deck.length })}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={t('discover.filters.title')}
          onPress={() => setFiltersOpen(true)}
          style={({ pressed }) => [styles.roundBtn44, pressed && { backgroundColor: PRESSED }]}
        >
          <Icon name="sliders-horizontal" size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* deck */}
      <View style={styles.deck}>
        {swipeLoading && !current && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 120, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!!next && (
          <Animated.View
            pointerEvents="none"
            style={[styles.cardSlot, { transform: [{ scale: backScale }, { translateY: backY }] }]}
          >
            <BackCard key="back" />
          </Animated.View>
        )}
        {!!current && (
          <Animated.View
            key={current.id}
            {...panResponder.panHandlers}
            style={[
              styles.cardSlot,
              { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
            ]}
          >
            <DogCard card={current} likeOpacity={likeOpacity} nopeOpacity={nopeOpacity} />
          </Animated.View>
        )}
        {empty && (
          <View style={styles.empty}>
            <Icon name="paw-print" size={34} color={Ramp.neutral[600]} />
            <Text style={{ fontSize: 22, fontWeight: '500' }}>{t('discover.emptyTitle')}</Text>
            <Text style={{ fontSize: 14, color: Ramp.neutral[400] }}>
              {t('discover.emptyBody')}
            </Text>
            <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 8 }}>
              <Btn
                label={t('discover.startOver')}
                shape="pill"
                height={44}
                fontSize={14}
                paddingHorizontal={18}
                onPress={() => dispatch(resetSwipes())}
              />
              <Btn
                label={t('discover.openMap')}
                variant="neutral"
                shape="pill"
                height={44}
                fontSize={14}
                paddingHorizontal={18}
                onPress={() => navigation.navigate('MapTab')}
              />
            </View>
          </View>
        )}
      </View>

      {/* actions */}
      {!!current && (
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel={t('discover.pass')}
            onPress={() => fly(-1)}
            style={({ pressed }) => [styles.roundBtn54, pressed && { backgroundColor: PRESSED }]}
          >
            <Icon name="x" size={21} color={Ramp.neutral[300]} />
          </Pressable>
          <Pressable
            onPress={() => fly(1)}
            style={({ pressed }) => [
              styles.walkBtn,
              pressed && { backgroundColor: 'rgba(145,132,217,0.12)' },
            ]}
          >
            <Icon name="paw-print" size={15} color={Colors.primary} weight="fill" />
            <Text
              style={{ fontSize: 15, fontWeight: '500', color: Colors.primary, marginLeft: 8 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {t('discover.walkTogether')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('discover.save')}
            onPress={save}
            style={({ pressed }) => [styles.roundBtn54, pressed && { backgroundColor: PRESSED }]}
          >
            <Icon name="bookmark-simple" size={21} color={Ramp.neutral[300]} />
          </Pressable>
        </View>
      )}

      <SavedToast text={toast} onDone={() => setToast(null)} top={top - 2} />

      <DiscoverFiltersSheet
        visible={filtersOpen}
        filters={deckFilters}
        defaultRadiusKm={radius}
        onClose={() => setFiltersOpen(false)}
        onApply={applyFilters}
      />

      <MatchModal
        visible={!!latestMatch}
        me={me ?? undefined}
        other={matchUser}
        myDogName={myDogs[0]?.name}
        theirDogName={matchUser?.dogs?.[0]?.name}
        onMessage={sayHi}
        onClose={() => dispatch(clearLatestMatch())}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  roundBtn44: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: { flex: 1, marginTop: 4, marginHorizontal: 16 },
  cardSlot: { position: 'absolute', left: 0, right: 0, top: 0, height: CARD_HEIGHT },
  empty: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 120,
    rowGap: 10,
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    paddingHorizontal: 24,
    paddingBottom: 112,
  },
  roundBtn54: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: DIVIDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
