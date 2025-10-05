import React, { useState, useCallback, useRef, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { VitalSignModal } from '../components/VitalSignModal';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useModernAlert } from '../hooks/useModernAlert';
import { hapticFeedback, healthStatusHaptics } from '../utils/haptics';
import { useElderlyProfiles, useVitalSigns, useCareNotes, useMedications, useAppointments, useFamilyMembersWithRoles } from '../hooks/useDatabase';
import { usePermissions } from '../context/PermissionContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}

function FamilyScreenComponent({ navigation }: Props) {
  const { language } = useLanguage();

