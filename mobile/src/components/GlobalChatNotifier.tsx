import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { connectSocket } from '../services/socket';
import { receiveMessage, ChatMessage } from '../store/slices/chatSlice';
import { receiveMatchMessage, MatchMessage } from '../store/slices/matchesSlice';
import { useToast } from './Toast';

/**
 * Mounted once at the app root. The chat socket only has rooms for threads the user is actually part of (the
 * server auto-joins them all on connect — see server/src/modules/chat/socket.ts), so this single listener is
 * enough to catch a message from ANY walk or match thread, no matter which screen is on screen right now —
 * fixing the bug where a message only showed up once you happened to reopen that exact chat.
 *
 * A screen's own `useChatRoom` (WalkChatScreen, DirectMessageScreen) keeps handling its thread's live updates
 * while it's open, in particular auto-marking it read; both listeners can see the same event, but the slices
 * dedupe by message id, so nothing is double-counted.
 */
export const GlobalChatNotifier: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((s: RootState) => s.auth.token);
  const myId = useSelector((s: RootState) => s.auth.user?.id);
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);
  const activeMatchId = useSelector((s: RootState) => s.matches.activeMatchId);
  const { show, element } = useToast();

  useEffect(() => {
    if (!token) return undefined;
    const socket = connectSocket(token);

    const onMessage = (msg: (ChatMessage | MatchMessage) & { walkId?: string; roomId: string }) => {
      const isGroup = !!msg.walkId;
      if (isGroup) dispatch(receiveMessage(msg as ChatMessage));
      else dispatch(receiveMatchMessage(msg as MatchMessage));

      if (msg.senderId === myId) return; // our own message echoing back
      const openRoomId = isGroup ? activeRoomId : activeMatchId;
      if (openRoomId === (msg.walkId ?? msg.roomId)) return; // already looking at this thread
      show(`${msg.senderName}: ${msg.content}`, 'info', 2600);
    };

    socket.on('chat:message:receive', onMessage);
    return () => { socket.off('chat:message:receive', onMessage); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, myId, activeRoomId, activeMatchId]);

  return element;
};
