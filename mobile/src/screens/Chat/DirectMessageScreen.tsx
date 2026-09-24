import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import {
  fetchMatches, fetchMatchMessages, sendMatchMessage, markMatchRead, receiveMatchMessage, setActiveMatch, MatchMessage,
} from '../../store/slices/matchesSlice';
import { ThreadView } from './ThreadView';
import { useChatRoom } from './useChatRoom';
import { useTypingIndicator } from './useTypingIndicator';
import { firstName, formatKm, initials } from './threadFormat';

const NO_MESSAGES: MatchMessage[] = [];

/** Direct message with a match. Reached from the chat list, the Discover match modal or a `walkme://dm/<matchId>` link. */
export const DirectMessageScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { matchId, userName } = route.params as { matchId: string; userName?: string };
  const dispatch = useDispatch<AppDispatch>();
  const me = useSelector((s: RootState) => s.auth.user);
  const match = useSelector((s: RootState) => s.matches.matches.find((m) => m.id === matchId));
  const messages = useSelector((s: RootState) => s.matches.messages[matchId]) ?? NO_MESSAGES;
  const [loading, setLoading] = useState(true);
  const haveMatch = !!match;

  useEffect(() => {
    let alive = true;
    dispatch(setActiveMatch(matchId));
    dispatch(markMatchRead(matchId));
    dispatch(fetchMatchMessages(matchId)).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      dispatch(setActiveMatch(null));
    };
  }, [matchId, dispatch]);

  // Opened by link (or before the list ever loaded): the header needs the match's person and dog.
  useEffect(() => {
    if (!haveMatch) dispatch(fetchMatches());
  }, [haveMatch, dispatch]);

  // Messages from the other person arrive over the socket (our own come back through it too; the slice dedupes).
  useChatRoom(matchId, (msg) => {
    dispatch(receiveMatchMessage(msg));
    if (msg.senderId !== me?.id) dispatch(markMatchRead(matchId));
  });
  const { remoteTyping, notifyTyping, notifyStoppedTyping } = useTypingIndicator(matchId);

  const other = match?.user;
  const name = other?.displayName ?? userName ?? '';
  const dog = other?.dogs?.[0];
  const distance = formatKm(other?.distanceKm);
  const subtitle = [dog?.name, dog?.breed, distance].filter(Boolean).join(' · ');
  const emptyBody = dog && distance
    ? t('chat.direct.emptyBodyWithDistance', { dog: dog.name, distance })
    : t('chat.direct.emptyBodyBase');

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('ChatList');
  };

  // "Plan walk" starts a walk with them. The chat tab has no create screen, so it goes through the map stack.
  const planWalk = () => {
    const title = dog
      ? t('chat.direct.walkWithTitleAndDog', { name: firstName(name), dog: dog.name })
      : t('chat.direct.walkWithTitle', { name: firstName(name) });
    const state = navigation.getState();
    if (state.routeNames.includes('CreateWalk')) navigation.navigate('CreateWalk', { title });
    else navigation.navigate('MapTab', { screen: 'CreateWalk', params: { title } });
  };

  const send = async (content: string) => {
    if (!me) return false;
    const result = await dispatch(sendMatchMessage({ matchId, content, sender: { id: me.id, name: me.displayName } }));
    return !sendMatchMessage.rejected.match(result);
  };

  return (
    <ThreadView
      kind="direct"
      title={name}
      subtitle={subtitle}
      avatarText={initials(name)}
      actionLabel={t('chat.direct.planWalk')}
      actionIcon="path"
      onAction={planWalk}
      onBack={goBack}
      messages={messages}
      myId={me?.id}
      loading={loading}
      emptyTitle={name ? t('chat.direct.sayHelloTo', { name: firstName(name) }) : ''}
      emptyBody={name ? emptyBody : ''}
      onSend={send}
      otherTyping={remoteTyping}
      onTyping={notifyTyping}
      onStoppedTyping={notifyStoppedTyping}
    />
  );
};
