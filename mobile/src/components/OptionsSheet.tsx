import React from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { Colors } from '../utils/theme';
import { cssLine } from '../ui/cssLine';
import { Icon, IconName } from './Icon';

export interface OptionRow {
  key: string;
  icon: IconName;
  label: string;
  tone?: 'default' | 'danger';
  onPress: () => void;
}

/** A bottom sheet of tappable rows (report / block / unmatch, ...), sliding up over a scrim. Used from
 * PersonProfileScreen's and DirectMessageScreen's header "more" affordance. */
export const OptionsSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  options: OptionRow[];
}> = ({ visible, onClose, options }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, backgroundColor: 'rgba(41,43,49,0.6)', justifyContent: 'flex-end' }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: Colors.surfaceDark,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 8,
          paddingBottom: 24,
          paddingHorizontal: 8,
        }}
      >
        {options.map((opt) => {
          const danger = opt.tone === 'danger';
          return (
            <Pressable
              key={opt.key}
              onPress={opt.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 12,
                paddingVertical: 14,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: pressed
                  ? danger
                    ? 'rgba(224,131,127,0.12)'
                    : 'rgba(233,233,237,0.07)'
                  : 'transparent',
              })}
            >
              <Icon name={opt.icon} size={18} color={danger ? Colors.error : Colors.textPrimary} />
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: cssLine(14),
                  color: danger ? Colors.error : Colors.textPrimary,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </Pressable>
    </Pressable>
  </Modal>
);
