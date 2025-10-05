import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ViewAllTrendsScreen } from '../screens/ViewAllTrendsScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Stack = createStackNavigator();

export function InsightsStackNavigator() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}