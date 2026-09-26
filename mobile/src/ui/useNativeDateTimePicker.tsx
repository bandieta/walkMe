import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Colors } from '../utils/theme';
import { cssLine } from './cssLine';

interface Options {
  mode: 'date' | 'time';
  value: Date;
  minimumDate?: Date;
  onPicked: (d: Date) => void;
}

const DIV = 'rgba(233,233,237,0.16)';

/**
 * Opens the platform's native date or time picker: Android shows its own dialog imperatively (no UI to render
 * here); iOS has no built-in dismiss for an inline spinner, so this renders a bottom sheet with Cancel/Done
 * around it. Call `open()` from a chip or button's `onPress`, and render the returned `node` once anywhere in
 * the screen (it's `null` on Android).
 */
export function useNativeDateTimePicker({ mode, value, minimumDate, onPicked }: Options) {
  const { t } = useTranslation();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        minimumDate,
        onChange: (_event, selected) => {
          if (selected) {
            onPicked(selected);
          }
        },
      });
    } else {
      setDraft(value);
      setIosOpen(true);
    }
  };

  const node =
    Platform.OS === 'ios' ? (
      <Modal
        visible={iosOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIosOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(41,43,49,0.6)', justifyContent: 'flex-end' }}
          onPress={() => setIosOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.surfaceDark,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingTop: 8,
              paddingBottom: 24,
              paddingHorizontal: 18,
              rowGap: 14,
            }}
          >
            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              themeVariant="dark"
              onChange={(_event, selected) => selected && setDraft(selected)}
              style={{ height: 180 }}
            />
            <View style={{ flexDirection: 'row', columnGap: 8 }}>
              <Pressable
                onPress={() => setIosOpen(false)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 21,
                  borderWidth: 1,
                  borderColor: DIV,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, lineHeight: cssLine(13), color: Colors.textPrimary }}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIosOpen(false);
                  onPicked(draft);
                }}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: Colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: cssLine(13),
                    color: '#161826',
                    fontWeight: '600',
                  }}
                >
                  {t('common.done')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    ) : null;

  return { open, node };
}
