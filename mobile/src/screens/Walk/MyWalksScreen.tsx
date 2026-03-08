import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNearbyWalks } from '../../store/slices/walksSlice';
import { Walk } from '@walkme/shared';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

type Tab = 'upcoming' | 'hosting' | 'past';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'upcoming', label: 'Joined', emoji: '🗓' },
  { key: 'hosting', label: 'Hosting', emoji: '🎯' },
  { key: 'past', label: 'Past', emoji: '✅' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

interface WalkCardProps {
  walk: Walk;
  userId: string;
  onPress: () => void;
}

const WalkCard: React.FC<WalkCardProps> = ({ walk, userId, onPress }) => {
  const isHost = walk.hostId === userId;
  const spotsLeft = walk.maxParticipants - (walk.currentParticipants ?? 0);
  const statusColor =
    walk.status === 'active'
      ? Colors.secondary
      : walk.status === 'completed'
      ? Colors.textMuted
      : Colors.primary;

  return (
    <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.8}>
      {/* Top row: date pill + host badge */}
      <View style={card.topRow}>
        <View style={card.datePill}>
          <Text style={card.dateText}>
            {formatDate(walk.scheduledAt)} · {formatTime(walk.scheduledAt)}
          </Text>
        </View>
        <View style={[card.statusDot, { backgroundColor: statusColor }]} />
        {isHost && (
          <View style={card.hostBadge}>
            <Text style={card.hostBadgeText}>HOST</Text>
          </View>
        )}
      </View>

      <Text style={card.title} numberOfLines={1}>{walk.title}</Text>
      <Text style={card.description} numberOfLines={2}>{walk.description}</Text>

      <View style={card.footer}>
        <Text style={card.footerItem}>📍 {walk.meetingPoint?.address ?? 'TBD'}</Text>
        <Text style={card.footerSpacer}>·</Text>
        <Text style={card.footerItem}>
          👥 {walk.currentParticipants ?? 0}/{walk.maxParticipants}
          {spotsLeft > 0 ? ` (${spotsLeft} left)` : ' Full'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  datePill: {
    backgroundColor: `${Colors.primary}20`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
    flex: 1,
  },
  dateText: { ...Typography.caption, color: Colors.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: Spacing.sm },
  hostBadge: {
    backgroundColor: `${Colors.secondary}20`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: `${Colors.secondary}40`,
  },
  hostBadgeText: { ...Typography.overline, color: Colors.secondary },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  description: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  footerItem: { ...Typography.caption, color: Colors.textMuted },
  footerSpacer: { ...Typography.caption, color: Colors.border, marginHorizontal: 6 },
});

const EmptyState: React.FC<{ tab: Tab; onDiscover: () => void; onCreate: () => void }> = ({
  tab,
  onDiscover,
  onCreate,
}) => {
  const content = {
    upcoming: {
      emoji: '🗺',
      title: 'No Upcoming Walks',
      subtitle: 'Browse walks near you and join a group walk.',
      cta: 'Discover Walks',
      onCta: onDiscover,
    },
    hosting: {
      emoji: '🎯',
      title: "You're Not Hosting",
      subtitle: "Create your first walk and invite others.",
      cta: 'Create a Walk',
      onCta: onCreate,
    },
    past: {
      emoji: '✅',
      title: 'No Past Walks',
      subtitle: 'Completed walks will appear here.',
      cta: 'Discover Walks',
      onCta: onDiscover,
    },
  }[tab];

  return (
    <View style={empty.container}>
      <Text style={empty.emoji}>{content.emoji}</Text>
      <Text style={empty.title}>{content.title}</Text>
      <Text style={empty.subtitle}>{content.subtitle}</Text>
      <TouchableOpacity style={empty.btn} onPress={content.onCta} activeOpacity={0.85}>
        <Text style={empty.btnText}>{content.cta}</Text>
      </TouchableOpacity>
    </View>
  );
};

const empty = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  btnText: { ...Typography.body, color: '#fff', fontWeight: '700' },
});

export const MyWalksScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { walks, loading } = useSelector((s: RootState) => s.walks);
  const { user } = useSelector((s: RootState) => s.auth);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  useEffect(() => {
    if (user?.location) {
      dispatch(fetchNearbyWalks({ lat: user.location.lat, lng: user.location.lng, radius: 10 }));
    }
  }, [dispatch, user]);

  const now = new Date();
  const userWalks = walks.filter((w) =>
    w.participants?.some((p: any) => (typeof p === 'string' ? p : p.id) === user?.id) ||
    w.hostId === user?.id
  );

  const tabData: Record<Tab, Walk[]> = {
    upcoming: userWalks.filter((w) => new Date(w.scheduledAt) >= now && w.status !== 'completed'),
    hosting: userWalks.filter((w) => w.hostId === user?.id),
    past: userWalks.filter((w) => w.status === 'completed' || new Date(w.scheduledAt) < now),
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDark} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>My Walks</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateWalk')}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
            {tabData[t.key].length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tabData[t.key].length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your walks...</Text>
        </View>
      ) : tabData[activeTab].length === 0 ? (
        <EmptyState
          tab={activeTab}
          onDiscover={() => navigation.navigate('Map')}
          onCreate={() => navigation.navigate('CreateWalk')}
        />
      ) : (
        <FlatList
          data={tabData[activeTab]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WalkCard
              walk={item}
              userId={user?.id ?? ''}
              onPress={() => navigation.navigate('WalkDetail', { walkId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: {
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  createBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    ...Shadow.card,
  },
  createBtnText: { ...Typography.caption, color: '#fff', fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: 4,
    borderBottomWidth: 2, borderColor: 'transparent',
  },
  tabActive: { borderColor: Colors.primary },
  tabEmoji: { fontSize: 14 },
  tabLabel: { ...Typography.caption, color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  list: { padding: Spacing.lg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
});
