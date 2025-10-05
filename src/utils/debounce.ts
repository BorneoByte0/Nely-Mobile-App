/**
 * Debounce utility for rate limiting function calls
 * Prevents excessive API calls and improves performance
 */

import { useState } from 'react';

/**
 * Debounces a function call - delays execution until after wait milliseconds
 * have elapsed since the last time it was invoked
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 *
 * // Call multiple times, but only executes once after 300ms of no calls
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this executes after 300ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility - ensures function is called at most once per specified time period
 * First call executes immediately, subsequent calls are ignored until cooldown expires
 *
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between calls
 * @returns Throttled function
 *
 * @example
 * const throttledRefresh = throttle(async () => {
 *   await refetchData();
 * }, 2000);
 *
 * // First call executes immediately
 * throttledRefresh(); // ✅ Executes
 * throttledRefresh(); // ❌ Ignored (within 2s)
 * // After 2s
 * throttledRefresh(); // ✅ Executes
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook to track cooldown state for pull-to-refresh
 * Returns whether action is currently in cooldown
 *
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns Object with isInCooldown state and startCooldown function
 *
 * @example
 * import { useState } from 'react';
 *
 * const [refreshing, setRefreshing] = useState(false);
 * const { isInCooldown, startCooldown } = useCooldown(2000);
 *
 * const onRefresh = async () => {
 *   if (isInCooldown) return;
 *
 *   setRefreshing(true);
 *   startCooldown();
 *   await refetchData();
 *   setRefreshing(false);
 * };
 */
export function useCooldown(cooldownMs: number) {
  const [isInCooldown, setIsInCooldown] = useState(false);

  const startCooldown = () => {
    setIsInCooldown(true);
    setTimeout(() => {
      setIsInCooldown(false);
    }, cooldownMs);
  };

  return { isInCooldown, startCooldown };
}

// For non-hook usage (class components or outside React)
export class CooldownManager {
  private lastCallTime: number = 0;
  private cooldownMs: number;

  constructor(cooldownMs: number) {
    this.cooldownMs = cooldownMs;
  }

  canCall(): boolean {
    const now = Date.now();
    if (now - this.lastCallTime >= this.cooldownMs) {
      this.lastCallTime = now;
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastCallTime = 0;
  }
}
