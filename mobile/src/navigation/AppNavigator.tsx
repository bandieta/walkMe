import React, { useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Colors } from '../utils/theme';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { MapScreen } from '../screens/Map/MapScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { WalkDetailScreen } from '../screens/Walk/WalkDetailScreen';
import { MyWalksScreen } from '../screens/Walk/MyWalksScreen';
import { CreateWalkScreen } from '../screens/Walk/CreateWalkScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Map:     { active: '🗺', inactive: '🗺' },
  MyWalks: { active: '🐾', inactive: '🐾' },
  Profile: { active: '👤', inactive: '👤' },
};

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surfaceDark,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarIcon: ({ focused, size }) => {
        const cfg = TAB_ICONS[route.name] ?? { active: '•', inactive: '•' };
        return <Text style={{ fontSize: size - 4 }}>{focused ? cfg.active : cfg.inactive}</Text>;
      },
    })}
  >
    <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Explore' }} />
    <Tab.Screen name="MyWalks" component={MyWalksScreen} options={{ tabBarLabel: 'My Walks' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="WalkDetail" component={WalkDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="CreateWalk" component={CreateWalkScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
