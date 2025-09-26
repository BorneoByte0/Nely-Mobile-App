import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditUserProfileScreen } from '../screens/EditUserProfileScreen';
import { InviteFamilyMembersScreen } from '../screens/InviteFamilyMembersScreen';
import { RoleManagementScreen } from '../screens/RoleManagementScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { UnitsScreen } from '../screens/UnitsScreen';
import { ReminderTimingsScreen } from '../screens/ReminderTimingsScreen';
import { ContactSupportScreen } from '../screens/ContactSupportScreen';
import { UserGuideScreen } from '../screens/UserGuideScreen';
import { LanguageScreen } from '../screens/LanguageScreen';
import { AddReminderScreen } from '../screens/AddReminderScreen';

const Stack = createStackNavigator();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
      <Stack.Screen 
        name="EditUserProfile" 
        component={EditUserProfileScreen}
      />
      <Stack.Screen 
        name="InviteFamilyMembers" 
        component={InviteFamilyMembersScreen}
      />
      <Stack.Screen 
        name="RoleManagement" 
        component={RoleManagementScreen}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
      />
      <Stack.Screen 
        name="Units" 
        component={UnitsScreen}
      />
      <Stack.Screen 
        name="ReminderTimings" 
        component={ReminderTimingsScreen}
      />
      <Stack.Screen 
        name="ContactSupport" 
        component={ContactSupportScreen}
      />
      <Stack.Screen 
        name="UserGuide" 
        component={UserGuideScreen}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
      />
      <Stack.Screen
        name="AddReminder"
        component={AddReminderScreen}
      />
    </Stack.Navigator>
  );
}