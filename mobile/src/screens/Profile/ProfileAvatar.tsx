import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Ramp } from '../../utils/theme';
import { resolveMediaUrl } from '../../utils/media';
import { cssText } from '../../ui/cssLine';

export const initialsOf = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

/**
 * The prototype's 72px profile avatar: accent-800 disc with accent-200 initials (24px/500). `ring` adds the outer 1px
 * accent-700 ring (box-shadow 0 0 0 1px) the Profile screen draws; a real photo replaces the initials.
 */
export const ProfileAvatar: React.FC<{ name?: string; photoUrl?: string | null; size?: number; ring?: boolean }> = ({
  name, photoUrl, size = 72, ring,
}) => {
  const [failed, setFailed] = useState(false);
  const uri = resolveMediaUrl(photoUrl);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Ramp.accent[800], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {uri && !failed ? (
          <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} />
        ) : (
          <Text style={cssText(24, { fontWeight: '500', color: Ramp.accent[200] })}>{initialsOf(name)}</Text>
        )}
      </View>
      {ring && (
        <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: -1, width: size + 2, height: size + 2, borderRadius: (size + 2) / 2, borderWidth: 1, borderColor: Ramp.accent[700] }} />
      )}
    </View>
  );
};
