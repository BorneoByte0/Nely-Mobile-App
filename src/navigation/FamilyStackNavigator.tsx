import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FamilyScreen } from '../screens/FamilyScreen';
import { EditElderlyProfileScreen } from '../screens/EditElderlyProfileScreen';
import { RecordVitalReadingScreen } from '../screens/RecordVitalReadingScreen';
import { ViewVitalTrendsScreen } from '../screens/ViewVitalTrendsScreen';
import { ManageMedicationsScreen } from '../screens/ManageMedicationsScreen';
import { AddMedicationScreen } from '../screens/AddMedicationScreen';
import { EditMedicationScreen } from '../screens/EditMedicationScreen';
import { TakeMedicationScreen } from '../screens/TakeMedicationScreen';
import { RecentMedicationActivityScreen } from '../screens/RecentMedicationActivityScreen';
import { ManageAppointmentsScreen } from '../screens/ManageAppointmentsScreen';
import { AppointmentCompletedScreen } from '../screens/AppointmentCompletedScreen';
import { AppointmentOutcomeScreen } from '../screens/AppointmentOutcomeScreen';
import { EditAppointmentScreen } from '../screens/EditAppointmentScreen';
import { AddAppointmentScreen } from '../screens/AddAppointmentScreen';
import { ViewUpcomingAppointmentsScreen } from '../screens/ViewUpcomingAppointmentsScreen';
import { CompletedAppointmentsScreen } from '../screens/CompletedAppointmentsScreen';
import { AddNotesScreen } from '../screens/AddNotesScreen';
import { ViewAllNotesScreen } from '../screens/ViewAllNotesScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Stack = createStackNavigator();

export function FamilyStackNavigator() {
  return (
    <ErrorBoundary>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="FamilyMain" component={FamilyScreen} />
        <Stack.Screen name="EditElderlyProfile" component={EditElderlyProfileScreen} />
        <Stack.Screen name="RecordVitalReading" component={RecordVitalReadingScreen} />
        <Stack.Screen name="ViewVitalTrends" component={ViewVitalTrendsScreen} />
        <Stack.Screen name="ManageMedications" component={ManageMedicationsScreen} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
        <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
        <Stack.Screen name="TakeMedication" component={TakeMedicationScreen} />
        <Stack.Screen name="RecentMedicationActivity" component={RecentMedicationActivityScreen} />
        <Stack.Screen name="ManageAppointments" component={ManageAppointmentsScreen} />
        <Stack.Screen name="AppointmentCompleted" component={AppointmentCompletedScreen} />
        <Stack.Screen name="AppointmentOutcome" component={AppointmentOutcomeScreen} />
        <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} />
        <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
        <Stack.Screen name="ViewUpcomingAppointments" component={ViewUpcomingAppointmentsScreen} />
        <Stack.Screen name="CompletedAppointments" component={CompletedAppointmentsScreen} />
        <Stack.Screen name="AddNote" component={AddNotesScreen} />
        <Stack.Screen name="ViewAllNotes" component={ViewAllNotesScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}