// Offline Queue System for Critical Write Operations
// Ensures data integrity by queuing database writes when offline
// Automatically syncs queued operations when connection is restored

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { isOnline } from './networkUtils';
import { logger } from './logger';

const QUEUE_STORAGE_KEY = '@nely_offline_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_ATTEMPTS = 3;

export type OperationType = 'insert' | 'update' | 'delete';

export interface QueuedOperation {
  id: string;
  type: OperationType;
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  userId?: string;
}

class OfflineQueue {
  private isProcessing = false;
  private listeners: Array<(count: number) => void> = [];

  /**
   * Add an operation to the offline queue
   */
  async add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getQueue();

      // Check queue size limit
      if (queue.length >= MAX_QUEUE_SIZE) {
        logger.warn('Offline queue is full, removing oldest operation');
        queue.shift();
      }

      const newOperation: QueuedOperation = {
        ...operation,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(newOperation);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

      logger.debug(`Operation queued: ${operation.type} on ${operation.table}`);
      this.notifyListeners(queue.length);

      // Try to process immediately if online
      if (await isOnline()) {
        this.processQueue();
      }
    } catch (error) {
      logger.error('Failed to add operation to queue:', error);
      throw error;
    }
  }

  /**
   * Process all queued operations
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing) {
      logger.debug('Queue is already being processed');
      return;
    }

    // Check if online
    if (!(await isOnline())) {
      logger.debug('Device is offline, skipping queue processing');
      return;
    }

    this.isProcessing = true;
    logger.debug('Starting offline queue processing');

    try {
      const queue = await this.getQueue();

      if (queue.length === 0) {
        logger.debug('Queue is empty');
        return;
      }

      logger.debug(`Processing ${queue.length} queued operations`);

      const failedOperations: QueuedOperation[] = [];

      for (const operation of queue) {
        try {
          await this.executeOperation(operation);
          logger.debug(`Successfully executed operation ${operation.id}`);
        } catch (error) {
          logger.error(`Failed to execute operation ${operation.id}:`, error);

          // Increment retry count
          operation.retryCount += 1;

          // Keep in queue if below max retries
          if (operation.retryCount < MAX_RETRY_ATTEMPTS) {
            failedOperations.push(operation);
            logger.debug(`Operation ${operation.id} will be retried (${operation.retryCount}/${MAX_RETRY_ATTEMPTS})`);
          } else {
            logger.error(`Operation ${operation.id} exceeded max retries, discarding`);
          }
        }
      }

      // Update queue with only failed operations
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(failedOperations));
      this.notifyListeners(failedOperations.length);

      if (failedOperations.length > 0) {
        logger.warn(`${failedOperations.length} operations failed and will be retried`);
      } else {
        logger.debug('All queued operations processed successfully');
      }
    } catch (error) {
      logger.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const { type, table, data } = operation;

    let result;

    switch (type) {
      case 'insert':
        result = await supabase.from(table).insert(data);
        break;

      case 'update':
        // For updates, we need an id to identify the record
        if (!data.id) {
          throw new Error('Update operation requires an id field');
        }
        const { id, ...updateData } = data;
        result = await supabase.from(table).update(updateData).eq('id', id);
        break;

      case 'delete':
        // For deletes, we need an id to identify the record
        if (!data.id) {
          throw new Error('Delete operation requires an id field');
        }
        result = await supabase.from(table).delete().eq('id', data.id);
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

    if (result.error) {
      throw result.error;
    }
  }

  /**
   * Get all queued operations
   */
  async getQueue(): Promise<QueuedOperation[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to retrieve queue:', error);
      return [];
    }
  }

  /**
   * Get the number of queued operations
   */
  async getQueueCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Clear all queued operations
   * WARNING: This will discard all pending operations
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      logger.debug('Queue cleared');
      this.notifyListeners(0);
    } catch (error) {
      logger.error('Failed to clear queue:', error);
    }
  }

  /**
   * Remove a specific operation from the queue
   */
  async removeFromQueue(operationId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
      logger.debug(`Removed operation ${operationId} from queue`);
      this.notifyListeners(filtered.length);
    } catch (error) {
      logger.error('Failed to remove operation from queue:', error);
    }
  }

  /**
   * Subscribe to queue count changes
   */
  subscribe(listener: (count: number) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue count changes
   */
  private notifyListeners(count: number): void {
    this.listeners.forEach(listener => {
      try {
        listener(count);
      } catch (error) {
        logger.error('Error in queue listener:', error);
      }
    });
  }

  /**
   * Get operations for a specific user
   */
  async getOperationsByUser(userId: string): Promise<QueuedOperation[]> {
    const queue = await this.getQueue();
    return queue.filter(op => op.userId === userId);
  }

  /**
   * Check if queue is being processed
   */
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Helper function to safely execute database operations with offline queue support
 */
export async function executeWithOfflineSupport<T>(
  operation: () => Promise<T>,
  queueData: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>
): Promise<{ data: T | null; error: Error | null; queued: boolean }> {
  try {
    // Check if online
    if (await isOnline()) {
      // Try to execute immediately
      try {
        const data = await operation();
        return { data, error: null, queued: false };
      } catch (error) {
        // If immediate execution fails, queue it
        await offlineQueue.add(queueData);
        return {
          data: null,
          error: new Error('Operation failed but has been queued for retry'),
          queued: true,
        };
      }
    } else {
      // Offline, queue the operation
      await offlineQueue.add(queueData);
      return {
        data: null,
        error: new Error('Device is offline, operation has been queued'),
        queued: true,
      };
    }
  } catch (error) {
    logger.error('Error in executeWithOfflineSupport:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
      queued: false,
    };
  }
}
