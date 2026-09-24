import React from 'react';
import { View, Text, Modal, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Btn, useScreenInsets } from '../../ui';
import { resolveMediaUrl } from '../../utils/media';
import { Colors, Ramp } from '../../utils/theme';
import { firstName, formatDistance, initials } from './DogCard';

/** One 96px avatar with the prototype's ring: 0 0 0 3px <bg>, 0 0 0 4px <accent>. */
const RingAvatar: React.FC<{ name?: string; photoUrl?: string; bg: string; fg: string; overlap?: boolean }> = ({ name, photoUrl, bg, fg, overlap }) => {
  const uri = resolveMediaUrl(photoUrl);
  return (
    <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginLeft: overlap ? -22 : 0 }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
      ) : (
        <Text style={{ fontSize: 28, fontWeight: '500', color: fg }}>{initials(name)}</Text>
      )}
      <View pointerEvents="none" style={{ position: 'absolute', top: -4, left: -4, width: 104, height: 104, borderRadius: 52, borderWidth: 1, borderColor: Colors.primary }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, width: 102, height: 102, borderRadius: 51, borderWidth: 3, borderColor: Colors.backgroundDark }} />
    </View>
  );
};

/** "It's a match": full-screen overlay shown after a mutual like. */
export const MatchModal: React.FC<{
  visible: boolean;
  me?: { displayName?: string; photoUrl?: string };
  other?: { displayName?: string; photoUrl?: string; distanceKm?: number };
  myDogName?: string;
  theirDogName?: string;
  onMessage: () => void;
  onClose: () => void;
}> = ({ visible, me, other, myDogName, theirDogName, onMessage, onClose }) => {
  const { t } = useTranslation();
  const { bottom } = useScreenInsets();
  const dist = formatDistance(other?.distanceKm);
  const body = dist
    ? t('discover.match.bodyApart', { myDog: myDogName || t('discover.match.defaultYourDog'), theirDog: theirDogName || t('discover.match.defaultTheirDog'), dist })
    : t('discover.match.bodyCloseBy', { myDog: myDogName || t('discover.match.defaultYourDog'), theirDog: theirDogName || t('discover.match.defaultTheirDog') });
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(22,24,38,0.92)', justifyContent: 'flex-end', paddingHorizontal: 28, paddingBottom: bottom + 26, rowGap: 14 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <RingAvatar name={me?.displayName} photoUrl={me?.photoUrl} bg={Ramp.accent[800]} fg={Ramp.accent[200]} />
          <RingAvatar name={other?.displayName} photoUrl={other?.photoUrl} bg={Ramp.neutral[800]} fg={Colors.textPrimary} overlap />
        </View>
        <Text style={{ fontSize: 11, letterSpacing: 1.32, color: Ramp.accent[300] }}>{t('discover.match.itsAMatch')}</Text>
        <Text style={{ fontSize: 32, lineHeight: 34.56, fontWeight: '500', letterSpacing: -0.64 }}>
          {t('discover.match.title', { name: firstName(other?.displayName) })}
        </Text>
        <Text style={{ fontSize: 14, color: Ramp.neutral[400], marginBottom: 12 }}>
          {body}
        </Text>
        <Btn label={t('discover.match.sendMessage')} shape="pill" height={52} fontSize={16} onPress={onMessage} />
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>{t('discover.match.keepBrowsing')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
};
