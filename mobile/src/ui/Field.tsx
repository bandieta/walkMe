import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Ramp } from '../utils/theme';

/** Labelled field from the prototype: 12px muted label, 44px surface box (radius 8), accent border while focused. */
export const Field: React.FC<{ label?: string; height?: number; style?: ViewStyle; right?: React.ReactNode } & TextInputProps> = ({
  label, height = 44, style, right, multiline, ...input
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {!!label && <Text style={{ fontSize: 12, color: Ramp.neutral[400], marginBottom: 5 }}>{label}</Text>}
      <View style={{
        minHeight: height, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
        borderColor: focused ? Colors.primary : 'rgba(233,233,237,0.16)', flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        paddingHorizontal: 12, paddingVertical: multiline ? 10 : 0,
      }}>
        <TextInput
          {...input}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          placeholderTextColor={Ramp.neutral[600]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          style={{ flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0, minHeight: multiline ? 70 : undefined }}
        />
        {right}
      </View>
    </View>
  );
};
