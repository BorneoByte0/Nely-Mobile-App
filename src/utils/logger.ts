// Logger utility for production-safe logging
// In production builds, only warnings and errors are logged
// Debug and info logs are stripped out to prevent sensitive data exposure

export const logger = {
  /**
   * Debug logging - only visible in development
   * Use for detailed debugging information
   */

  /**
   * Info logging - only visible in development
   * Use for general information
   */

  /**
   * Warning logging - visible in all environments
   * Use for non-critical issues that should be addressed
   */

  /**
   * Error logging - visible in all environments
   * Use for errors that need attention
   */
};

/**
 * Sanitize sensitive data before logging
 * Replaces sensitive values with masked versions
 */
export function sanitizeForLog(obj: any): any {
  if (!obj) return obj;

  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'auth',
    'email',
    'phone',
    'ssn',
    'credit_card',
  ];

  if (typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}
