import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordVitalReadingScreen } from '../screens/RecordVitalReadingScreen';
import { TakeMedicineQuickScreen } from '../screens/TakeMedicineQuickScreen';
import { AddNotesScreen } from '../screens/AddNotesScreen';

const Stack = createStackNavigator();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RecordVitalReading" component={RecordVitalReadingScreen} />
      <Stack.Screen name="TakeMedicineQuick" component={TakeMedicineQuickScreen} />
      <Stack.Screen name="AddNote" component={AddNotesScreen} />
    </Stack.Navigator>
  );
}