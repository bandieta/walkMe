import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  fetchMatchMessages, sendMatchMessage, markMatchRead, MatchMessage,
} from '../../store/slices/matchesSlice';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const Bubble: React.FC<{ msg: MatchMessage; isMine: boolean }> = ({ msg, isMine }) => (
  <View style={[bStyles.row, isMine && bStyles.rowMine]}>
    {!isMine && (
      <View style={bStyles.avatar}>
        <Text style={bStyles.avatarText}>{msg.senderName?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
    )}
    <View style={[bStyles.bubble, isMine ? bStyles.mine : bStyles.theirs]}>
      <Text style={[bStyles.text, isMine && bStyles.textMine]}>{msg.content}</Text>
      <Text style={[bStyles.time, isMine && bStyles.timeMine]}>{formatTime(msg.createdAt)}</Text>
    </View>
  </View>
);

const bStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, paddingHorizontal: Spacing.md },
  rowMine: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center', marginRight: 6, borderWidth: 1, borderColor: Colors.border },
  avatarText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  bubble: { maxWidth: '72%', paddingHorizontal: Spacing.md - 2, paddingVertical: Spacing.sm, borderRadius: Radius.lg },
  theirs: { backgroundColor: Colors.cardDark, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  mine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  text: { ...Typography.body, color: Colors.textPrimary, lineHeight: 20 },
  textMine: { color: '#fff' },
  time: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
});

export const DirectMessageScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { matchId, userName } = route.params as { matchId: string; userName: string };
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const messages = useSelector((s: RootState) => s.matches.messages[matchId] ?? []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    dispatch(fetchMatchMessages(matchId));
    dispatch(markMatchRead(matchId));
  }, [matchId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await dispatch(sendMatchMessage({ matchId, content: text }));
    setSending(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userName?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerSub}>🐾 Match</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Say hi to {userName.split(' ')[0]}!</Text>
            <Text style={styles.emptySub}>You matched — break the ice 🐾</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <Bubble msg={item} isMine={item.senderId === user?.id} />}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${userName.split(' ')[0]}…`}
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceDark },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.sm },
  backText: { fontSize: 22, color: Colors.textPrimary },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  list: { paddingVertical: Spacing.md },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surfaceDark },
  input: { flex: 1, backgroundColor: Colors.backgroundDark, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: Colors.border },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
