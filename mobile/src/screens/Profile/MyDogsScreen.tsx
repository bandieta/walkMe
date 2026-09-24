import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchMyDogs, deleteDog } from '../../store/slices/dogsSlice';
import { Colors, Ramp } from '../../utils/theme';
import { Icon } from '../../components/Icon';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Placeholder, Tag } from '../../ui';
import { resolveMediaUrl } from '../../utils/media';

const backIcon = Platform.OS === 'ios' ? 'caret-left' : 'arrow-left';

export const MyDogsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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
    if (deleteDog.fulfilled.match(res)) showToast(`${name} removed`);
    else showToast(String(res.payload ?? 'Could not remove dog'), 'error');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, paddingTop: 52, paddingRight: 16, paddingBottom: 4, paddingLeft: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
        >
          <Icon name={backIcon} size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '500', flex: 1 }}>My dogs</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24, rowGap: 10 }}>
        {dogs.map((d) => {
          const age = d.ageGroup ?? (d.age < 1 ? 'Puppy' : d.age > 8 ? 'Senior' : 'Adult');
          const energy = d.energy ?? 'Balanced';
          return (
            <View key={d.id} style={{ flexDirection: 'row', columnGap: 14, padding: 12, borderRadius: 12, backgroundColor: Colors.surfaceDark }}>
              {d.photoUrl ? (
                <Image source={{ uri: resolveMediaUrl(d.photoUrl) }} style={{ width: 76, height: 76, borderRadius: 10, backgroundColor: '#1f2130' }} />
              ) : (
                <Placeholder style={{ width: 76, height: 76, borderRadius: 10 }} />
              )}
              <View style={{ flex: 1, minWidth: 0, rowGap: 6 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '500' }}>{d.name}</Text>
                  <Text style={{ fontSize: 12, color: Ramp.neutral[400] }}>{d.breed} · {age} · {energy} energy</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, rowGap: 4 }}>
                  {(d.personality ?? []).slice(0, 3).map((t) => (
                    <Tag key={t} label={t} tone="neutral" paddingV={2} paddingH={8} />
                  ))}
                </View>
              </View>
              <Pressable
                disabled={!canRemove}
                onPress={() => setPending({ id: d.id, name: d.name })}
                accessibilityLabel="Remove"
                style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: canRemove ? 1 : 0.3, backgroundColor: pressed ? 'rgba(233,233,237,0.07)' : 'transparent' })}
              >
                <Icon name="trash" size={16} color={Ramp.neutral[500]} />
              </Pressable>
            </View>
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
          <Text style={{ fontSize: 14, color: Ramp.neutral[300] }}>Add a dog</Text>
        </Pressable>
      </ScrollView>

      {toastElement}
      <ConfirmDialog
        visible={!!pending}
        title={`Remove ${pending?.name ?? ''}?`}
        message="This dog will be removed from your profile."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPending(null)}
      />
    </View>
  );
};
