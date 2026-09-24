import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { fetchMatches, Match } from '../../store/slices/matchesSlice';
import { fetchChatRooms, ChatRoom } from '../../store/slices/chatSlice';
import { Colors, Ramp } from '../../utils/theme';
import { resolveMediaUrl } from '../../utils/media';
import { Icon, categoryIcon } from '../../components/Icon';
import { EmptyState } from '../../components/EmptyState';
import { useScreenInsets } from '../../ui';
import { initials, firstName, walkWhen } from '../Chat/threadFormat';

const HOVER = 'rgba(233,233,237,0.04)';

/**
 * The short time of a direct thread's last message: "Now", "12 min", "3 h" today, then "Yesterday", the weekday
 * ("Mon") for the past week and "12 Sep" after that. (The prototype stores these strings; here they are derived.)
 */
export function chatTime(iso?: string, now: Date = new Date()): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(at)) / 86400000);
  if (days <= 0) {
    const minutes = Math.max(0, Math.floor((now.getTime() - at.getTime()) / 60000));
    if (minutes < 1) return 'Now';
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return at.toLocaleDateString('en-GB', { weekday: 'short' });
  return at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Photo when the person has one, else their initials on the given tint. */
const Face: React.FC<{ name?: string; photoUrl?: string; size: number; radius: number; bg: string; fg: string; fontSize: number }> = ({
  name, photoUrl, size, radius, bg, fg, fontSize,
}) => {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(photoUrl);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontSize, fontWeight: '500', color: fg }}>{initials(name)}</Text>
      )}
    </View>
  );
};

const SectionLabel: React.FC<{ children: string; style?: object }> = ({ children, style }) => (
  <Text style={[{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: Ramp.neutral[500], paddingHorizontal: 20 }, style]}>
    {children}
  </Text>
);

const Row: React.FC<{ onPress: () => void; children: React.ReactNode }> = ({ onPress, children }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: pressed ? HOVER : 'transparent' })}>
    {children}
  </Pressable>
);

export const ChatListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { top } = useScreenInsets();
  const me = useSelector((s: RootState) => s.auth.user);
  const { matches, loading: matchLoading } = useSelector((s: RootState) => s.matches);
  const { rooms, loading: chatLoading } = useSelector((s: RootState) => s.chat);

  // Refresh whenever the tab is shown: reading a thread clears its unread dot.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMatches());
      dispatch(fetchChatRooms());
    }, [dispatch]),
  );

  // Matches nobody has written to yet (newest first), direct threads (server order: latest message first) and the
  // walk chats that are still going on.
  const newMatches = useMemo(
    () => matches.filter((m) => !m.lastMessage).sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()),
    [matches],
  );
  const dmRows = useMemo(() => matches.filter((m) => !!m.lastMessage), [matches]);
  const walkRooms = useMemo(() => rooms.filter((r) => r.walkStatus !== 'ended'), [rooms]);

  const openMatch = (m: Match) => navigation.navigate('DirectMessage', { matchId: m.id, userName: m.user?.displayName ?? 'Match' });
  const openWalk = (r: ChatRoom) => navigation.navigate('WalkChat', { walkId: r.walkId, walkTitle: r.walkTitle });

  const walkPreview = (r: ChatRoom) => {
    const l = r.lastMessage;
    if (!l) return 'No messages yet';
    return `${l.senderId === me?.id ? 'You' : firstName(l.senderName)}: ${l.content}`;
  };

  const empty = !matchLoading && !chatLoading && newMatches.length === 0 && dmRows.length === 0 && walkRooms.length === 0;
  const now = new Date();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '500', letterSpacing: -0.36 }}>Messages</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 5, paddingBottom: 110, rowGap: 22, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}>
        {newMatches.length > 0 && (
          <View style={{ rowGap: 10 }}>
            <SectionLabel>New matches</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: 14, paddingHorizontal: 20 }}>
              {newMatches.map((m) => (
                <Pressable key={m.id} onPress={() => openMatch(m)} style={{ width: 62, alignItems: 'center', rowGap: 6, paddingVertical: 1 }}>
                  <View style={{ width: 58, height: 58 }}>
                    {/* box-shadow: 0 0 0 2px bg, 0 0 0 3px accent */}
                    <View pointerEvents="none" style={{ position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 31, backgroundColor: Colors.backgroundDark }} />
                    <View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 32, borderWidth: 1, borderColor: Colors.primary }} />
                    <Face name={m.user?.displayName} photoUrl={m.user?.photoUrl} size={58} radius={29} bg={Ramp.accent[800]} fg={Ramp.accent[200]} fontSize={16} />
                  </View>
                  <Text style={{ fontSize: 12 }} numberOfLines={1}>{firstName(m.user?.displayName)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {walkRooms.length > 0 && (
          <View>
            <SectionLabel style={{ paddingBottom: 4 }}>Walk chats</SectionLabel>
            {walkRooms.map((r) => (
              <Row key={r.walkId} onPress={() => openWalk(r)}>
                <View style={{ width: 48, height: 48, borderRadius: 12, borderCurve: 'circular', backgroundColor: Ramp.accent[900], alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={categoryIcon(r.walkCategory)} size={20} color={Ramp.accent[300]} />
                </View>
                <View style={{ flex: 1, minWidth: 0, marginTop: -1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 8 }}>
                    <Text style={{ fontSize: 15, flexShrink: 1 }} numberOfLines={1}>{r.walkTitle}</Text>
                    <Text style={{ fontSize: 11, flexShrink: 0, color: r.walkStatus === 'live' ? Ramp.accent[300] : Ramp.neutral[500] }} numberOfLines={1}>
                      {walkWhen(r.scheduledAt, r.walkStatus, now)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: Ramp.neutral[500] }} numberOfLines={1}>{walkPreview(r)}</Text>
                </View>
              </Row>
            ))}
          </View>
        )}

        {dmRows.length > 0 && (
          <View>
            <SectionLabel style={{ paddingBottom: 4 }}>Direct</SectionLabel>
            {dmRows.map((m) => {
              const dog = m.user?.dogs?.[0]?.name;
              const mine = !!me?.id && m.lastMessageSenderId === me.id;
              return (
                <Row key={m.id} onPress={() => openMatch(m)}>
                  <Face name={m.user?.displayName} photoUrl={m.user?.photoUrl} size={48} radius={24} bg={Ramp.neutral[800]} fg={Ramp.neutral[100]} fontSize={14} />
                  <View style={{ flex: 1, minWidth: 0, marginTop: -1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 8 }}>
                      <Text style={{ fontSize: 15, flexShrink: 1 }} numberOfLines={1}>
                        {m.user?.displayName ?? 'User'}
                        {!!dog && <Text style={{ fontSize: 13, color: Ramp.neutral[500] }}>{` & ${dog}`}</Text>}
                      </Text>
                      <Text style={{ fontSize: 11, flexShrink: 0, color: Ramp.neutral[500] }} numberOfLines={1}>
                        {chatTime(m.lastMessageAt, now) || 'Now'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
                      <Text style={{ flex: 1, fontSize: 13, color: m.unread > 0 ? Colors.textPrimary : Ramp.neutral[500] }} numberOfLines={1}>
                        {(mine ? 'You: ' : '') + m.lastMessage}
                      </Text>
                      {m.unread > 0 && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} />}
                    </View>
                  </View>
                </Row>
              );
            })}
          </View>
        )}

        {empty && (
          <EmptyState icon="chat" title="No messages yet" subtitle="Match with dog owners in Discover to start chatting!" />
        )}
      </ScrollView>
    </View>
  );
};
