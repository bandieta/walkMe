import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { readDevLaunch } from '../utils/devLaunch';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { restoreSession, devLogin, logoutAndInvalidate } from '../store/slices/authSlice';
import { Colors } from '../utils/theme';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { WelcomeScreen } from '../screens/Auth/WelcomeScreen';
import { DogProfileScreen } from '../screens/Onboarding/DogProfileScreen';
import { RhythmScreen } from '../screens/Onboarding/RhythmScreen';
import { LocationScreen } from '../screens/Onboarding/LocationScreen';
import { MapScreen } from '../screens/Map/MapScreen';
import { WalkDetailScreen } from '../screens/Walk/WalkDetailScreen';
import { MyWalksScreen } from '../screens/Walk/MyWalksScreen';
import { CreateWalkScreen } from '../screens/Walk/CreateWalkScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { EventDetailScreen } from '../screens/Events/EventDetailScreen';
import { CreateEventScreen } from '../screens/Events/CreateEventScreen';
import { DiscoverScreen } from '../screens/Discover/DiscoverScreen';
import { ChatListScreen } from '../screens/Matches/ChatListScreen';
import { DirectMessageScreen } from '../screens/Chat/DirectMessageScreen';
import { WalkChatScreen } from '../screens/Chat/WalkChatScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';
import { MyDogsScreen } from '../screens/Profile/MyDogsScreen';
import { AddDogScreen } from '../screens/Profile/AddDogScreen';
import { EditDogScreen } from '../screens/Profile/EditDogScreen';
import { PickLocationScreen } from '../screens/Location/PickLocationScreen';

// ─── Param lists ─────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
};

export type OnboardingStackParamList = {
  DogProfile: undefined;
  Rhythm: undefined;
  Location: undefined;
};

export type MapStackParamList = {
  MapHome: undefined;
  WalkDetail: { walkId: string };
  WalkChat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  PickLocation: { initialLat?: number; initialLng?: number; returnTo: string };
};

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  DirectMessage: { matchId: string; userName: string };
  WalkChat: { walkId: string; walkTitle?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  MyDogs: undefined;
  AddDog: undefined;
  EditDog: { dogId: string };
  MyWalks: undefined;
  Rhythm: undefined;
  WalkDetail: { walkId: string };
  WalkChat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
  EventDetail: { eventId: string };
  PickLocation: { initialLat?: number; initialLng?: number; returnTo: string };
};

export type MainTabParamList = {
  MapTab: undefined;
  DiscoverTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

// ─── Deep-linking config ─────────────────────────────────────────────────────
// Every screen has a path so it can be opened directly, e.g. `xcrun simctl openurl booted walkme://profile`.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['walkme://', 'https://dogpals.app'],
  getInitialURL: async () => (__DEV__ && (await readDevLaunch()).url) || Linking.getInitialURL(),
  config: {
    screens: {
      Main: {
        screens: {
          MapTab: {
            screens: {
              MapHome: 'explore',
              WalkDetail: 'walk/:walkId',
              WalkChat: 'walk-chat/:walkId',
              CreateWalk: 'create-walk',
              EventDetail: 'event/:eventId',
              CreateEvent: 'create-event',
            },
          },
          DiscoverTab: { screens: { DiscoverHome: 'discover' } },
          ChatTab: {
            screens: {
              ChatList: 'messages',
              DirectMessage: 'dm/:matchId',
              WalkChat: 'chat/walk/:walkId',
            },
          },
          ProfileTab: {
            screens: {
              ProfileHome: 'profile',
              EditProfile: 'edit-profile',
              MyDogs: 'my-dogs',
              AddDog: 'add-dog',
              EditDog: 'edit-dog/:dogId',
              MyWalks: 'my-walks',
              Rhythm: 'walking-rhythm',
            },
          },
        },
      },
      Onboarding: {
        screens: { DogProfile: 'onboarding/dog', Rhythm: 'onboarding/rhythm', Location: 'onboarding/location' },
      },
      Auth: { screens: { Welcome: 'welcome' } },
    },
  },
};

