import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Ramp } from '../utils/theme';
import { cssLine } from '../ui/cssLine';
import { Icon } from './Icon';
import { reportsApi, ReportReason, ReportTargetType } from '../services/api';

const REASONS: ReportReason[] = [
  'harassment',
  'spam',
  'fake_profile',
  'inappropriate_content',
  'safety_concern',
  'other',
];
const DIVIDER = 'rgba(233,233,237,0.16)';

/**
 * A bottom-sheet-style report form: pick a reason, optionally add details, submit to POST /reports.
 * Reusable across any reportable target (user, dog, walk, event, message) — only PersonProfileScreen wires
 * it up today, for the "user" target type.
 */
export const ReportDialog: React.FC<{
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  subjectName: string;
  onClose: () => void;
  onSubmitted: (success: boolean) => void;
}> = ({ visible, targetType, targetId, subjectName, onClose, onSubmitted }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setReason(null);
    setDetails('');
    setSubmitting(false);
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const submit = async () => {
    if (!reason || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await reportsApi.create(targetType, targetId, reason, details.trim() || undefined);
      onSubmitted(true);
    } catch {
      onSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(41,43,49,0.6)',
          justifyContent: 'center',
          padding: 24,
          opacity: anim,
        }}
      >
        <Animated.View
          style={{
            padding: 18,
            borderRadius: 14,
            backgroundColor: Colors.surfaceDark,
            rowGap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.65,
            shadowRadius: 20,
            elevation: 24,
            transform: [
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
            ],
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -1,
              left: -1,
              right: -1,
              bottom: -1,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: Ramp.neutral[500],
            }}
          />
          <Text
            accessibilityRole="header"
            style={{ fontSize: 19, lineHeight: cssLine(19), fontWeight: '500' }}
          >
            {t('report.title', { name: subjectName })}
          </Text>
          <Text style={{ fontSize: 13, lineHeight: cssLine(13), color: Ramp.neutral[400] }}>
            {t('report.reasonPrompt')}
          </Text>

          <View style={{ rowGap: 2 }}>
            {REASONS.map((r) => {
              const selected = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: 10,
                    paddingVertical: 10,
                    backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
                  })}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: selected ? Colors.primary : Ramp.neutral[500],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected && (
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 4.5,
                          backgroundColor: Colors.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: cssLine(14),
                      color: Colors.textPrimary,
                      flex: 1,
                    }}
                  >
                    {t(`report.reasons.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={t('report.detailsPlaceholder')}
            placeholderTextColor={Ramp.neutral[600]}
            multiline
            maxLength={1000}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
            style={{
              minHeight: 60,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: DIVIDER,
              padding: 10,
              fontSize: 14,
              color: Colors.textPrimary,
              textAlignVertical: 'top',
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', columnGap: 8 }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 42,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: DIVIDER,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
              })}
            >
              <Text style={{ fontSize: 14, lineHeight: cssLine(14), color: Colors.textPrimary }}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!reason || submitting}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 42,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: Colors.error,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                columnGap: 6,
                backgroundColor: pressed ? 'rgba(224,131,127,0.12)' : 'transparent',
                opacity: !reason || submitting ? 0.5 : 1,
              })}
            >
              <Icon name="warning" size={14} color={Colors.error} />
              <Text style={{ fontSize: 14, lineHeight: cssLine(14), color: Colors.error }}>
                {t('report.submit')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
