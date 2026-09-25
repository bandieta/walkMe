import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import { fetchMyDogs, deleteDog } from '../../store/slices/dogsSlice';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Placeholder, Tag } from '../../ui';
import { resolveMediaUrl } from '../../utils/media';
import { ageGroupFromAge, energyLabel, temperamentLabel } from '../../utils/dogLabels';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

export const MyDogsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { dogs } = useSelector((s: RootState) => s.dogs);
  const { show: showToast, element: toastElement } = useToast();
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { dispatch(fetchMyDogs()); }, [dispatch]);

  const canRemove = dogs.length > 1;

  const confirmRemove = async () => {
    if (!pending) return;
    const { id, name } = pending;
    setPending(null);
    const res: any = await dispatch(deleteDog(id));
    if (deleteDog.fulfilled.match(res)) showToast(t('dogs.myDogs.removed', { name }));
    else showToast(String(res.payload ?? t('dogs.myDogs.couldNotRemove')), 'error');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: 52, paddingRight: 16, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>{t('dogs.myDogs.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24, rowGap: 10 }}>
        {dogs.map((d) => {
          const age = ageGroupFromAge(t, d.age, d.ageGroup);
          const energy = energyLabel(t, d.energy ?? 'Balanced');
          return (
            <Pressable
              key={d.id}
              onPress={() => navigation.navigate('EditDog', { dogId: d.id })}
              accessibilityLabel={t('dogs.myDogs.editNamed', { name: d.name })}
              style={({ pressed }) => [
                { flexDirection: 'row', columnGap: 14, padding: 12, borderRadius: 12, backgroundColor: Colors.surfaceDark },
                pressed && { backgroundColor: '#282a38' },
              ]}
            >
              {d.photoUrl ? (
                <Image source={{ uri: resolveMediaUrl(d.photoUrl) }} style={{ width: 76, height: 76, borderRadius: 10, backgroundColor: '#1f2130' }} />
              ) : (
                <Placeholder style={{ width: 76, height: 76, borderRadius: 10 }} />
              )}
              <View style={{ flex: 1, minWidth: 0, rowGap: 6 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '500' }}>{d.name}</Text>
                  <Text style={{ fontSize: 12, color: Ramp.neutral[400] }}>{t('dogs.myDogs.breedAgeEnergy', { breed: d.breed, age, energy })}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, rowGap: 4 }}>
                  {(d.personality ?? []).slice(0, 3).map((tag) => (
                    <Tag key={tag} label={temperamentLabel(t, tag)} tone="neutral" paddingV={2} paddingH={8} />
                  ))}
                </View>
                {!!d.bio && <Text style={{ fontSize: 13, lineHeight: 18.2, color: Ramp.neutral[300] }}>{d.bio}</Text>}
              </View>
              <View style={{ rowGap: 4 }}>
                <Pressable
                  onPress={() => navigation.navigate('EditDog', { dogId: d.id })}
                  accessibilityLabel={t('dogs.myDogs.editNamed', { name: d.name })}
                  style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
                >
                  <Icon name="edit" size={16} color={Ramp.neutral[500]} />
                </Pressable>
                <Pressable
                  disabled={!canRemove}
                  onPress={() => setPending({ id: d.id, name: d.name })}
                  accessibilityLabel={t('common.remove')}
                  style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: canRemove ? 1 : 0.3, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
                >
                  <Icon name="trash" size={16} color={Ramp.neutral[500]} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => navigation.navigate('AddDog')}
          style={({ pressed }) => ({
            height: 52, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Ramp.neutral[700],
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 8,
            backgroundColor: pressed ? 'rgba(233,233,237,0.05)' : 'transparent',
          })}
        >
          <Icon name="plus" size={14} color={Ramp.neutral[300]} />
          <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>{t('profile.dogs.addDog')}</Text>
        </Pressable>
      </ScrollView>

      {toastElement}
      <ConfirmDialog
        visible={!!pending}
        title={t('dogs.myDogs.removeTitle', { name: pending?.name ?? '' })}
        message={t('dogs.myDogs.removeMessage')}
        confirmLabel={t('common.remove')}
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPending(null)}
      />
    </View>
  );
};
