import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import { fetchNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '../../store/slices/notificationsSlice';
import { NotificationCategory } from '../../services/api';
import { Icon, IconName } from '../../components/Icon';
import { Toggle, Hairline, useScreenInsets } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

const CATEGORY_ICONS: Record<NotificationCategory, IconName> = {
  matches: 'heart',
  messages: 'chat-circle',
  walks: 'path',
  events: 'calendar-plus',
  shelterRequests: 'house',
  nearby: 'map-pin',
};

/** Profile > Account > Notifications (also reachable from the notification center's gear icon). Every category
 * defaults to on; turning one off tells the server to stop creating that kind of notification entirely, not
 * just to hide it here — see notifications/service.ts's `notify()`. */
export const NotificationSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { top } = useScreenInsets();
  const preferences = useSelector((s: RootState) => s.notifications.preferences);

  useEffect(() => {
    dispatch(fetchNotificationPreferences());
  }, [dispatch]);

  const rows: { key: NotificationCategory; label: string; desc: string }[] = [
    { key: 'matches', label: t('notifications.settings.matches.label'), desc: t('notifications.settings.matches.desc') },
    { key: 'messages', label: t('notifications.settings.messages.label'), desc: t('notifications.settings.messages.desc') },
    { key: 'walks', label: t('notifications.settings.walks.label'), desc: t('notifications.settings.walks.desc') },
    { key: 'events', label: t('notifications.settings.events.label'), desc: t('notifications.settings.events.desc') },
    { key: 'shelterRequests', label: t('notifications.settings.shelterRequests.label'), desc: t('notifications.settings.shelterRequests.desc') },
    { key: 'nearby', label: t('notifications.settings.nearby.label'), desc: t('notifications.settings.nearby.desc') },
  ];

  const toggle = (key: NotificationCategory, value: boolean) => {
    dispatch(updateNotificationPreferences({ [key]: value } as Partial<NotificationPreferences>));
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: top, paddingRight: 16, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('notifications.settings.title')}</Text>
      </View>
      <Text style={{ fontSize: 13, color: Ramp.neutral[400], paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 }}>
        {t('notifications.settings.subtitle')}
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {rows.map((r) => (
          <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 14 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: Ramp.accent[900], alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={CATEGORY_ICONS[r.key]} size={16} color={Ramp.accent[300]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14 }}>{r.label}</Text>
              <Text style={{ fontSize: 12, color: Ramp.neutral[500] }}>{r.desc}</Text>
            </View>
            <Toggle value={preferences[r.key]} onValueChange={(v) => toggle(r.key, v)} accessibilityLabel={r.label} />
            <Hairline style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
