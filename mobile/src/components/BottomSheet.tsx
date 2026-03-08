import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  Animated,
  PanResponder,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, ZIndex } from '../utils/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAG_DISMISS_THRESHOLD = 80;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapHeight?: number;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  snapHeight = SCREEN_HEIGHT * 0.5,
  children,
}) => {
  const translateY = useRef(new Animated.Value(snapHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: snapHeight, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 0,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DRAG_DISMISS_THRESHOLD || gs.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal transparent visible={visible} statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>
        <Animated.View
          style={[styles.sheet, { height: snapHeight, transform: [{ translateY }] }]}
        >
          <View style={styles.handleBar} {...panResponder.panHandlers} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: ZIndex.modal,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    ...Shadow.modal,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
