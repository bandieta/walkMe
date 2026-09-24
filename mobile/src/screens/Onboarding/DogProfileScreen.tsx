import React from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { logoutAndInvalidate } from '../../store/slices/authSlice';
import { DogForm } from '../Profile/DogForm';

/** Onboarding step 1 of 3: add the first dog (or skip), then on to the walking rhythm. */
export const DogProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <DogForm
      mode="onboarding"
      // The first onboarding step has nothing behind it but the signed-out Welcome screen (as in the prototype).
      onBack={() => (navigation.canGoBack() ? navigation.goBack() : dispatch(logoutAndInvalidate()))}
      onSaved={() => navigation.navigate('Rhythm')}
      onSkip={() => navigation.navigate('Rhythm')}
    />
  );
};
