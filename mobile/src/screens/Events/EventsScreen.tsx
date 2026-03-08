import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Colors, Spacing } from '../../utils/theme';
import { Card, Badge, EmptyState } from '../../components';

export const EventsScreen: React.FC = () => {
  const { events, loading } = useSelector((s: RootState) => s.events);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
      </View>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji="📅"
              title="No events yet"
              subtitle="Check back soon for upcoming dog walks and meetups"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Badge label={item.status} variant="primary" />
            </View>
            <Text style={styles.eventMeta}>{item.date}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  list: { padding: Spacing.xl, gap: Spacing.md },
  card: { marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  eventMeta: { fontSize: 13, color: Colors.textMuted, marginTop: Spacing.xs },
});
