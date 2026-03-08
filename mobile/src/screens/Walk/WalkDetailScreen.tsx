import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchWalkById, joinWalk, leaveWalk } from '../../store/slices/walksSlice';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

const { width } = Dimensions.get('window');

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export const WalkDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { walkId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { currentWalk, loading } = useSelector((s: RootState) => s.walks);
  const { user } = useSelector((s: RootState) => s.auth);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    dispatch(fetchWalkById(walkId));
  }, [walkId, dispatch]);

  if (loading || !currentWalk) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading walk...</Text>
      </View>
    );
  }

  const isParticipant = currentWalk.participants?.some((p: any) => p.id === user?.id);
  const isHost = currentWalk.host?.id === user?.id;
  const isFull = currentWalk.participants?.length >= currentWalk.maxParticipants;
  const spotsLeft = currentWalk.maxParticipants - (currentWalk.participants?.length ?? 0);

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      if (isParticipant && !isHost) {
        await dispatch(leaveWalk(walkId));
      } else if (!isParticipant) {
        await dispatch(joinWalk(walkId));
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />

      {/* Hero header */}
      <View style={styles.hero}>
        <SafeAreaView>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <View style={[styles.statusBadge,
            currentWalk.status === 'active' && { backgroundColor: 'rgba(29,209,161,0.2)' },
            currentWalk.status === 'pending' && { backgroundColor: 'rgba(108,92,231,0.2)' },
          ]}>
            <Text style={[styles.statusText,
              currentWalk.status === 'active' && { color: Colors.success },
              currentWalk.status === 'pending' && { color: Colors.primary },
            ]}>
              {currentWalk.status === 'active' ? '● Active now' : '◌ Upcoming'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{currentWalk.title}</Text>
          {currentWalk.description && (
            <Text style={styles.heroDesc}>{currentWalk.description}</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Info grid */}
        <View style={styles.card}>
          <InfoRow
            icon="📅"
            label="Date & Time"
            value={new Date(currentWalk.scheduledAt).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="📍"
            label="Meeting Point"
            value={`${Number(currentWalk.meetingLat).toFixed(4)}, ${Number(currentWalk.meetingLng).toFixed(4)}`}
          />
          <View style={styles.divider} />
          <InfoRow
            icon="👥"
            label="Participants"
            value={`${currentWalk.participants?.length ?? 0} / ${currentWalk.maxParticipants} (${spotsLeft} spots left)`}
          />
        </View>

        {/* Host */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Hosted by</Text>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>
                {currentWalk.host?.displayName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.hostName}>{currentWalk.host?.displayName}</Text>
              {isHost && <Text style={styles.hostBadge}>You are the host</Text>}
            </View>
          </View>
        </View>

        {/* Participants */}
        {currentWalk.participants?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Participants</Text>
            <View style={styles.avatarStack}>
              {currentWalk.participants.slice(0, 8).map((p: any, i: number) => (
                <View key={p.id} style={[styles.participantAvatar, { marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i }]}>
                  <Text style={styles.participantAvatarText}>{p.displayName?.[0]?.toUpperCase()}</Text>
                </View>
              ))}
              {currentWalk.participants.length > 8 && (
                <View style={[styles.participantAvatar, styles.moreAvatar, { marginLeft: -12 }]}>
                  <Text style={styles.participantAvatarText}>+{currentWalk.participants.length - 8}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        {isParticipant && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat', { walkId })}
          >
            <Text style={styles.chatBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        )}
        {!isHost && (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              isParticipant && styles.leaveBtn,
              (isFull && !isParticipant) && styles.disabledBtn,
            ]}
            onPress={handleJoinLeave}
            disabled={joining || (isFull && !isParticipant)}
            activeOpacity={0.85}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isParticipant ? 'Leave Walk' : isFull ? 'Walk Full' : 'Join Walk'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {isHost && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Chat', { walkId })}
          >
            <Text style={styles.primaryBtnText}>Open Chat Room</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.backgroundDark, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  hero: {
    backgroundColor: Colors.surfaceDark,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backBtn: { margin: Spacing.md, alignSelf: 'flex-start' },
  backBtnText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  heroContent: { paddingHorizontal: Spacing.lg },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  statusText: { ...Typography.caption, fontWeight: '700' },
  heroTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: Spacing.sm },
  heroDesc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  body: { flex: 1, padding: Spacing.lg },
  card: {
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(108,92,231,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoLabel: { ...Typography.caption, color: Colors.textSecondary },
  infoValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  sectionLabel: { ...Typography.overline, color: Colors.textMuted, marginBottom: Spacing.md },
  hostRow: { flexDirection: 'row', alignItems: 'center' },
  hostAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2, borderColor: Colors.primaryDark,
  },
  hostAvatarText: { ...Typography.h3, color: '#fff', fontWeight: '700' },
  hostName: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  hostBadge: { ...Typography.caption, color: Colors.primary },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  participantAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.cardDark,
  },
  moreAvatar: { backgroundColor: Colors.primary },
  participantAvatarText: { ...Typography.caption, color: '#fff', fontWeight: '700' },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1, borderColor: Colors.border,
    flexDirection: 'row',
    padding: Spacing.md,
    paddingBottom: 30,
    gap: Spacing.md,
  },
  chatBtn: {
    flex: 0,
    width: 56, height: 52,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardDark,
  },
  chatBtnText: { fontSize: 20 },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    height: 52,
    ...Shadow.card,
  },
  leaveBtn: { backgroundColor: Colors.error },
  disabledBtn: { backgroundColor: Colors.border },
  primaryBtnText: { ...Typography.bodyLarge, color: '#fff', fontWeight: '700' },
});
