import React, { useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { ModernAlert } from '../components/ModernAlert';
import { useModernAlert } from '../hooks/useModernAlert';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { useUserProfile, useUserFamilyRole, useRolePermissions } from '../hooks/useDatabase';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation?: any;
}

function ProfileScreenComponent({ navigation }: Props) {
  const { language } = useLanguage();

