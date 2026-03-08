import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated, PanResponder,
  Dimensions, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchSwipeDeck, swipeRight, swipeLeft, clearLatestMatch, MatchUser, MatchDog } from '../../store/slices/matchesSlice';
import { Colors, Spacing, Radius, Shadow } from '../../utils/theme';
import { Avatar, Badge, Button } from '../../components';
import { Modal } from '../../components';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W - Spacing.xl * 2;
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

interface SwipeCardProps {
  user: MatchUser & { dogs: MatchDog[] };
  isTop: boolean;
  position: Animated.ValueXY;
  panHandlers: any;
  likeOpacity: Animated.AnimatedInterpolation<string | number>;
  nopeOpacity: Animated.AnimatedInterpolation<string | number>;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ user, isTop, position, panHandlers, likeOpacity, nopeOpacity }) => {
  const dog = user.dogs?.[0];
  const rotate = position.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-20deg', '0deg', '20deg'] });

  return (
    <Animated.View
      style={[
        styles.card,
        isTop && {
          transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
          zIndex: 10,
        },
        !isTop && { transform: [{ scale: 0.95 }], zIndex: 5, top: 10 },
      ]}
      {...(isTop ? panHandlers : {})}
    >
      {/* Dog emoji hero */}
      <View style={styles.cardHero}>
        <Text style={styles.dogEmoji}>{dog?.emoji ?? '🐕'}</Text>
        <View style={styles.heroOverlay}>
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>📍 {(user as any).distance ?? '< 1 km'}</Text>
          </View>
        </View>
        {/* LIKE / NOPE overlays */}
        {isTop && (
          <>
            <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeText}>NOPE</Text>
            </Animated.View>
          </>
        )}
      </View>

      {/* Card info */}
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{user.displayName}</Text>
          {user.age && <Text style={styles.userAge}>{user.age}</Text>}
        </View>
        {dog && (
          <View style={styles.dogRow}>
            <Text style={styles.dogName}>{dog.name}</Text>
            <Text style={styles.dogBreedSep}> · </Text>
            <Text style={styles.dogBreed}>{dog.breed}, {dog.age}y</Text>
          </View>
        )}
        {dog?.personality && (
          <View style={styles.tagsRow}>
            {dog.personality.slice(0, 3).map(tag => (
              <Badge key={tag} label={tag} variant="primary" size="sm" />
            ))}
          </View>
        )}
        <Text style={styles.bio} numberOfLines={2}>{user.bio ?? ''}</Text>
      </View>
    </Animated.View>
  );
};

