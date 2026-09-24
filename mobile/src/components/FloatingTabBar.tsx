import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Animated, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Icon, IconName } from './Icon';
import { Colors, Ramp } from '../utils/theme';

// Nocturne's tab bar floats: a 62px pill, 24px from the sides and 28px from the bottom, with the create action
// as an outlined accent circle in the middle. It only shows on the four root screens.
const ROOTS = [undefined, 'MapHome', 'DiscoverHome', 'ChatList', 'ProfileHome'];
const TABS: Record<string, { label: string; icon: IconName; side: 'L' | 'R' }> = {
  MapTab: { label: 'Map', icon: 'map-trifold', side: 'L' },
  DiscoverTab: { label: 'Discover', icon: 'paw-print', side: 'L' },
  ChatTab: { label: 'Chat', icon: 'chat-circle', side: 'R' },
  ProfileTab: { label: 'Me', icon: 'user', side: 'R' },
};

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const [sheet, setSheet] = useState(false);
  const unread = useSelector((s: RootState) => s.matches.matches.reduce((n: number, m: any) => n + (m.unread ?? 0), 0));
  const focused = state.routes[state.index];
  const nested = getFocusedRouteNameFromRoute(focused);
  if (nested && !ROOTS.includes(nested)) return null;

  const item = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName)!;
    const meta = TABS[routeName];
    const active = focused.name === routeName;
    const color = active ? Colors.primary : Ramp.neutral[500];
    return (
      <Pressable
        key={routeName}
        accessibilityLabel={meta.label}
        onPress={() => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !e.defaultPrevented) navigation.navigate(route.name);
        }}
        style={styles.item}
      >
        <Icon name={meta.icon} size={22} color={color} weight={active && (routeName === 'MapTab' || routeName === 'ProfileTab') ? 'fill' : 'regular'} />
        <Text style={{ fontSize: 9, color, marginTop: 2 }}>{meta.label}</Text>
        {routeName === 'ChatTab' && unread > 0 && <View style={styles.dot} />}
      </Pressable>
    );
  };

  const go = (screen: 'CreateWalk' | 'CreateEvent') => {
    setSheet(false);
    (navigation as any).navigate('MapTab', { screen });
  };

  return (
    <>
      <View pointerEvents="box-none" style={styles.wrap}>
        <View style={styles.ring}>
          <View style={styles.bar}>
            {item('MapTab')}
            {item('DiscoverTab')}
            <Pressable
              accessibilityLabel="Create"
              onPress={() => setSheet(true)}
              style={({ pressed }) => [styles.plus, pressed && { backgroundColor: 'rgba(145,132,217,0.22)' }]}
            >
              <Icon name="plus" size={21} color={Colors.primary} />
            </Pressable>
            {item('ChatTab')}
            {item('ProfileTab')}
          </View>
        </View>
      </View>
      <CreateSheet visible={sheet} onClose={() => setSheet(false)} onPick={go} />
    </>
  );
};

const CreateSheet: React.FC<{ visible: boolean; onClose: () => void; onPick: (s: 'CreateWalk' | 'CreateEvent') => void }> = ({ visible, onClose, onPick }) => {
  const row = (icon: IconName, title: string, sub: string, accent: boolean, onPress: () => void) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: 'rgba(233,233,237,0.05)' }]}>
      <View style={[styles.sheetIcon, { borderColor: accent ? Colors.primary : 'rgba(233,233,237,0.16)' }]}>
        <Icon name={icon} size={20} color={accent ? Colors.primary : Ramp.neutral[200]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15 }}>{title}</Text>
        <Text style={{ fontSize: 12, color: Ramp.neutral[400] }}>{sub}</Text>
      </View>
      <Icon name="caret-right" size={16} color={Ramp.neutral[500]} />
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet} pointerEvents="box-none">
        <View style={styles.sheetBody}>
          <View style={styles.grab} />
          <Text style={{ fontSize: 19, fontWeight: '500', paddingHorizontal: 8, paddingBottom: 6 }}>Create</Text>
          {row('path', 'New walk', 'Pick a place and time. Neighbours can join.', true, () => onPick('CreateWalk'))}
          {row('calendar-plus', 'New event', 'Meetups, playdates and competitions.', false, () => onPick('CreateEvent'))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 23, right: 23, bottom: 27, height: 64 },
  ring: {
    flex: 1, borderRadius: 32, backgroundColor: Ramp.neutral[700], padding: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 14, elevation: 12,
  },
  bar: { flex: 1, borderRadius: 31, backgroundColor: Colors.backgroundDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  item: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  plus: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(41,43,49,0.6)' },
  sheet: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheetBody: {
    paddingTop: 10, paddingHorizontal: 16, paddingBottom: 40, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: Colors.surfaceDark,
    borderWidth: 1, borderBottomWidth: 0, borderColor: Ramp.neutral[500],
  },
  grab: { width: 36, height: 4, borderRadius: 2, backgroundColor: Ramp.neutral[700], alignSelf: 'center', marginBottom: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, marginTop: 6 },
  sheetIcon: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
});
