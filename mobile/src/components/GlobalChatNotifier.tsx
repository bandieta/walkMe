import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store';
import { connectSocket } from '../services/socket';
import { receiveMessage, ChatMessage } from '../store/slices/chatSlice';
import { receiveMatchMessage, MatchMessage } from '../store/slices/matchesSlice';
import { receiveDogRequestMessage, DogRequestMessage } from '../store/slices/shelterRequestsSlice';
import { receiveNotification, fetchUnreadCount, fetchNotificationPreferences, AppNotification } from '../store/slices/notificationsSlice';
import { formatNotification } from '../utils/notificationCopy';
import { useToast } from './Toast';

/**
 * Mounted once at the app root. The chat socket only has rooms for threads the user is actually part of (the
 * server auto-joins them all on connect — see server/src/modules/chat/socket.ts), so this single listener is
 * enough to catch a message from ANY walk, match or shelter-dog-request thread, no matter which screen is on
 * screen right now — fixing the bug where a message only showed up once you happened to reopen that exact chat.
 *
 * A screen's own `useChatRoom` (WalkChatScreen, DirectMessageScreen, DogRequestChatScreen) keeps handling its
 * thread's live updates while it's open, in particular auto-marking it read; both listeners can see the same
 * event, but the slices dedupe by message id, so nothing is double-counted.
 */
export const GlobalChatNotifier: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const token = useSelector((s: RootState) => s.auth.token);
  const myId = useSelector((s: RootState) => s.auth.user?.id);
  const activeRoomId = useSelector((s: RootState) => s.chat.activeRoomId);
  const activeMatchId = useSelector((s: RootState) => s.matches.activeMatchId);
  const activeRequestId = useSelector((s: RootState) => s.shelterRequests.activeRequestId);
  // Only used to tell a match room apart from a dog-request room (neither carries a walkId) — kept fresh by
  // ChatListScreen's own fetch on focus. Anything not a known request id defaults to "match", same as before
  // dog requests existed.
  const requestIds = useSelector((s: RootState) => s.shelterRequests.requests.map((r) => r.id));
  // Gates only the live in-app toast below — the underlying message still lands in its chat thread either way,
  // same as the "messages" category never gating the persisted Notification center feed server-side (see
  // notifications/service.ts's TYPE_CATEGORY comment).
  const messagesToastEnabled = useSelector((s: RootState) => s.notifications.preferences.messages);
  const { show, element } = useToast();

  useEffect(() => {
    if (!token) return;
    dispatch(fetchUnreadCount());
    dispatch(fetchNotificationPreferences());
  }, [token, dispatch]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = connectSocket(token);

    const onMessage = (msg: (ChatMessage | MatchMessage | DogRequestMessage) & { walkId?: string; roomId: string }) => {
      const kind = msg.walkId ? 'walk' : requestIds.includes(msg.roomId) ? 'dogRequest' : 'match';
      if (kind === 'walk') dispatch(receiveMessage(msg as ChatMessage));
      else if (kind === 'dogRequest') dispatch(receiveDogRequestMessage(msg as DogRequestMessage));
      else dispatch(receiveMatchMessage(msg as MatchMessage));

      if (msg.senderId === myId) return; // our own message echoing back
      const openRoomId = kind === 'walk' ? activeRoomId : kind === 'dogRequest' ? activeRequestId : activeMatchId;
      if (openRoomId === (msg.walkId ?? msg.roomId)) return; // already looking at this thread
      if (messagesToastEnabled) show(`${msg.senderName}: ${msg.content}`, 'info', 2600);
    };

    // The notification center's own feed — a match, walk/event activity, or a shelter walk-request update.
    // Message-type notifications are deliberately not toasted here: the raw chat event above already does,
    // with the actual message preview, gated by messagesToastEnabled.
    const onNotification = (notification: AppNotification) => {
      dispatch(receiveNotification(notification));
      if (notification.type !== 'message') show(formatNotification(t, notification).body, 'info', 3200);
    };

    socket.on('chat:message:receive', onMessage);
    socket.on('notification:new', onNotification);
    return () => {
      socket.off('chat:message:receive', onMessage);
      socket.off('notification:new', onNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, myId, activeRoomId, activeMatchId, activeRequestId, requestIds, messagesToastEnabled]);

  return element;
};
