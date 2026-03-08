import React, { useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState, AppDispatch } from '../store';
import { setToken } from '../store/slices/authSlice';
import { Colors } from '../utils/theme';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { MapScreen } from '../screens/Map/MapScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { WalkDetailScreen } from '../screens/Walk/WalkDetailScreen';
import { MyWalksScreen } from '../screens/Walk/MyWalksScreen';
import { CreateWalkScreen } from '../screens/Walk/CreateWalkScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { EventsScreen } from '../screens/Events/EventsScreen';

// ─── Param lists ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MapStackParamList = {
  MapHome: undefined;
  WalkDetail: { walkId: string };
  Chat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
};

export type WalksStackParamList = {
  MyWalks: undefined;
  WalkDetail: { walkId: string };
  Chat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
};

export type EventsStackParamList = {
  EventsList: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

export type MainTabParamList = {
  MapTab: undefined;
  WalksTab: undefined;
  EventsTab: undefined;
  ProfileTab: undefined;
};

// ─── Deep-linking config ─────────────────────────────────────────────────────
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['walkme://', 'https://dogpals.app'],
  config: {
    screens: {
      Main: {
        screens: {
          MapTab: {
            screens: {
              MapHome: 'explore',
              WalkDetail: 'walk/:walkId',
              Chat: 'chat/:walkId',
              CreateWalk: 'create-walk',
            },
          },
          WalksTab: {
            screens: {
              MyWalks: 'my-walks',
              WalkDetail: 'walk/:walkId',
            },
          },
          EventsTab: {
            screens: {
              EventsList: 'events',
            },
          },
          ProfileTab: {
            screens: {
              ProfileHome: 'profile',
            },
          },
        },
      },
      Auth: {
        screens: { Login: 'login' },
      },
    },
  },
};

// ─── Nested stacks ───────────────────────────────────────────────────────────
const MapStack = createStackNavigator<MapStackParamList>();
const MapStackScreen: React.FC = () => (
  <MapStack.Navigator screenOptions={{ headerShown: false }}>
    <MapStack.Screen name="MapHome" component={MapScreen} />
    <MapStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    <MapStack.Screen name="Chat" component={ChatScreen} />
    <MapStack.Screen name="CreateWalk" component={CreateWalkScreen} />
  </MapStack.Navigator>
);

const WalksStack = createStackNavigator<WalksStackParamList>();
const WalksStackScreen: React.FC = () => (
  <WalksStack.Navigator screenOptions={{ headerShown: false }}>
    <WalksStack.Screen name="MyWalks" component={MyWalksScreen} />
    <WalksStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    <WalksStack.Screen name="Chat" component={ChatScreen} />
    <WalksStack.Screen name="CreateWalk" component={CreateWalkScreen} />
  </WalksStack.Navigator>
);

const EventsStack = createStackNavigator<EventsStackParamList>();
const EventsStackScreen: React.FC = () => (
  <EventsStack.Navigator screenOptions={{ headerShown: false }}>
    <EventsStack.Screen name="EventsList" component={EventsScreen} />
  </EventsStack.Navigator>
);

const ProfileStack = createStackNavigator<ProfileStackParamList>();
const ProfileStackScreen: React.FC = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// ─── Tab icons ───────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  MapTab:     { active: '🗺️', inactive: '🗺️' },
  WalksTab:   { active: '🐾', inactive: '🐾' },
  EventsTab:  { active: '📅', inactive: '📅' },
  ProfileTab: { active: '👤', inactive: '👤' },
};

const TAB_LABELS: Record<string, string> = {
  MapTab:     'Explore',
  WalksTab:   'My Walks',
  EventsTab:  'Events',
  ProfileTab: 'Profile',
};

// ─── Bottom tabs ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();
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
      tabBarLabel: TAB_LABELS[route.name] ?? route.name,
      tabBarIcon: ({ focused, size }) => {
        const cfg = TAB_ICONS[route.name] ?? { active: '•', inactive: '•' };
        return <Text style={{ fontSize: size - 4 }}>{focused ? cfg.active : cfg.inactive}</Text>;
      },
    })}
  >
    <Tab.Screen name="MapTab" component={MapStackScreen} />
    <Tab.Screen name="WalksTab" component={WalksStackScreen} />
    <Tab.Screen name="EventsTab" component={EventsStackScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
  </Tab.Navigator>
);

// ─── Auth stack ──────────────────────────────────────────────────────────────
const AuthStack = createStackNavigator<AuthStackParamList>();
const AuthStackScreen: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// ─── Root navigator ──────────────────────────────────────────────────────────
const RootStack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = async (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) dispatch(setToken(token));
    }
    setSplashDone(true);
  };

  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
