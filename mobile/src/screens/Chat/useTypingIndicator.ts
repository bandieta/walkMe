import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { connectSocket, sendTypingStart, sendTypingStop } from '../../services/socket';

/** How long after the last keystroke we tell the other side we stopped typing. */
const STOP_AFTER_MS = 2000;
/** If no further typing:update arrives (e.g. they backgrounded the app mid-type), stop showing the dots. */
const REMOTE_TIMEOUT_MS = 4000;

interface TypingUpdate {
  roomId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * Drives a thread's typing indicator both ways: call `notifyTyping()` on every keystroke (debounced into
 * chat:typing:start/stop socket events) and read `remoteTyping` to show the other person's three dots.
 */
export function useTypingIndicator(roomId: string | undefined) {
  const token = useSelector((s: RootState) => s.auth.token);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout>>();
  const remoteTimer = useRef<ReturnType<typeof setTimeout>>();
  const sending = useRef(false);

  useEffect(() => {
    if (!token || !roomId) return undefined;
    const socket = connectSocket(token);
    const onUpdate = (update: TypingUpdate) => {
      if (update.roomId !== roomId) return;
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
      setRemoteTyping(update.isTyping);
      if (update.isTyping) {
        remoteTimer.current = setTimeout(() => setRemoteTyping(false), REMOTE_TIMEOUT_MS);
      }
    };
    socket.on('chat:typing:update', onUpdate);
    return () => {
      socket.off('chat:typing:update', onUpdate);
      if (remoteTimer.current) clearTimeout(remoteTimer.current);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (sending.current) {
        sending.current = false;
        sendTypingStop(roomId);
      }
      setRemoteTyping(false);
    };
  }, [roomId, token]);

  const notifyTyping = useCallback(() => {
    if (!roomId) return;
    if (!sending.current) {
      sending.current = true;
      sendTypingStart(roomId);
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      sending.current = false;
      sendTypingStop(roomId);
    }, STOP_AFTER_MS);
  }, [roomId]);

  const notifyStoppedTyping = useCallback(() => {
    if (!roomId) return;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (sending.current) {
      sending.current = false;
      sendTypingStop(roomId);
    }
  }, [roomId]);

  return { remoteTyping, notifyTyping, notifyStoppedTyping };
}
