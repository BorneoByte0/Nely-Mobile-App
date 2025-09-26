import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ViewAllTrendsScreen } from '../screens/ViewAllTrendsScreen';

const Stack = createStackNavigator();

export function InsightsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="InsightsMain" 
        component={InsightsScreen}
      />
      <Stack.Screen 
        name="ViewAllTrends" 
        component={ViewAllTrendsScreen}
      />
    </Stack.Navigator>
  );
}