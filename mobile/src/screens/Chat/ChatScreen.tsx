import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  connectSocket,
  joinWalkRoom,
  leaveWalkRoom,
  sendMessage,
} from '../../services/socket';
import { chatApi } from '../../services/api';
import { SOCKET_EVENTS, Message } from '@walkme/shared';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const MessageBubble: React.FC<{ item: Message; isMine: boolean }> = ({ item, isMine }) => (
  <View style={[bubbleStyles.row, isMine && bubbleStyles.rowMine]}>
    {!isMine && (
      <View style={bubbleStyles.avatar}>
        <Text style={bubbleStyles.avatarText}>
          {item.senderName?.[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
    )}
    <View style={[bubbleStyles.bubble, isMine ? bubbleStyles.mine : bubbleStyles.theirs]}>
      {!isMine && <Text style={bubbleStyles.senderName}>{item.senderName}</Text>}
      <Text style={[bubbleStyles.text, isMine && bubbleStyles.textMine]}>{item.content}</Text>
      <Text style={[bubbleStyles.time, isMine && bubbleStyles.timeMine]}>{formatTime(item.sentAt)}</Text>
    </View>
  </View>
);

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, paddingHorizontal: Spacing.md },
  rowMine: { justifyContent: 'flex-end' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, borderWidth: 1, borderColor: Colors.border,
  },
  avatarText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  bubble: {
    maxWidth: '72%',
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  theirs: {
    backgroundColor: Colors.cardDark,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  mine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  senderName: { ...Typography.caption, color: Colors.primary, fontWeight: '600', marginBottom: 2 },
  text: { ...Typography.body, color: Colors.textPrimary, lineHeight: 20 },
  textMine: { color: '#fff' },
  time: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
});

export const ChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { walkId, walkTitle } = route.params;
  const { user, token } = useSelector((s: RootState) => s.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!token || !user) return;

    // Load history
    chatApi.getMessages(walkId).then((res) => {
      setMessages(res.data.reverse());
      setHistoryLoading(false);
    }).catch(() => setHistoryLoading(false));

    const socket = connectSocket(token);
    joinWalkRoom(walkId);

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on(SOCKET_EVENTS.WALK_STARTED, () => { /* handle walk started */ });
    socket.on(SOCKET_EVENTS.WALK_ENDED, () => { /* handle walk ended */ });

    return () => {
      leaveWalkRoom(walkId);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
      socket.off(SOCKET_EVENTS.WALK_STARTED);
      socket.off(SOCKET_EVENTS.WALK_ENDED);
    };
  }, [walkId, token, user]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(walkId, user.id, input.trim());
    setInput('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDark} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{walkTitle ?? 'Walk Chat'}</Text>
          <View style={styles.onlineDot} />
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Text style={{ fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {historyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to say something!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble item={item} isMine={item.senderId === user?.id} />
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={{ fontSize: 20 }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  flex: { flex: 1 },
  header: {
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: Colors.primary, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary, marginRight: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingVertical: Spacing.md },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1, borderColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
  },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  input: {
    flex: 1,
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    ...Typography.body,
    color: Colors.textPrimary,
    maxHeight: 120,
    borderWidth: 1, borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnText: { fontSize: 18, color: '#fff', fontWeight: '700' },
});
