import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Icon } from '../../components/Icon';
import { useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

/**
 * Onboarding header from the prototype: 44px back button (pulled 12px into the gutter), a 2px progress rule
 * (neutral-900 track, accent fill) and the "n of 3" step counter. Starts at y=54 on the design frame.
 */
export const StepHeader: React.FC<{ step: 1 | 2 | 3; onBack: () => void }> = ({ step, onBack }) => {
  const { top } = useScreenInsets();
  return (
    <View style={{ paddingTop: top - 2, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            { width: 44, height: 44, marginLeft: -12, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
            pressed && { backgroundColor: 'rgba(233,233,237,0.07)' },
          ]}
        >
          <Icon name={Platform.OS === 'ios' ? 'caret-left' : 'arrow-left'} size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, height: 2, marginLeft: 10, backgroundColor: Ramp.neutral[900] }}>
          <View style={{ width: step === 3 ? '100%' : step === 2 ? '66%' : '33%', height: 2, backgroundColor: Colors.primary }} />
        </View>
        <Text style={{ fontSize: 12, color: Ramp.neutral[500], marginLeft: 10 }}>{step} of 3</Text>
      </View>
    </View>
  );
};