export const DiscoverScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { swipeDeck, swipeLoading, latestMatch } = useSelector((s: RootState) => s.matches);
  const position = useRef(new Animated.ValueXY()).current;
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => { dispatch(fetchSwipeDeck()); }, []);

  const likeOpacity = position.x.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, tension: 80, friction: 8 }).start();
  };

  const animateSwipe = (direction: 'left' | 'right', onDone: () => void) => {
    const toX = direction === 'right' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    Animated.timing(position, { toValue: { x: toX, y: 0 }, duration: 280, useNativeDriver: true }).start(() => {
      position.setValue({ x: 0, y: 0 });
      onDone();
    });
  };

  const handleSwipeRight = () => {
    if (isSwiping || swipeDeck.length === 0) return;
    setIsSwiping(true);
    const topUser = swipeDeck[0];
    animateSwipe('right', () => {
      dispatch(swipeRight(topUser.id)).finally(() => setIsSwiping(false));
    });
  };

  const handleSwipeLeft = () => {
    if (isSwiping || swipeDeck.length === 0) return;
    setIsSwiping(true);
    const topUser = swipeDeck[0];
    animateSwipe('left', () => {
      dispatch(swipeLeft(topUser.id)).finally(() => setIsSwiping(false));
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5,
      onPanResponderMove: (_, gs) => position.setValue({ x: gs.dx, y: gs.dy * 0.3 }),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) handleSwipeRight();
        else if (gs.dx < -SWIPE_THRESHOLD) handleSwipeLeft();
        else resetPosition();
      },
    }),
  ).current;

  const topUser = swipeDeck[0];
  const nextUser = swipeDeck[1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 DogPals</Text>
        <Text style={styles.headerSub}>Discover nearby dogs</Text>
      </View>

      {/* Cards area */}
      <View style={styles.deckArea}>
        {swipeLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding dogs nearby…</Text>
          </View>
        ) : swipeDeck.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={styles.emptyTitle}>You've seen everyone!</Text>
            <Text style={styles.emptySub}>Check back tomorrow for new dogs in your area.</Text>
          </View>
        ) : (
          <>
            {nextUser && (
              <SwipeCard
                user={nextUser}
                isTop={false}
                position={position}
                panHandlers={panResponder.panHandlers}
                likeOpacity={likeOpacity}
                nopeOpacity={nopeOpacity}
              />
            )}
            <SwipeCard
              user={topUser}
              isTop={true}
              position={position}
              panHandlers={panResponder.panHandlers}
              likeOpacity={likeOpacity}
              nopeOpacity={nopeOpacity}
            />
          </>
        )}
      </View>

      {/* Action buttons */}
      {swipeDeck.length > 0 && !swipeLoading && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.nopeBtn]} onPress={handleSwipeLeft}>
            <Text style={styles.actionEmoji}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.superLikeBtn]}>
            <Text style={styles.actionEmoji}>⭐</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={handleSwipeRight}>
            <Text style={styles.actionEmoji}>❤️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match modal */}
      <Modal
        visible={!!latestMatch}
        onClose={() => dispatch(clearLatestMatch())}
        title={undefined}
      >
        <View style={styles.matchModal}>
          <Text style={styles.matchEmoji}>🎉</Text>
          <Text style={styles.matchTitle}>It's a Match!</Text>
          <Text style={styles.matchSub}>
            You and <Text style={{ color: Colors.primary }}>{latestMatch?.user?.displayName}</Text> both liked each other's dogs!
          </Text>
          <Button
            label="Send a message"
            onPress={() => dispatch(clearLatestMatch())}
            style={{ marginTop: Spacing.lg }}
            fullWidth
          />
          <Button
            label="Keep swiping"
            variant="ghost"
            onPress={() => dispatch(clearLatestMatch())}
            style={{ marginTop: Spacing.sm }}
            fullWidth
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  card: {
    position: 'absolute',
    width: CARD_W,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.card,
    overflow: 'hidden',
    ...Shadow.modal,
  },
  cardHero: {
    height: SCREEN_H * 0.32,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dogEmoji: { fontSize: 100 },
  heroOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  distancePill: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  distanceText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  likeStamp: { position: 'absolute', top: 24, left: 24, borderWidth: 3, borderColor: Colors.success, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, transform: [{ rotate: '-20deg' }] },
  likeText: { color: Colors.success, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  nopeStamp: { position: 'absolute', top: 24, right: 24, borderWidth: 3, borderColor: Colors.error, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, transform: [{ rotate: '20deg' }] },
  nopeText: { color: Colors.error, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  cardBody: { padding: Spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  userAge: { fontSize: 20, color: Colors.textSecondary, marginLeft: 8 },
  dogRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  dogName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  dogBreedSep: { color: Colors.textMuted },
  dogBreed: { fontSize: 14, color: Colors.textSecondary },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  bio: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: Spacing.xl, gap: Spacing.lg },
  actionBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  nopeBtn: { backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.error },
  superLikeBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.warning },
  likeBtn: { backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.success },
  actionEmoji: { fontSize: 24 },
  loadingBox: { alignItems: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: 15 },
  emptyBox: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  matchModal: { alignItems: 'center', paddingVertical: Spacing.md },
  matchEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  matchTitle: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: Spacing.sm },
  matchSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
