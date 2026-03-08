import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchEvents } from '../../store/slices/eventsSlice';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { Badge, EmptyState } from '../../components';

const CATEGORIES = ['All', 'Meetup', 'Competition', 'Playdate', 'Walk', 'Wellness', 'Lake'];

const CATEGORY_ICON: Record<string, string> = {
  Meetup: 'people',
  Competition: 'trophy',
  Playdate: 'paw',
  Walk: 'footsteps',
  Wellness: 'leaf',
  Lake: 'water',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3600000;
  if (diffH < 0) return 'Ended';
  if (diffH < 1) return 'Now!';
  if (diffH < 24) return `In ${Math.floor(diffH)}h`;
  const days = Math.floor(diffH / 24);
  return days === 1 ? 'Tomorrow' : `In ${days} days`;
};

export const EventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { events, loading } = useSelector((s: RootState) => s.events);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => { dispatch(fetchEvents()); }, []);

  const filtered = activeCategory === 'All'
    ? events
    : events.filter(e => e.category === activeCategory);

  // Sort: live first, then upcoming, then ended
  const sorted = [...filtered].sort((a, b) => {
    const order = { live: 0, upcoming: 1, ended: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.headerWrap}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Events</Text>
            <Text style={styles.sub}>{events.filter(e => e.status !== 'ended').length} active</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateEvent')}>
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState emoji="📅" title="No events" subtitle="Be the first to create one!" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name={CATEGORY_ICON[item.category] ?? 'calendar'}
                  size={26}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Badge
                    label={item.status === 'live' ? 'LIVE' : formatDate(item.date)}
                    variant={item.status === 'live' ? 'success' : item.status === 'ended' ? 'neutral' : 'primary'}
                    size="sm"
                  />
                </View>
                <View style={styles.cardRow}>
                  <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <Ionicons name="people-outline" size={11} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{item.participantCount}/{item.maxParticipants}</Text>
                  {item.isJoined && <Text style={styles.joinedText}>✓ Joined</Text>}
                  {item.category && <Text style={styles.metaText}>#{item.category}</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateEvent')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  headerWrap: { backgroundColor: Colors.surfaceDark, borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Colors.textMuted },
  createBtn: { backgroundColor: `${Colors.primary}20`, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary },
  createBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, gap: Spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardDark, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  cardLeft: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLocation: { fontSize: 12, color: Colors.textMuted },
  cardMeta: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  joinedText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 28, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
