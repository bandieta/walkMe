import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppDispatch } from '../../store';
import { logoutAndInvalidate } from '../../store/slices/authSlice';
import { usersApi } from '../../services/api';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { Hairline } from '../../ui';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

/** Profile → Privacy & safety: blocked-user management and account deletion (App Store / Play Store require the
 * latter be reachable in-app, not admin-only — see server's `DELETE /users/me`). */
export const PrivacySafetyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { show: showToast, element: toastElement } = useToast();

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.deleteAccount();
      setDeleteOpen(false);
      dispatch(logoutAndInvalidate());
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
      showToast(t('privacySafety.deleteAccount.failed'), 'error');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 4,
          paddingTop: 52,
          paddingRight: 16,
          paddingBottom: 4,
          paddingLeft: 8,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
          })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('privacySafety.title')}</Text>
      </View>

      <View style={{ paddingTop: 10, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => navigation.navigate('BlockedUsers')}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }}
        >
          <Icon name="shield" size={18} color={Ramp.neutral[400]} />
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, flex: 1, marginLeft: 12, color: Colors.textPrimary }}
          >
            {t('privacySafety.blockedUsers.label')}
          </Text>
          <Icon name="caret-right" size={14} color={Ramp.neutral[600]} />
          <Hairline style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
        </Pressable>
        <Pressable
          onPress={() => setDeleteOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 13 }}
        >
          <Icon name="trash" size={18} color={Colors.error} />
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, flex: 1, marginLeft: 12, color: Colors.error }}
          >
            {t('privacySafety.deleteAccount.label')}
          </Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={deleteOpen}
        tone="danger"
        title={t('privacySafety.deleteAccount.dialogTitle')}
        message={t('privacySafety.deleteAccount.dialogMessage')}
        confirmLabel={
          deleting
            ? t('common.loading', { defaultValue: '…' })
            : t('privacySafety.deleteAccount.confirm')
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      {toastElement}
    </View>
  );
};
