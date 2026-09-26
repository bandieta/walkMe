import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import {
  fetchMatches,
  fetchMatchMessages,
  sendMatchMessage,
  markMatchRead,
  receiveMatchMessage,
  setActiveMatch,
  unmatch,
  MatchMessage,
} from '../../store/slices/matchesSlice';
import { storageApi, blocksApi } from '../../services/api';
import { ThreadView } from './ThreadView';
import { useChatRoom } from './useChatRoom';
import { useTypingIndicator } from './useTypingIndicator';
import { firstName, formatKm, initials } from './threadFormat';
import { OptionsSheet } from '../../components/OptionsSheet';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ReportDialog } from '../../components/ReportDialog';
import { useToast } from '../../components/Toast';

const NO_MESSAGES: MatchMessage[] = [];

/** Direct message with a match. Reached from the chat list, the Discover match modal or a `walkme://dm/<matchId>` link. */
export const DirectMessageScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const { matchId, userName } = route.params as { matchId: string; userName?: string };
  const dispatch = useDispatch<AppDispatch>();
  const me = useSelector((s: RootState) => s.auth.user);
  const match = useSelector((s: RootState) => s.matches.matches.find((m) => m.id === matchId));
  const messages = useSelector((s: RootState) => s.matches.messages[matchId]) ?? NO_MESSAGES;
  const [loading, setLoading] = useState(true);
  const [sendingImage, setSendingImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { show: showToast, element: toastElement } = useToast();
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
    if (!haveMatch) {
      dispatch(fetchMatches());
    }
  }, [haveMatch, dispatch]);

  // Messages from the other person arrive over the socket (our own come back through it too; the slice dedupes).
  useChatRoom(matchId, (msg) => {
    dispatch(receiveMatchMessage(msg));
    if (msg.senderId !== me?.id) {
      dispatch(markMatchRead(matchId));
    }
  });
  const { remoteTyping, notifyTyping, notifyStoppedTyping } = useTypingIndicator(matchId);

  const other = match?.user;
  const name = other?.displayName ?? userName ?? '';
  const dog = other?.dogs?.[0];
  const distance = formatKm(other?.distanceKm);
  const subtitle = [dog?.name, dog?.breed, distance].filter(Boolean).join(' · ');
  const emptyBody =
    dog && distance
      ? t('chat.direct.emptyBodyWithDistance', { dog: dog.name, distance })
      : t('chat.direct.emptyBodyBase');

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ChatList');
    }
  };

  // "Plan walk" starts a walk with them. The chat tab has no create screen, so it goes through the map stack.
  const planWalk = () => {
    const title = dog
      ? t('chat.direct.walkWithTitleAndDog', { name: firstName(name), dog: dog.name })
      : t('chat.direct.walkWithTitle', { name: firstName(name) });
    const state = navigation.getState();
    if (state.routeNames.includes('CreateWalk')) {
      navigation.navigate('CreateWalk', { title });
    } else {
      navigation.navigate('MapTab', { screen: 'CreateWalk', params: { title } });
    }
  };

  const send = async (content: string) => {
    if (!me) {
      return false;
    }
    const result = await dispatch(
      sendMatchMessage({ matchId, content, sender: { id: me.id, name: me.displayName } }),
    );
    return !sendMatchMessage.rejected.match(result);
  };

  const pickAndSendImage = async () => {
    if (!me || sendingImage) {
      return;
    }
    let picker: any;
    try {
      picker = require('react-native-image-picker');
    } catch {
      Alert.alert(t('dogs.form.photosUnavailableTitle'), t('dogs.form.photosUnavailableBody'));
      return;
    }
    try {
      const res = await picker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
      });
      const asset = res?.assets?.[0];
      if (!asset?.uri) {
        return;
      }
      setSendingImage(true);
      const up = await storageApi.upload({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      });
      const url = up.data.url as string;
      const result = await dispatch(
        sendMatchMessage({
          matchId,
          content: url,
          type: 'image',
          sender: { id: me.id, name: me.displayName },
        }),
      );
      if (sendMatchMessage.rejected.match(result)) {
        showToast(t('chat.couldNotSendPhoto'), 'error');
      }
    } catch {
      showToast(t('chat.couldNotSendPhoto'), 'error');
    } finally {
      setSendingImage(false);
    }
  };

  const doBlock = async () => {
    setBlockDialogOpen(false);
    setMenuOpen(false);
    if (!other) {
      return;
    }
    try {
      await blocksApi.block(other.id);
      goBack();
    } catch {
      showToast(t('personProfile.couldNotBlock'), 'error');
    }
  };

  const doUnmatch = async () => {
    setUnmatchDialogOpen(false);
    setMenuOpen(false);
    const result = await dispatch(unmatch(matchId));
    if (unmatch.rejected.match(result)) {
      showToast(t('chat.direct.couldNotUnmatch'), 'error');
    } else {
      goBack();
    }
  };

  return (
    <>
      <ThreadView
        kind="direct"
        title={name}
        subtitle={subtitle}
        avatarText={initials(name)}
        onTitlePress={other ? () => setMenuOpen(true) : undefined}
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
        onPickImage={pickAndSendImage}
        sendingImage={sendingImage}
        otherTyping={remoteTyping}
        onTyping={notifyTyping}
        onStoppedTyping={notifyStoppedTyping}
      />

      <OptionsSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        options={[
          {
            key: 'report',
            icon: 'warning',
            label: t('personProfile.menu.report', { name: firstName(name) }),
            onPress: () => {
              setMenuOpen(false);
              setReportOpen(true);
            },
          },
          {
            key: 'block',
            icon: 'shield',
            tone: 'danger',
            label: t('personProfile.menu.block', { name: firstName(name) }),
            onPress: () => {
              setMenuOpen(false);
              setBlockDialogOpen(true);
            },
          },
          {
            key: 'unmatch',
            icon: 'x',
            tone: 'danger',
            label: t('chat.direct.menu.unmatch'),
            onPress: () => {
              setMenuOpen(false);
              setUnmatchDialogOpen(true);
            },
          },
        ]}
      />

      <ConfirmDialog
        visible={blockDialogOpen}
        tone="danger"
        title={t('personProfile.blockDialog.title', { name: firstName(name) })}
        message={t('personProfile.blockDialog.message', { name: firstName(name) })}
        confirmLabel={t('personProfile.blockDialog.confirm')}
        onCancel={() => setBlockDialogOpen(false)}
        onConfirm={doBlock}
      />

      <ConfirmDialog
        visible={unmatchDialogOpen}
        tone="danger"
        title={t('chat.direct.unmatchDialog.title', { name: firstName(name) })}
        message={t('chat.direct.unmatchDialog.message')}
        confirmLabel={t('chat.direct.unmatchDialog.confirm')}
        onCancel={() => setUnmatchDialogOpen(false)}
        onConfirm={doUnmatch}
      />

      {other && (
        <ReportDialog
          visible={reportOpen}
          targetType="user"
          targetId={other.id}
          subjectName={firstName(name)}
          onClose={() => setReportOpen(false)}
          onSubmitted={(success) => {
            setReportOpen(false);
            showToast(
              success ? t('report.submitted') : t('report.couldNotSubmit'),
              success ? 'success' : 'error',
            );
          }}
        />
      )}

      {toastElement}
    </>
  );
};
