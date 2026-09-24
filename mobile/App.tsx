import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';

const App: React.FC = () => (
  <SafeAreaProvider>
    <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  </SafeAreaProvider>
);

export default App;
