import React, { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';
import { Icon } from './Icon';
import { Colors, Ramp } from '../utils/theme';

const DIV = 'rgba(233,233,237,0.16)';

/**
 * A location text field that can also be filled by picking a spot on the map (PickLocationScreen). The two
 * sources never blend: once a map pick lands, the field locks (read-only, map-pin turns solid) so the saved
 * coordinates always match exactly what's shown — "Change" clears the lock and the coordinates together, handing
 * control back to free typing.
 */
export const LocationField: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  locked: boolean;
  onPickFromMap: () => void;
  onChangeMode: () => void;
  maxLength?: number;
}> = ({ label, value, onChangeText, placeholder, locked, onPickFromMap, onChangeMode, maxLength }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ rowGap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 12, color: Ramp.neutral[400], transform: [{ translateY: -1 }] }}>{label}</Text>
        {locked && (
          <Pressable onPress={onChangeMode} hitSlop={8}>
            <Text style={{ fontSize: 12, color: Colors.primary }}>Change</Text>
          </Pressable>
        )}
      </View>
      <View
        style={{
          height: 46, borderRadius: 8, backgroundColor: Colors.surfaceDark, borderWidth: 1,
          borderColor: focused ? Colors.primary : locked ? Ramp.accent[700] : DIV,
          paddingLeft: 36, paddingRight: 44, justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', left: 11, top: 14.5 }} pointerEvents="none">
          <Icon name="map-pin" size={17} color={locked ? Colors.primary : Ramp.neutral[500]} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Ramp.neutral[600]}
          selectionColor={Colors.primary}
          cursorColor={Colors.primary}
          editable={!locked}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ fontSize: 15, lineHeight: 18, height: 44, padding: 0, color: locked ? Ramp.neutral[300] : Colors.textPrimary }}
        />
        {!locked && (
          <Pressable
            onPress={onPickFromMap}
            accessibilityLabel="Pick on map"
            hitSlop={8}
            style={{ position: 'absolute', right: 6, top: 6, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="map" size={17} color={Ramp.neutral[400]} />
          </Pressable>
        )}
        {locked && (
          <View style={{ position: 'absolute', right: 12, top: 14.5 }} pointerEvents="none">
            <Icon name="check" size={17} color={Colors.primary} />
          </View>
        )}
      </View>
      {locked && (
        <Text style={{ fontSize: 11, color: Ramp.neutral[500] }}>Pinned on the map — location is exact.</Text>
      )}
    </View>
  );
};
