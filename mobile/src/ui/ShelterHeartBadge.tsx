import React from 'react';
import { View } from 'react-native';
import { Icon } from '../components/Icon';
import { Colors } from '../utils/theme';

/**
 * The design system's mark for "this dog belongs to a shelter, not a person": a filled heart with a small house
 * glyph centred on it. Used on a shelter dog's Discover card, on a connected shelter dog in a walker's profile,
 * and anywhere else a shelter dog needs to read as one at a glance (see dogLabels-style usage — badge, not text).
 */
export const ShelterHeartBadge: React.FC<{ size?: number; style?: object }> = ({ size = 28, style }) => (
  <View
    style={[
      { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
      style,
    ]}
  >
    <Icon name="heart" weight="fill" size={size} color={Colors.error} />
    <View style={{ position: 'absolute', top: size * 0.36 }}>
      <Icon name="house" weight="fill" size={size * 0.42} color={Colors.backgroundDark} />
    </View>
  </View>
);
