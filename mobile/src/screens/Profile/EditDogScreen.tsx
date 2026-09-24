import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { DogForm } from './DogForm';

/** "Edit" from My dogs — same form as Add a dog / onboarding, pre-filled from the existing dog. */
export const EditDogScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dogId: string = route.params?.dogId;
  const dog = useSelector((s: RootState) => s.dogs.dogs.find((d) => d.id === dogId));

  // Dog list hasn't loaded yet (e.g. deep link straight into this screen) or was deleted elsewhere.
  if (!dog) {
    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MyDogs');
    return null;
  }

  return (
    <DogForm
      mode="edit"
      initialDog={dog}
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MyDogs'))}
      onSaved={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MyDogs'))}
    />
  );
};
