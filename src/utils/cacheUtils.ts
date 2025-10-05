/**
 * Cache Utilities
 * Provides AsyncStorage-based caching for offline data access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = '@nely_cache:';

/**
 * Cache duration constants (in milliseconds)
 */
export const CACHE_DURATION = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Get data from cache
 * Returns null if cache is expired or doesn't exist
 */
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now > entry.expiresAt) {
      // Clean up expired cache
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    return null;
  }
};

/**
 * Save data to cache with expiration time
 */
export const saveToCache = async <T>(
  key: string,
  data: T,
  duration: number = CACHE_DURATION.MEDIUM
): Promise<void> => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + duration,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
  }
};

/**
 * Remove specific cache entry
 */
export const removeFromCache = async (key: string): Promise<void> => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
  }
};

/**
 * Clear all cache entries
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
  }
};

/**
 * Get cache key for elderly profiles
 */
export const getCacheKey = {
  elderlyProfiles: (familyId: string) => `elderly_profiles_${familyId}`,
  vitalSigns: (elderlyId: string) => `vital_signs_${elderlyId}`,
  medications: (elderlyId: string) => `medications_${elderlyId}`,
  appointments: (elderlyId: string) => `appointments_${elderlyId}`,
  upcomingAppointments: (elderlyId: string) => `upcoming_appointments_${elderlyId}`,
  careNotes: (elderlyId: string) => `care_notes_${elderlyId}`,
  familyMembers: (familyId: string) => `family_members_${familyId}`,
  userProfile: (userId: string) => `user_profile_${userId}`,
  vitalSignsHistory: (elderlyId: string, period: string) => `vital_signs_history_${elderlyId}_${period}`,
};
