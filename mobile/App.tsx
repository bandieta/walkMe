import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { GlobalChatNotifier } from './src/components/GlobalChatNotifier';
import { restoreLanguage } from './src/i18n';

const App: React.FC = () => {
  // Swaps in a previously saved language (Profile > Language) as soon as it's read from storage — the app
  // renders in English until then, same brief-default-then-settle pattern as restoreSession's auth check.
  useEffect(() => {
    restoreLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Provider store={store}>
        <AppNavigator />
        <GlobalChatNotifier />
      </Provider>
    </SafeAreaProvider>
  );
};

export default App;
