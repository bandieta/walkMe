import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import { WalkDetailScreen } from '../screens/Walk/WalkDetailScreen';
import { MyWalksScreen } from '../screens/Walk/MyWalksScreen';
import { CreateWalkScreen } from '../screens/Walk/CreateWalkScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { EventsScreen } from '../screens/Events/EventsScreen';
import { EventDetailScreen } from '../screens/Events/EventDetailScreen';
import { CreateEventScreen } from '../screens/Events/CreateEventScreen';
import { DiscoverScreen } from '../screens/Discover/DiscoverScreen';
import { ChatListScreen } from '../screens/Matches/ChatListScreen';
import { DirectMessageScreen } from '../screens/Chat/DirectMessageScreen';
import { WalkChatScreen } from '../screens/Chat/WalkChatScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';
import { MyDogsScreen } from '../screens/Profile/MyDogsScreen';
import { AddDogScreen } from '../screens/Profile/AddDogScreen';

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
  WalkChat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
};

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
};

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  MyWalks: undefined;
  WalkDetail: { walkId: string };
  WalkChat: { walkId: string; walkTitle?: string };
  CreateWalk: undefined;
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
};

export type MainTabParamList = {
  MapTab: undefined;
  DiscoverTab: undefined;
  EventsTab: undefined;
  ChatTab: undefined;
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
              WalkChat: 'walk-chat/:walkId',
            },
          },
          DiscoverTab: {
            screens: { DiscoverHome: 'discover' },
          },
          EventsTab: {
            screens: {
              EventsList: 'events',
              EventDetail: 'event/:eventId',
              CreateEvent: 'create-event',
              MyWalks: 'my-walks',
            },
          },
          ChatTab: {
            screens: {
              ChatList: 'messages',
              DirectMessage: 'dm/:matchId',
            },
          },
          ProfileTab: {
            screens: {
              ProfileHome: 'profile',
              EditProfile: 'edit-profile',
              MyDogs: 'my-dogs',
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
    <MapStack.Screen name="WalkChat" component={WalkChatScreen} />
    <MapStack.Screen name="CreateWalk" component={CreateWalkScreen} />
  </MapStack.Navigator>
);

const DiscoverStack = createStackNavigator<DiscoverStackParamList>();
const DiscoverStackScreen: React.FC = () => (
  <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
    <DiscoverStack.Screen name="DiscoverHome" component={DiscoverScreen} />
  </DiscoverStack.Navigator>
);

const EventsStack = createStackNavigator<EventsStackParamList>();
const EventsStackScreen: React.FC = () => (
  <EventsStack.Navigator screenOptions={{ headerShown: false }}>
    <EventsStack.Screen name="EventsList" component={EventsScreen} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    <EventsStack.Screen name="CreateEvent" component={CreateEventScreen} />
    <EventsStack.Screen name="MyWalks" component={MyWalksScreen} />
    <EventsStack.Screen name="WalkDetail" component={WalkDetailScreen} />
    <EventsStack.Screen name="WalkChat" component={WalkChatScreen} />
    <EventsStack.Screen name="CreateWalk" component={CreateWalkScreen} />
  </EventsStack.Navigator>
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
  </ProfileStack.Navigator>
);

// ─── Bottom tabs ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();
const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
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
    }}
  >
    <Tab.Screen name="MapTab" component={MapStackScreen}
      options={{ tabBarLabel: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} /> }} />
    <Tab.Screen name="DiscoverTab" component={DiscoverStackScreen}
      options={{ tabBarLabel: 'Discover', tabBarIcon: ({ color, size }) => <Ionicons name="paw-outline" size={size} color={color} /> }} />
    <Tab.Screen name="EventsTab" component={EventsStackScreen}
      options={{ tabBarLabel: 'Events', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
    <Tab.Screen name="ChatTab" component={ChatStackScreen}
      options={{ tabBarLabel: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
    <Tab.Screen name="ProfileTab" component={ProfileStackScreen}
      options={{ tabBarLabel: 'Me', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
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

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundDark }}>
      <NavigationContainer linking={linking}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <RootStack.Screen name="Main" component={MainTabs} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthStackScreen} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
      {!splashDone && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <SplashScreen onFinish={handleSplashFinish} />
        </View>
      )}
    </View>
  );
};
