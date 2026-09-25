import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from '../../store/slices/notificationsSlice';
import { formatNotification, notificationIcon } from '../../utils/notificationCopy';
import { chatTime } from '../Matches/ChatListScreen';
import { Icon } from '../../components/Icon';
import { EmptyState } from '../../components/EmptyState';
import { useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';
const HOVER = 'rgba(233,233,237,0.04)';

/** Profile > bell icon — the in-app notification center: every notification the server persisted for this
 * user (see server/src/modules/notifications), independent of whether push ever reaches the device. */
export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const { items, unreadCount, loading } = useSelector((s: RootState) => s.notifications);
  const now = new Date();

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch]),
  );

  const open = (n: AppNotification) => {
    if (!n.read) dispatch(markNotificationRead(n.id));
    const target = n.data?.target;
    if (target) navigation.navigate(target.tab, { screen: target.screen, params: target.params, initial: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: top, paddingRight: 12, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? HOVER : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <Pressable onPress={() => dispatch(markAllNotificationsRead())} style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ fontSize: 13, color: Ramp.accent[300] }}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => navigation.navigate('NotificationSettings')}
          accessibilityLabel={t('notifications.settingsCta')}
          style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? HOVER : 'transparent' })}
        >
          <Icon name="gear" size={19} color={Ramp.neutral[300]} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 6, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((n) => {
          const { title, body } = formatNotification(t, n);
          return (
            <Pressable
              key={n.id}
              onPress={() => open(n)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'flex-start', columnGap: 12, paddingVertical: 12, paddingHorizontal: 20,
                backgroundColor: pressed ? HOVER : n.read ? 'transparent' : 'rgba(145,132,217,0.06)',
              })}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Ramp.accent[900], alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={notificationIcon(n.type)} size={18} color={Ramp.accent[300]} />
              </View>
              <View style={{ flex: 1, minWidth: 0, marginTop: -1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', flexShrink: 1 }} numberOfLines={1}>{title}</Text>
                  <Text style={{ fontSize: 11, flexShrink: 0, color: Ramp.neutral[500] }} numberOfLines={1}>{chatTime(t, n.createdAt, now)}</Text>
                </View>
                <Text style={{ fontSize: 13, color: Ramp.neutral[400], marginTop: 2 }} numberOfLines={2}>{body}</Text>
              </View>
              {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 }} />}
            </Pressable>
          );
        })}

        {!loading && items.length === 0 && (
          <EmptyState icon="bell" title={t('notifications.emptyTitle')} subtitle={t('notifications.emptySubtitle')} />
        )}
      </ScrollView>
    </View>
  );
};
