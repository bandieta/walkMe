import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { blocksApi } from '../../services/api';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { ProfileAvatar } from './ProfileAvatar';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

interface BlockedUser {
  id: string;
  displayName: string;
  photoUrl?: string;
  blockedAt: string;
}

/** Profile → Privacy & safety → Blocked users: lists everyone the current user has blocked, with a one-tap unblock. */
export const BlockedUsersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<BlockedUser[] | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const { show: showToast, element: toastElement } = useToast();

  useEffect(() => {
    let alive = true;
    blocksApi
      .list()
      .then((res) => alive && setUsers(res.data as BlockedUser[]))
      .catch(() => alive && setUsers([]));
    return () => {
      alive = false;
    };
  }, []);

  const unblock = async (u: BlockedUser) => {
    setUnblockingId(u.id);
    try {
      await blocksApi.unblock(u.id);
      setUsers((cur) => (cur ?? []).filter((x) => x.id !== u.id));
      showToast(t('blockedUsers.unblocked', { name: u.displayName }));
    } catch {
      showToast(t('blockedUsers.couldNotUnblock'), 'error');
    } finally {
      setUnblockingId(null);
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
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('blockedUsers.title')}</Text>
      </View>

      {users === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : users.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}
        >
          <Text style={{ fontSize: 14, color: Ramp.neutral[400], textAlign: 'center' }}>
            {t('blockedUsers.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 24,
            rowGap: 10,
          }}
        >
          {users.map((u) => (
            <View
              key={u.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 12,
                padding: 12,
                borderRadius: 12,
                backgroundColor: Colors.surfaceDark,
              }}
            >
              <ProfileAvatar name={u.displayName} photoUrl={u.photoUrl} size={44} />
              <Text style={{ fontSize: 14, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                {u.displayName}
              </Text>
              <Pressable
                onPress={() => unblock(u)}
                disabled={unblockingId === u.id}
                style={({ pressed }) => ({
                  height: 36,
                  paddingHorizontal: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(233,233,237,0.16)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent',
                  opacity: unblockingId === u.id ? 0.5 : 1,
                })}
              >
                <Text style={{ fontSize: 13, color: Colors.textPrimary }}>
                  {t('blockedUsers.unblock')}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {toastElement}
    </View>
  );
};
