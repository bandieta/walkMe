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

export const ChatScreen: React.FC<{ route: any }> = ({ route }) => {
  const { walkId } = route.params;
  const { user, token } = useSelector((s: RootState) => s.auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!token || !user) return;

    // Load history
    chatApi.getMessages(walkId).then((res) => {
      setMessages(res.data.reverse());
    });

    // Connect socket
    const socket = connectSocket(token);
    joinWalkRoom(walkId);

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      leaveWalkRoom(walkId);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE);
    };
  }, [walkId, token, user]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    sendMessage(walkId, user.id, input.trim());
    setInput('');
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    return (
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        {!isMine && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={[styles.messageText, isMine && styles.myText]}>{item.content}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12 },
  bubble: {
    maxWidth: '75%', padding: 10, borderRadius: 16, marginVertical: 4,
  },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#4CAF50' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
  senderName: { fontSize: 12, color: '#888', marginBottom: 2 },
  messageText: { fontSize: 15, color: '#1a1a1a' },
  myText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row', padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderColor: '#e0e0e0', alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4CAF50', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: '600' },
});
