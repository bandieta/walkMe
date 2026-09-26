import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Segmented, Toggle, Btn } from '../../ui';
import { cssText } from '../../ui/cssLine';
import { Colors, Ramp } from '../../utils/theme';
import { energyLabel, ageGroupLabel } from '../../utils/dogLabels';
import type { DeckFilters } from '../../store/slices/matchesSlice';

const ANY = '__any__';
type EnergyChoice = typeof ANY | 'Calm' | 'Balanced' | 'High';
type AgeChoice = typeof ANY | 'Puppy' | 'Adult' | 'Senior';
const DISTANCES = [2, 5, 10, 20];

/** Discover's filter panel — energy, age group, distance and "shelter dogs only" — reached from the sliders
 * icon in DiscoverScreen's header (that button used to open the walking-rhythm settings screen instead; this
 * takes over that spot since a per-session Discover filter is what people actually reach for there). */
export const DiscoverFiltersSheet: React.FC<{
  visible: boolean;
  filters: DeckFilters;
  defaultRadiusKm: number;
  onClose: () => void;
  onApply: (filters: DeckFilters) => void;
}> = ({ visible, filters, defaultRadiusKm, onClose, onApply }) => {
  const { t } = useTranslation();
  const [energy, setEnergy] = useState<EnergyChoice>((filters.energy as EnergyChoice) ?? ANY);
  const [ageGroup, setAgeGroup] = useState<AgeChoice>((filters.ageGroup as AgeChoice) ?? ANY);
  const [radiusKm, setRadiusKm] = useState(filters.radiusKm ?? defaultRadiusKm);
  const [shelterOnly, setShelterOnly] = useState(!!filters.shelterOnly);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setEnergy((filters.energy as EnergyChoice) ?? ANY);
    setAgeGroup((filters.ageGroup as AgeChoice) ?? ANY);
    setRadiusKm(filters.radiusKm ?? defaultRadiusKm);
    setShelterOnly(!!filters.shelterOnly);
  }, [visible, filters, defaultRadiusKm]);

  const apply = () => {
    onApply({
      ...(energy !== ANY ? { energy } : {}),
      ...(ageGroup !== ANY ? { ageGroup } : {}),
      ...(radiusKm !== defaultRadiusKm ? { radiusKm } : {}),
      ...(shelterOnly ? { shelterOnly: true } : {}),
    });
  };

  const clear = () => {
    setEnergy(ANY);
    setAgeGroup(ANY);
    setRadiusKm(defaultRadiusKm);
    setShelterOnly(false);
    onApply({});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(41,43,49,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: Colors.surfaceDark,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            rowGap: 18,
          }}
        >
          <Text style={cssText(17, { fontWeight: '500' })}>{t('discover.filters.title')}</Text>

          <View style={{ rowGap: 8 }}>
            <Text style={cssText(12, { color: Ramp.neutral[500] })}>
              {t('discover.filters.energy')}
            </Text>
            <Segmented
              options={[
                { key: ANY, label: t('discover.filters.any') },
                { key: 'Calm', label: energyLabel(t, 'Calm') },
                { key: 'Balanced', label: energyLabel(t, 'Balanced') },
                { key: 'High', label: energyLabel(t, 'High') },
              ]}
              value={energy}
              onChange={setEnergy}
              height={40}
            />
          </View>

          <View style={{ rowGap: 8 }}>
            <Text style={cssText(12, { color: Ramp.neutral[500] })}>
              {t('discover.filters.ageGroup')}
            </Text>
            <Segmented
              options={[
                { key: ANY, label: t('discover.filters.any') },
                { key: 'Puppy', label: ageGroupLabel(t, 'Puppy') },
                { key: 'Adult', label: ageGroupLabel(t, 'Adult') },
                { key: 'Senior', label: ageGroupLabel(t, 'Senior') },
              ]}
              value={ageGroup}
              onChange={setAgeGroup}
              height={40}
            />
          </View>

          <View style={{ rowGap: 8 }}>
            <Text style={cssText(12, { color: Ramp.neutral[500] })}>
              {t('discover.filters.distance')}
            </Text>
            <Segmented
              options={DISTANCES.map((km) => ({ key: String(km), label: `${km} km` }))}
              value={String(radiusKm)}
              onChange={(v) => setRadiusKm(Number(v))}
              height={40}
            />
          </View>

          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={cssText(14)}>{t('discover.filters.shelterOnly')}</Text>
            <Toggle
              value={shelterOnly}
              onValueChange={setShelterOnly}
              accessibilityLabel={t('discover.filters.shelterOnly')}
            />
          </View>

          <View style={{ flexDirection: 'row', columnGap: 8, marginTop: 4 }}>
            <Btn
              label={t('discover.filters.clear')}
              variant="neutral"
              onPress={clear}
              style={{ flex: 1 }}
            />
            <Btn label={t('discover.filters.apply')} onPress={apply} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
