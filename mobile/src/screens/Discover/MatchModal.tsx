import React from 'react';
import { View, Text, Modal, Pressable, Image } from 'react-native';
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
  const { bottom } = useScreenInsets();
  const dist = formatDistance(other?.distanceKm);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(22,24,38,0.92)', justifyContent: 'flex-end', paddingHorizontal: 28, paddingBottom: bottom + 26, rowGap: 14 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <RingAvatar name={me?.displayName} photoUrl={me?.photoUrl} bg={Ramp.accent[800]} fg={Ramp.accent[200]} />
          <RingAvatar name={other?.displayName} photoUrl={other?.photoUrl} bg={Ramp.neutral[800]} fg={Colors.textPrimary} overlap />
        </View>
        <Text style={{ fontSize: 11, letterSpacing: 1.32, color: Ramp.accent[300] }}>IT'S A MATCH</Text>
        <Text style={{ fontSize: 32, lineHeight: 34.56, fontWeight: '500', letterSpacing: -0.64 }}>
          You and {firstName(other?.displayName)} both want to walk.
        </Text>
        <Text style={{ fontSize: 14, color: Ramp.neutral[400], marginBottom: 12 }}>
          {`${myDogName || 'Your dog'} and ${theirDogName || 'their dog'} are ${dist ? `${dist} apart` : 'close by'}. Say hello and pick a park.`}
        </Text>
        <Btn label="Send a message" shape="pill" height={52} fontSize={16} onPress={onMessage} />
        <Pressable onPress={onClose} style={({ pressed }) => ({ height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>Keep browsing</Text>
        </Pressable>
      </View>
    </Modal>
  );
};
