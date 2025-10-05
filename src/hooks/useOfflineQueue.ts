// React hook for offline queue management
// Provides queue status and automatic sync capabilities

import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { offlineQueue } from '../utils/offlineQueue';
import { isOnline } from '../utils/networkUtils';
import { logger } from '../utils/logger';

export function useOfflineQueue() {
  const [queueCount, setQueueCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Get initial queue count
    offlineQueue.getQueueCount().then(setQueueCount);

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe(setQueueCount);

    // Set up app state listener to process queue when app comes to foreground
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        logger.debug('App became active, checking offline queue');
        if (await isOnline()) {
          setIsProcessing(true);
          try {
            await offlineQueue.processQueue();
          } catch (error) {
            logger.error('Error processing queue on app foreground:', error);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up interval to periodically check and process queue (every 30 seconds)
    const intervalId = setInterval(async () => {
      if (await isOnline() && !offlineQueue.isQueueProcessing()) {
        const count = await offlineQueue.getQueueCount();
        if (count > 0) {
          logger.debug('Periodic queue check: processing queued operations');
          setIsProcessing(true);
          try {
            await offlineQueue.processQueue();
          } catch (error) {
            logger.error('Error in periodic queue processing:', error);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    }, 30000); // 30 seconds

    return () => {
      unsubscribe();
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  const processQueue = async () => {
    setIsProcessing(true);
    try {
      await offlineQueue.processQueue();
    } catch (error) {
      logger.error('Error processing queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearQueue = async () => {
    await offlineQueue.clearQueue();
    setQueueCount(0);
  };

  return {
    queueCount,
    isProcessing,
    processQueue,
    clearQueue,
  };
}
