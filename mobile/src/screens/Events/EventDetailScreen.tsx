import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchEventById, joinEvent, leaveEvent } from '../../store/slices/eventsSlice';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { Button, Badge } from '../../components';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const STATUS_COLORS: Record<string, string> = {
  upcoming: Colors.primary,
  live: Colors.success,
  ended: Colors.textMuted,
};

export const EventDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { eventId } = route.params as { eventId: string };
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading } = useSelector((s: RootState) => s.events);
  const event = events.find(e => e.id === eventId);

  useEffect(() => {
    dispatch(fetchEventById(eventId));
  }, [eventId]);

  const handleJoinToggle = () => {
    if (!event) return;
    if (event.isJoined) {
      dispatch(leaveEvent(eventId));
    } else {
      dispatch(joinEvent(eventId));
    }
  };

  if (loading && !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.textMuted, fontSize: 16 }}>Event not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: Spacing.lg }}>
          <Text style={{ color: Colors.primary }}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const spotsLeft = event.maxParticipants - event.participantCount;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{event.title}</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{event.emoji ?? '🐾'}</Text>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <View style={styles.heroRow}>
              <Badge
                label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                variant={event.status === 'live' ? 'success' : event.status === 'ended' ? 'muted' : 'primary'}
              />
              {event.category && (
                <Badge label={event.category} variant="secondary" />
              )}
            </View>
          </View>
        </View>

        {/* Info cards row */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📅</Text>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>🕒</Text>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{formatTime(event.date)}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.locationText}>{event.location}</Text>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Participants</Text>
          <View style={styles.participantsRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, (event.participantCount / event.maxParticipants) * 100)}%` as any }]} />
            </View>
            <Text style={styles.participantsCount}>
              {event.participantCount}/{event.maxParticipants}
            </Text>
          </View>
          <Text style={styles.spotsText}>
            {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Event is full'}
          </Text>
        </View>

        {/* Description */}
        {event.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        ) : null}

        {/* Join / Leave */}
        {event.status !== 'ended' && (
          <View style={styles.actionSection}>
            <Button
              label={event.isJoined ? '✓ Joined — Leave Event' : spotsLeft === 0 ? 'Event Full' : `Join Event (${spotsLeft} spots left)`}
              onPress={handleJoinToggle}
              variant={event.isJoined ? 'outline' : 'primary'}
              disabled={!event.isJoined && spotsLeft === 0}
              fullWidth
            />
          </View>
        )}
        {event.status === 'ended' && (
          <View style={styles.actionSection}>
            <View style={styles.endedBadge}>
              <Text style={styles.endedText}>This event has ended</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.backgroundDark },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceDark },
  backBtn: { padding: Spacing.sm, width: 40 },
  backText: { fontSize: 22, color: Colors.textPrimary },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  hero: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: Spacing.lg, backgroundColor: Colors.surfaceDark, borderBottomWidth: 1, borderBottomColor: Colors.border },
  heroEmoji: { fontSize: 56 },
  heroContent: { flex: 1, gap: Spacing.sm },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, lineHeight: 28 },
  heroRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  infoRow: { flexDirection: 'row', padding: Spacing.xl, gap: Spacing.md },
  infoCard: { flex: 1, backgroundColor: Colors.cardDark, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  infoEmoji: { fontSize: 22, marginBottom: 4 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  locationText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.primary },
  participantsCount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  spotsText: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  actionSection: { padding: Spacing.xl },
  endedBadge: { backgroundColor: Colors.cardDark, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  endedText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
