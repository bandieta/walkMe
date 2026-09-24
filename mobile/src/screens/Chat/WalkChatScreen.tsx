import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { walksApi } from '../../services/api';
import {
  fetchMessages, sendWalkMessage, receiveMessage, setActiveRoom, markRoomRead, ChatMessage,
} from '../../store/slices/chatSlice';
import { categoryIcon, IconName } from '../../components/Icon';
import { ThreadView } from './ThreadView';
import { useChatRoom } from './useChatRoom';
import { walkWhen } from './threadFormat';

const NO_MESSAGES: ChatMessage[] = [];

interface WalkInfo {
  title: string;
  category?: string;
  status?: string;
  scheduledAt?: string;
  participantIds?: string[];
  participants?: { id: string }[];
}

/** Group chat of a walk. Reached from the walk detail, the chat list or the profile's walks. */
export const WalkChatScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { walkId, walkTitle } = route.params as { walkId: string; walkTitle?: string };
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const messages = useSelector((s: RootState) => s.chat.messages[walkId]) ?? NO_MESSAGES;
  const [walk, setWalk] = useState<WalkInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    dispatch(setActiveRoom(walkId));
    dispatch(markRoomRead(walkId));
    dispatch(fetchMessages(walkId)).finally(() => alive && setLoading(false));
    walksApi.getById(walkId).then((res) => alive && setWalk(res.data as WalkInfo)).catch(() => undefined);
    return () => {
      alive = false;
      dispatch(setActiveRoom(null));
    };
  }, [walkId, dispatch]);

  // Messages from the other walkers arrive over the socket (our own come back through it too; the slice dedupes).
  useChatRoom(walkId, (msg) => dispatch(receiveMessage({ ...msg, walkId })));

  const title = walk?.title ?? walkTitle ?? '';
  const going = walk ? (walk.participantIds ?? walk.participants ?? []).length : 0;
  const when = walk ? walkWhen(walk.scheduledAt, walk.status) : '';
  const subtitle = walk ? [`${going} going`, when].filter(Boolean).join(' · ') : '';
  const icon = categoryIcon(walk?.category);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(navigation.getState().routeNames[0]);
  };

  // "Walk" opens the walk detail: straight back when we came from it, otherwise onto the map stack (the chat tab has none).
  const openWalk = () => {
    const state = navigation.getState();
    const previous = state.routes[state.index - 1];
    if (previous?.name === 'WalkDetail' && previous.params?.walkId === walkId) navigation.goBack();
    else if (state.routeNames.includes('WalkDetail')) navigation.navigate('WalkDetail', { walkId });
    else navigation.navigate('MapTab', { screen: 'WalkDetail', params: { walkId } });
  };

  const send = async (content: string) => {
    if (!user) return false;
    const result = await dispatch(sendWalkMessage({ walkId, content, sender: { id: user.id, name: user.displayName } }));
    return !sendWalkMessage.rejected.match(result);
  };

  return (
    <ThreadView
      kind="group"
      title={title}
      subtitle={subtitle}
      avatarIcon={(icon === 'map-pin' ? 'path' : icon) as IconName}
      actionLabel="Walk"
      actionIcon="info"
      onAction={openWalk}
      onBack={goBack}
      messages={messages}
      myId={user?.id}
      loading={loading}
      emptyTitle="Group chat is open"
      emptyBody={`Everyone who joins ${title || 'this walk'} can read and post here.`}
      onSend={send}
    />
  );
};
