import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import {
  fetchDogRequests,
  fetchDogRequestMessages,
  sendDogRequestMessage,
  markDogRequestRead,
  setActiveRequest,
  receiveDogRequestMessage,
  DogRequestMessage,
} from '../../store/slices/shelterRequestsSlice';
import { storageApi } from '../../services/api';
import { ThreadView } from './ThreadView';
import { useChatRoom } from './useChatRoom';
import { useTypingIndicator } from './useTypingIndicator';
import { initials } from './threadFormat';
import { DogDetailsCard } from '../../components/DogDetailsCard';
import { useToast } from '../../components/Toast';

const NO_MESSAGES: DogRequestMessage[] = [];

/**
 * A shelter and one interested person talking "on behalf of" a specific dog — reached only once the shelter has
 * accepted the request (see ChatListScreen: a pending one has no thread to open yet). A shelter juggling several
 * dogs sees "{dog} · {requester}" as the title so its many open threads stay distinguishable; the requester just
 * sees the dog's name, since as far as they're concerned they're talking to the dog.
 */
export const DogRequestChatScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { t } = useTranslation();
  const { requestId } = route.params as { requestId: string };
  const dispatch = useDispatch<AppDispatch>();
  const me = useSelector((s: RootState) => s.auth.user);
  const isShelter = me?.accountType === 'shelter';
  const request = useSelector((s: RootState) =>
    s.shelterRequests.requests.find((r) => r.id === requestId),
  );
  const messages =
    useSelector((s: RootState) => s.shelterRequests.messages[requestId]) ?? NO_MESSAGES;
  const [loading, setLoading] = useState(true);
  const [dogDetailsOpen, setDogDetailsOpen] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const { show: showToast, element: toastElement } = useToast();
  const haveRequest = !!request;

  useEffect(() => {
    let alive = true;
    dispatch(setActiveRequest(requestId));
    dispatch(markDogRequestRead(requestId));
    dispatch(fetchDogRequestMessages(requestId)).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
      dispatch(setActiveRequest(null));
    };
  }, [requestId, dispatch]);

  // Opened by link (or before the list ever loaded): the header needs the dog and the other person.
  useEffect(() => {
    if (!haveRequest) {
      dispatch(fetchDogRequests());
    }
  }, [haveRequest, dispatch]);

  useChatRoom(requestId, (msg) => {
    dispatch(receiveDogRequestMessage(msg));
    if (msg.senderId !== me?.id) {
      dispatch(markDogRequestRead(requestId));
    }
  });
  const { remoteTyping, notifyTyping, notifyStoppedTyping } = useTypingIndicator(requestId);

  const dog = request?.dog;
  const other = isShelter ? request?.requester : request?.shelter;
  const title = dog ? (isShelter ? `${dog.name} · ${other?.displayName ?? ''}` : dog.name) : '';
  const subtitle = dog ? [dog.breed, `${dog.age}`].filter(Boolean).join(' · ') : '';

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ChatList');
    }
  };

  const showDetails = () => setDogDetailsOpen(true);

  // Only a shelter gets to look up the person on the other end — a requester talking to a shelter has no
  // comparable "is this shelter trustworthy" screen to open (out of scope here; see PersonProfileScreen).
  const viewPersonProfile =
    isShelter && other
      ? () =>
          navigation.navigate('PersonProfile', {
            userId: other.id,
            name: other.displayName,
            photoUrl: other.photoUrl,
          })
      : undefined;

  const send = async (content: string) => {
    if (!me) {
      return false;
    }
    const result = await dispatch(
      sendDogRequestMessage({ requestId, content, sender: { id: me.id, name: me.displayName } }),
    );
    return !sendDogRequestMessage.rejected.match(result);
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
        sendDogRequestMessage({
          requestId,
          content: url,
          type: 'image',
          sender: { id: me.id, name: me.displayName },
        }),
      );
      if (sendDogRequestMessage.rejected.match(result)) {
        showToast(t('chat.couldNotSendPhoto'), 'error');
      }
    } catch {
      showToast(t('chat.couldNotSendPhoto'), 'error');
    } finally {
      setSendingImage(false);
    }
  };

  return (
    <>
      <ThreadView
        kind="direct"
        title={title}
        subtitle={subtitle}
        avatarText={initials(dog?.name)}
        avatarShelter
        avatarLabel={dog?.name}
        onAvatarPress={dog ? showDetails : undefined}
        onTitlePress={viewPersonProfile}
        actionLabel={t('chat.dogRequest.details')}
        actionIcon="info"
        onAction={showDetails}
        onBack={goBack}
        messages={messages}
        myId={me?.id}
        loading={loading}
        emptyTitle={dog ? t('chat.dogRequest.sayHelloTo', { name: dog.name }) : ''}
        emptyBody={dog ? t('chat.dogRequest.emptyBody', { dog: dog.name }) : ''}
        onSend={send}
        onPickImage={pickAndSendImage}
        sendingImage={sendingImage}
        otherTyping={remoteTyping}
        onTyping={notifyTyping}
        onStoppedTyping={notifyStoppedTyping}
      />
      <DogDetailsCard
        visible={dogDetailsOpen}
        dog={dog ?? null}
        shelter
        onClose={() => setDogDetailsOpen(false)}
      />
      {toastElement}
    </>
  );
};
