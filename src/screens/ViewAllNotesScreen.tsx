import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaWrapper } from '../components/SafeAreaWrapper';
import { InteractiveFeedback } from '../components/InteractiveFeedback';
import { colors } from '../constants/colors';
import { useLanguage } from '../context/LanguageContext';
import { hapticFeedback } from '../utils/haptics';
import { useElderlyProfiles, useNotes } from '../hooks/useDatabase';
import { HealthLoadingState } from '../components/HealthLoadingState';
import { ErrorState } from '../components/ErrorState';

interface Props {
  navigation: any;
}


export function ViewAllNotesScreen({ navigation }: Props) {
  const { language } = useLanguage();

  // Simple flag to track initial load
  const isInitialMount = useRef(true);

  // Database hooks
  const { elderlyProfiles, loading: profilesLoading, error: profilesError, refetch: refetchProfiles } = useElderlyProfiles();
  const currentElderly = elderlyProfiles[0];
  const { careNotes, loading: notesLoading, error: notesError, refetch: refetchNotes } = useNotes(currentElderly?.id || '');

  // Use database data
  const displayNotes = careNotes;
  const isLoading = profilesLoading || notesLoading;

  // Simplified auto-refresh: only refresh on focus, skip initial mount
  useFocusEffect(
    useCallback(() => {
      // Skip refresh on initial mount, only refresh on subsequent focuses
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Simple refresh when returning to screen
      if (currentElderly?.id) {
        const timer = setTimeout(() => {
          refetchNotes?.();
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [currentElderly?.id])
  );
  
  const formatTime = (dateString: string) => {
    if (!dateString) return language === 'en' ? 'Unknown' : 'Tidak diketahui';

    try {
      const now = new Date();
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateString);
        return language === 'en' ? 'Invalid date' : 'Tarikh tidak sah';
      }

      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      console.log('Date formatting:', { dateString, date, diffMinutes, diffHours, diffDays });

      if (diffMinutes < 1) return language === 'en' ? 'Just now' : 'Baru sahaja';
      if (diffMinutes < 60) return `${diffMinutes}m ${language === 'en' ? 'ago' : 'lalu'}`;
      if (diffHours < 24) return `${diffHours}h ${language === 'en' ? 'ago' : 'lalu'}`;

      return `${diffDays}d ${language === 'en' ? 'ago' : 'lalu'}`;
    } catch (error) {
      console.log('Error formatting time:', error, dateString);
      return language === 'en' ? 'Error' : 'Ralat';
    }
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      general: colors.primary,
      health: colors.success,
      medication: colors.info,
      appointment: colors.secondary,
      daily_care: colors.warning,
      behavior: colors.textSecondary,
    };
    return colorMap[category] || colors.primary;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      general: 'document-text',
      health: 'medical',
      medication: 'medical-outline',
      appointment: 'calendar',
      daily_care: 'heart',
      behavior: 'person',
    };
    return iconMap[category] || 'document-text';
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
        <HealthLoadingState
          type="general"
          overlay={false}
          message={language === 'en' ? 'Loading care notes...' : 'Memuatkan nota penjagaan...'}
        />
      </SafeAreaWrapper>
    );
  }

  if (profilesError || notesError) {
    return (
      <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
        <ErrorState
          type="data"
          message={profilesError || notesError || 'An error occurred'}
          onRetry={() => window.location.reload()}
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper gradientVariant="note" includeTabBarPadding={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <InteractiveFeedback
              onPress={() => navigation.goBack()}
              feedbackType="scale"
              hapticType="light"
            >
              <Ionicons name="chevron-back" size={24} color={colors.white} />
            </InteractiveFeedback>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {language === 'en' ? 'All Care Notes' : 'Semua Nota Penjagaan'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'en' ? 'View all family care observations' : 'Lihat semua pemerhatian penjagaan keluarga'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.container}>

        {/* Summary Statistics */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.singleStatCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{displayNotes.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'en' ? 'Total Care Notes' : 'Jumlah Nota Penjagaan'}
            </Text>
          </View>
        </View>

        {/* Notes List */}
        <View style={styles.notesContainer}>
          {displayNotes.map((note: any, index: number) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteLayout}>
                {/* Category Icon on Left */}
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(note.category || 'general') }]}>
                  <Ionicons
                    name={getCategoryIcon(note.category || 'general') as any}
                    size={16}
                    color={colors.white}
                  />
                </View>

                {/* Main Note Content */}
                <View style={styles.noteMainContent}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteHeaderLeft}>
                      <Text style={styles.noteAuthor}>{note.authorName || note.author_name || 'Unknown'}</Text>
                      <Text style={styles.noteTime}>{formatTime(note.dateCreated || note.created_at || note.date_created)}</Text>
                    </View>

                    {/* Important Flag on Right */}
                    {(note.isImportant || note.is_important) && (
                      <View style={styles.importantFlag}>
                        <Ionicons name="flag" size={14} color={colors.white} />
                      </View>
                    )}
                  </View>

                  <View style={styles.noteContent}>
                    <Text style={styles.noteText} numberOfLines={3}>
                      {note.content}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {displayNotes.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'en' ? 'No care notes yet' : 'Belum ada nota penjagaan'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'en' 
                ? 'Start documenting care observations to build a history'
                : 'Mulakan mendokumentasikan pemerhatian penjagaan untuk membina sejarah'
              }
            </Text>
          </View>
        )}
        
        <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 16,
    margin: 20,
    marginBottom: 0,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  singleStatCard: {
    paddingVertical: 16,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  noteMainContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flex: 1,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  importantFlag: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  noteTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noteContent: {
    marginTop: 4,
  },
  noteText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomPadding: {
    height: 24,
  },
});