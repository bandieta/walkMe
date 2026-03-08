import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { chatApi } from '../../services/api';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

interface Msg { id: string; senderId: string; senderName: string; content: string; createdAt: string; }

const Bubble: React.FC<{ msg: Msg; isMine: boolean }> = ({ msg, isMine }) => (
  <View style={[bS.row, isMine && bS.rowMine]}>
    {!isMine && (
      <View style={bS.avatar}>
        <Text style={bS.avatarText}>{msg.senderName?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
    )}
    <View style={[bS.bubble, isMine ? bS.mine : bS.theirs]}>
      {!isMine && <Text style={bS.sender}>{msg.senderName}</Text>}
      <Text style={[bS.text, isMine && bS.textMine]}>{msg.content}</Text>
      <Text style={[bS.time, isMine && bS.timeMine]}>{formatTime(msg.createdAt)}</Text>
    </View>
  </View>
);

const bS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, paddingHorizontal: Spacing.md },
  rowMine: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceDark, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  avatarText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  bubble: { maxWidth: '72%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.lg },
  theirs: { backgroundColor: Colors.cardDark, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  mine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  sender: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: 2 },
  text: { fontSize: 15, color: Colors.textPrimary, lineHeight: 20 },
  textMine: { color: '#fff' },
  time: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
});

export const WalkChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { walkId, walkTitle } = route.params as { walkId: string; walkTitle?: string };
  const { user } = useSelector((s: RootState) => s.auth);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    chatApi.getMessages(walkId).then(res => {
      setMessages(res.data as Msg[]);
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }).catch(() => setLoading(false));
  }, [walkId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await chatApi.sendMessage(walkId, text);
      setMessages(prev => [...prev, res.data as Msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{walkTitle ?? 'Walk Chat'}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>Group Chat</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>Be the first to say hi!</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <Bubble msg={item} isMine={item.senderId === user?.id} />}
            contentContainerStyle={{ paddingVertical: Spacing.md }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendIcon}>↑</Text>}
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveTxt: { fontSize: 12, color: Colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surfaceDark },
  input: { flex: 1, backgroundColor: Colors.backgroundDark, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.textPrimary, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: Colors.border },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
