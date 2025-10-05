/**
 * OfflineBanner Component
 * Displays a banner when the app is offline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../utils/networkUtils';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.subtitle}>Showing cached data</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B', // Amber-500
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D97706', // Amber-600
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#FEF3C7', // Amber-100
  },
});
