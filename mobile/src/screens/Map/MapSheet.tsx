import React, { useRef } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/Icon';
import { Hairline } from '../../ui';
import { Colors, Ramp } from '../../utils/theme';
import type { MapItem, Segment } from './mapFormat';

const DIV = 'rgba(233,233,237,0.16)';
const SEGMENTS: { key: Segment; labelKey: string }[] = [
  { key: 'walks', labelKey: 'map.segments.walks' },
  { key: 'events', labelKey: 'map.segments.events' },
  { key: 'places', labelKey: 'map.segments.places' },
];

/** The prototype's segmented control: 38px, divider frame (radius 8), no inner dividers; the active one gets an accent ring. */
const SegmentBar: React.FC<{ value: Segment; onChange: (s: Segment) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, height: 38, borderWidth: 1, borderColor: DIV, borderRadius: 8, overflow: 'hidden' }}>
      {SEGMENTS.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {on && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: Colors.primary }} />}
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ fontSize: 13, color: on ? Colors.primary : Colors.textPrimary, paddingHorizontal: 2 }}>
              {t(o.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const Row: React.FC<{ item: MapItem }> = ({ item }) => (
  <Pressable
    onPress={item.act}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', columnGap: 12, paddingVertical: 11, backgroundColor: pressed ? 'rgba(233,233,237,0.05)' : 'transparent' })}
  >
    <View
      style={{
        width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: item.live ? Ramp.accent[900] : Ramp.neutral[900],
      }}
    >
      <Icon name={item.icon} size={18} color={item.live ? Ramp.accent[300] : Ramp.neutral[400]} />
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ fontSize: 14 }}>{item.title}</Text>
      <Text style={{ fontSize: 12, color: item.live ? Ramp.accent[300] : Ramp.neutral[500] }}>{item.sub}</Text>
    </View>
    <Icon name="caret-right" size={15} color={Ramp.neutral[500]} />
    <Hairline style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />
  </Pressable>
);

/**
 * Bottom sheet of the map home. Height is driven by the parent's Animated value (300 collapsed, 600 expanded);
 * the handle toggles on tap and follows the finger on drag, settling on release.
 */
export const MapSheet: React.FC<{
  height: Animated.Value; min: number; max: number; open: boolean; onSettle: (open: boolean) => void;
  segment: Segment; onSegment: (s: Segment) => void; items: MapItem[]; loading: boolean;
}> = ({ height, min, max, open, onSettle, segment, onSegment, items, loading }) => {
  const { t } = useTranslation();
  const live = useRef({ open, min, max, onSettle });
  live.current = { open, min, max, onSettle };
  const start = useRef(min);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = live.current.open ? live.current.max : live.current.min;
        height.stopAnimation((v) => { start.current = v; });
      },
      onPanResponderMove: (_, g) => {
        const { min: lo, max: hi } = live.current;
        height.setValue(Math.max(lo, Math.min(hi, start.current - g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        const { open: isOpen, min: lo, max: hi, onSettle: settle } = live.current;
        if (Math.abs(g.dy) < 6 && Math.abs(g.dx) < 6) return settle(!isOpen);
        const current = Math.max(lo, Math.min(hi, start.current - g.dy));
        if (g.vy < -0.3) return settle(true);
        if (g.vy > 0.3) return settle(false);
        return settle(current > (lo + hi) / 2);
      },
      onPanResponderTerminate: () => live.current.onSettle(live.current.open),
    }),
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height,
        backgroundColor: Colors.surfaceDark, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.4, shadowRadius: 15,
      }}
    >
      {/* box-shadow: 0 0 0 1px #3f424d — a ring just outside the sheet */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderTopLeftRadius: 23, borderTopRightRadius: 23,
          borderWidth: 1, borderColor: Ramp.neutral[800],
        }}
      />
      <View {...pan.panHandlers} accessibilityRole="button" accessibilityLabel={open ? t('common.collapse') : t('common.expand')} style={{ height: 26, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: Ramp.neutral[700] }} />
      </View>
      <SegmentBar value={segment} onChange={onSegment} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {items.map((it) => <Row key={it.id} item={it} />)}
        {items.length === 0 && (
          loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 28 }} />
          ) : (
            <Text style={{ paddingVertical: 28, fontSize: 13, color: Ramp.neutral[500] }}>{t('map.nothingMatches')}</Text>
          )
        )}
      </ScrollView>
    </Animated.View>
  );
};