// ─── Nested stacks ───────────────────────────────────────────────────────────
const MapStack = createStackNavigator<MapStackParamList>();
const MapStackScreen: React.FC = () => (
  <MapStack.Navigator screenOptions={{ headerShown: false }}>
    <MapStack.Screen name="MapHome" component={MapScreen} />
    <MapStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    <MapStack.Screen name="WalkChat" component={WalkChatScreen} />
    <MapStack.Screen name="CreateWalk" component={CreateWalkScreen} />
    <MapStack.Screen name="EventDetail" component={EventDetailScreen} />
    <MapStack.Screen name="CreateEvent" component={CreateEventScreen} />
    <MapStack.Screen name="PickLocation" component={PickLocationScreen} />
  </MapStack.Navigator>
);

const DiscoverStack = createStackNavigator<DiscoverStackParamList>();
const DiscoverStackScreen: React.FC = () => (
  <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStack.Screen name="DiscoverHome" component={DiscoverScreen} />
  </DiscoverStack.Navigator>
);

const ChatStack = createStackNavigator<ChatStackParamList>();
const ChatStackScreen: React.FC = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="ChatList" component={ChatListScreen} />
    <ChatStack.Screen name="DirectMessage" component={DirectMessageScreen} />
    <ChatStack.Screen name="WalkChat" component={WalkChatScreen} />
  </ChatStack.Navigator>
);

const ProfileStack = createStackNavigator<ProfileStackParamList>();
const ProfileStackScreen: React.FC = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="MyDogs" component={MyDogsScreen} />
    <ProfileStack.Screen name="AddDog" component={AddDogScreen} />
    <ProfileStack.Screen name="EditDog" component={EditDogScreen} />
    <ProfileStack.Screen name="MyWalks" component={MyWalksScreen} />
    <ProfileStack.Screen name="Rhythm" component={RhythmScreen} />
    <ProfileStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    <ProfileStack.Screen name="WalkChat" component={WalkChatScreen} />
    <ProfileStack.Screen name="CreateWalk" component={CreateWalkScreen} />
    <ProfileStack.Screen name="EventDetail" component={EventDetailScreen} />
    <ProfileStack.Screen name="PickLocation" component={PickLocationScreen} />
  </ProfileStack.Navigator>
);

// ─── Bottom tabs ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
    <Tab.Screen name="MapTab" component={MapStackScreen} />
    <Tab.Screen name="DiscoverTab" component={DiscoverStackScreen} />
    <Tab.Screen name="ChatTab" component={ChatStackScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
  </Tab.Navigator>
);

// ─── Auth + onboarding stacks ────────────────────────────────────────────────
const AuthStack = createStackNavigator<AuthStackParamList>();
const AuthStackScreen: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
  </AuthStack.Navigator>
);

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();
const OnboardingStackScreen: React.FC = () => (
  <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
    <OnboardingStack.Screen name="DogProfile" component={DogProfileScreen} />
    <OnboardingStack.Screen name="Rhythm" component={RhythmScreen} />
    <OnboardingStack.Screen name="Location" component={LocationScreen} />
  </OnboardingStack.Navigator>
);

// ─── Root navigator ──────────────────────────────────────────────────────────
const RootStack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = async (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      await dispatch(restoreSession());
    }
    if (__DEV__) {
      const { login: name } = await readDevLaunch();
      if (name === '__logout__') await dispatch(logoutAndInvalidate());
      else if (name) await dispatch(devLogin(String(name)));
    }
    setSplashDone(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      {splashDone && (
      <NavigationContainer linking={linking}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <RootStack.Screen name="Auth" component={AuthStackScreen} />
          ) : !user.onboarded ? (
            <RootStack.Screen name="Onboarding" component={OnboardingStackScreen} />
          ) : (
            <RootStack.Screen name="Main" component={MainTabs} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
      )}
      {!splashDone && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <SplashScreen onFinish={handleSplashFinish} />
        </View>
      )}
    </View>
  );
};
