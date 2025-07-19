/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ServerStatus, ServiceState, ServiceStatus } from '@/types';

// Combine class names
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting utilities
export const formatDate = (
  date: string | Date,
  formatStr = 'yyyy-MM-dd HH:mm:ss'
) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Status utilities
export const getServerStatusColor = (status: ServerStatus): string => {
  switch (status) {
    case ServerStatus.ONLINE:
      return 'green';
    case ServerStatus.OFFLINE:
      return 'gray';
    case ServerStatus.ERROR:
      return 'red';
    default:
      return 'gray';
  }
};

export const getServiceStatusColor = (status: ServiceStatus): string => {
  switch (status) {
    case ServiceStatus.ACTIVE:
      return 'green';
    case ServiceStatus.INACTIVE:
      return 'gray';
    case ServiceStatus.FAILED:
      return 'red';
    case ServiceStatus.ACTIVATING:
      return 'yellow';
    case ServiceStatus.DEACTIVATING:
      return 'orange';
    default:
      return 'gray';
  }
};

export const getServiceStateColor = (state: ServiceState): string => {
  switch (state) {
    case ServiceState.ENABLED:
      return 'green';
    case ServiceState.DISABLED:
      return 'gray';
    case ServiceState.STATIC:
      return 'blue';
    case ServiceState.MASKED:
      return 'red';
    default:
      return 'gray';
  }
};

// Data formatting utilities
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Number.parseFloat((bytes / k ** i).toFixed(dm)) + ' ' + sizes[i];
};

export const formatMemoryMB = (mb: number): string => {
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
};

export const formatDiskGB = (gb: number): string => {
  if (gb < 1024) {
    return `${gb.toFixed(1)} GB`;
  }
  return `${(gb / 1024).toFixed(1)} TB`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  if (seconds < 86_400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Validation utilities
export const isValidIPAddress = (ip: string): boolean => {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export const isValidHostname = (hostname: string): boolean => {
  const hostnameRegex = /^(?!-)(?!.*-$)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*$/;
  return hostnameRegex.test(hostname) && hostname.length <= 253;
};

export const isValidPort = (port: number): boolean => {
  return port > 0 && port <= 65_535;
};

// Error handling utilities
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'detail' in error) {
    return String((error as any).detail);
  }

  return 'An unknown error occurred';
};

// URL utilities
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

// Local storage utilities
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  },
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Copy to clipboard utility
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
};

// Download utility
export const downloadText = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
