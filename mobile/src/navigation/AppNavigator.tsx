import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { MapScreen } from '../screens/Map/MapScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: '#999',
    }}
  >
    <Tab.Screen
      name="Map"
      component={MapScreen}
      options={{ tabBarLabel: 'Explore', title: 'Nearby Walks' }}
    />
    <Tab.Screen
      name="MyWalks"
      component={MapScreen} // placeholder — replace with MyWalksScreen
      options={{ tabBarLabel: 'My Walks', title: 'My Walks' }}
    />
    <Tab.Screen
      name="Profile"
      component={MapScreen} // placeholder — replace with ProfileScreen
      options={{ tabBarLabel: 'Profile', title: 'Profile' }}
    />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: true, title: 'Walk Chat' }}
            />
            <Stack.Screen
              name="WalkDetail"
              component={MapScreen} // placeholder — replace with WalkDetailScreen
              options={{ headerShown: true, title: 'Walk Details' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
