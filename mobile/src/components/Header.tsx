import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, ZIndex } from '../utils/theme';

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

export const Header: React.FC<HeaderProps> = ({ title, onBack, rightAction, transparent, style }) => {
  return (
    <SafeAreaView style={[styles.safeArea, transparent && styles.transparent, style]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSlot} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.sideSlot}>
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
};

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.surface,
    zIndex: ZIndex.header,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: '300',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sideSlot: { width: 40, alignItems: 'flex-end' },
  rightLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
