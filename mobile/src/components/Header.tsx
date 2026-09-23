import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ViewStyle } from 'react-native';
import { Colors, Spacing, ZIndex } from '../utils/theme';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: { label: string; onPress: () => void } | React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
}

const isRightActionButton = (
  ra: { label: string; onPress: () => void } | React.ReactNode,
): ra is { label: string; onPress: () => void } =>
  typeof ra === 'object' && ra !== null && 'label' in (ra as object) && 'onPress' in (ra as object);

// Nocturne: left-aligned, flush-left title on the ground colour, no rule under it.
export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction, transparent, style }) => (
  <SafeAreaView style={[styles.safeArea, transparent && styles.transparent, style]}>
    <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
    <View style={styles.row}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>
        {rightAction && isRightActionButton(rightAction) ? (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          </TouchableOpacity>
        ) : (
          rightAction
        )}
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { backgroundColor: Colors.backgroundDark, zIndex: ZIndex.header },
  transparent: { backgroundColor: 'transparent' },
  row: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md },
  backButton: { width: 32, height: 40, justifyContent: 'center', marginRight: Spacing.xs },
  title: { flex: 1, fontSize: 20, fontWeight: '500', color: Colors.textPrimary, letterSpacing: -0.3 },
  right: { minWidth: 32, alignItems: 'flex-end' },
  rightLabel: { fontSize: 14, fontWeight: '500', color: Colors.primary },
});
