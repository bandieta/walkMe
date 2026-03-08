import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchMatches } from '../../store/slices/matchesSlice';
import { fetchChatRooms } from '../../store/slices/chatSlice';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { Avatar, Badge } from '../../components';

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3600000;
  if (diffH < 1) return `${Math.floor(diffH * 60)}m`;
  if (diffH < 24) return `${Math.floor(diffH)}h`;
  return `${Math.floor(diffH / 24)}d`;
};

export const ChatListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { matches, loading: matchLoading } = useSelector((s: RootState) => s.matches);
  const { rooms, loading: chatLoading } = useSelector((s: RootState) => s.chat);

  useEffect(() => {
    dispatch(fetchMatches());
    dispatch(fetchChatRooms());
  }, []);

  const totalUnread = matches.reduce((n, m) => n + m.unread, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {totalUnread > 0 && <Badge label={String(totalUnread)} variant="primary" size="sm" />}
      </View>

      {/* Matches row */}
      {matches.length > 0 && (
        <View style={styles.matchesSection}>
          <Text style={styles.sectionLabel}>Your Matches</Text>
          <FlatList
            horizontal
            data={matches}
            keyExtractor={m => m.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.matchAvatar}
                onPress={() => navigation.navigate('DirectMessage', { matchId: item.id, userName: item.user?.displayName ?? 'Match' })}
              >
                <View style={styles.matchCircle}>
                  <Avatar name={item.user?.displayName ?? '?'} size="md" backgroundColor={(item.user as any)?.avatarColor} />
                  {item.unread > 0 && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.matchName} numberOfLines={1}>
                  {(item.user?.displayName ?? 'User').split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* DMs from matches */}
      {matches.filter(m => m.lastMessage).length > 0 && (
        <>
          <Text style={styles.sectionLabel2}>Direct Messages</Text>
          {matches.filter(m => m.lastMessage).map(match => (
            <TouchableOpacity
              key={match.id}
              style={styles.row}
              onPress={() => navigation.navigate('DirectMessage', { matchId: match.id, userName: match.user?.displayName ?? 'Match' })}
            >
              <Avatar name={match.user?.displayName ?? '?'} size="md" backgroundColor={(match.user as any)?.avatarColor} />
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{match.user?.displayName ?? 'User'}</Text>
                  <Text style={styles.rowTime}>{formatTime(match.lastMessageAt)}</Text>
                </View>
                <Text style={[styles.rowLast, match.unread > 0 && styles.rowLastUnread]} numberOfLines={1}>
                  {match.lastMessage}
                </Text>
              </View>
              {match.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{match.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Group chats (walks) */}
      {rooms.length > 0 && (
        <>
          <Text style={styles.sectionLabel2}>Walk Chats</Text>
          {rooms.map((room: any) => (
            <TouchableOpacity
              key={room.walkId}
              style={styles.row}
              onPress={() => navigation.navigate('WalkChat', { walkId: room.walkId, walkTitle: room.walkTitle })}
            >
              <View style={styles.groupIcon}>
                <Text style={{ fontSize: 20 }}>🐾</Text>
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName} numberOfLines={1}>{room.walkTitle}</Text>
                  {room.lastMessage && <Text style={styles.rowTime}>{formatTime(room.lastMessage.createdAt)}</Text>}
                </View>
                <Text style={styles.rowLast} numberOfLines={1}>
                  {room.lastMessage ? `${room.lastMessage.senderName}: ${room.lastMessage.content}` : 'No messages yet'}
                </Text>
              </View>
              {room.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{room.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {!matchLoading && !chatLoading && matches.length === 0 && rooms.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>Match with dog owners in Discover to start chatting!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  matchesSection: { paddingTop: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  sectionLabel2: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  matchesList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  matchAvatar: { alignItems: 'center', width: 68 },
  matchCircle: { position: 'relative', marginBottom: 6 },
  unreadDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, top: 0, right: 0, borderWidth: 2, borderColor: Colors.surface },
  matchName: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  rowContent: { flex: 1, marginLeft: Spacing.md },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  rowName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  rowTime: { fontSize: 12, color: Colors.textMuted },
  rowLast: { fontSize: 13, color: Colors.textMuted },
  rowLastUnread: { color: Colors.textPrimary, fontWeight: '600' },
  badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  groupIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl * 2 },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
});
