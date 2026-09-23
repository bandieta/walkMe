import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../utils/theme';
import { resolveMediaUrl } from '../utils/media';

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const SIZE_MAP = { xs: 24, sm: 32, md: 48, lg: 64, xl: 88 };
const FONT_MAP = { xs: 10, sm: 13, md: 18, lg: 24, xl: 34 };

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 'md', backgroundColor }) => {
  const [failed, setFailed] = useState(false);
  const source = resolveMediaUrl(uri);
  useEffect(() => setFailed(false), [source]);

  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const dim = SIZE_MAP[size];
  const fontSz = FONT_MAP[size];
  const bg = backgroundColor ?? Colors.primary;

  return (
    <View
      style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}
    >
      {source && !failed ? (
        <Image source={{ uri: source }} style={{ width: dim, height: dim }} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.text, { fontSize: fontSz }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: '#fff', fontWeight: '700' },
});
