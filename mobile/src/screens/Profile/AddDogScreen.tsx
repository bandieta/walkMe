import React from 'react';
import { DogForm } from './DogForm';

/** "Add a dog" from Profile / My dogs — same form as onboarding step 1, with its own header and "Save dog". */
export const AddDogScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <DogForm
    mode="add"
    onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ProfileHome'))}
    onSaved={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MyDogs'))}
  />
);
