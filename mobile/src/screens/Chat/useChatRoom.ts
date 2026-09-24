import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { connectSocket, joinWalkRoom, leaveWalkRoom } from '../../services/socket';
import { SOCKET_EVENTS } from '@walkme/shared';

/** What the server broadcasts on `chat:message:receive` (the REST message DTO). */
export interface SocketMessage {
  id: string;
  roomId: string;
  walkId?: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
  createdAt: string;
}

/**
 * Joins the socket room of a walk (walk id) or a match (match id) while the screen is mounted and hands every incoming
 * message of that room to `onMessage`. Re-joins after a reconnect (server-side rooms are lost with the connection).
 * The REST send also broadcasts to the room, so the sender receives their own message too: callers must dedupe by id.
 */
export function useChatRoom(roomId: string | undefined, onMessage: (msg: SocketMessage) => void) {
  const token = useSelector((s: RootState) => s.auth.token);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!token || !roomId) return undefined;
    const socket = connectSocket(token);
    const join = () => joinWalkRoom(roomId);
    const receive = (msg: SocketMessage) => {
      if (msg.roomId === roomId) handler.current(msg);
    };
    socket.on('connect', join);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, receive);
    join();
    return () => {
      socket.off('connect', join);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, receive);
      leaveWalkRoom(roomId);
    };
  }, [roomId, token]);
}
