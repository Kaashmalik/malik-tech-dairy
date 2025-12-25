/**
 * Toast Hook
 * Provides easy access to toast notifications with predefined types
 */

import { useToast as useToastOriginal } from '@/components/ui/toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = useToastOriginal();

  const success = (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) => {
    toast.toast({
      title,
      description,
      variant: 'success',
      duration: options?.duration || 5000,
    });
  };

  const error = (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) => {
    toast.toast({
      title,
      description,
      variant: 'destructive',
      duration: options?.duration || 7000,
    });
  };

  const warning = (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) => {
    toast.toast({
      title,
      description,
      variant: 'warning',
      duration: options?.duration || 6000,
    });
  };

  const info = (title: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) => {
    toast.toast({
      title,
      description,
      variant: 'info',
      duration: options?.duration || 5000,
    });
  };

  const custom = (options: ToastOptions & { variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info' }) => {
    toast.toast({
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: options.duration || 5000,
    });
  };

  // Predefined messages for common actions
  const messages = {
    // Success messages
    created: (item: string) => success(`${item} created successfully`),
    updated: (item: string) => success(`${item} updated successfully`),
    deleted: (item: string) => success(`${item} deleted successfully`),
    saved: (item: string) => success(`${item} saved successfully`),
    uploaded: (item: string) => success(`${item} uploaded successfully`),
    downloaded: (item: string) => success(`${item} downloaded successfully`),
    sent: (item: string) => success(`${item} sent successfully`),
    copied: () => success('Copied to clipboard'),
    moved: (item: string) => success(`${item} moved successfully`),
    archived: (item: string) => success(`${item} archived successfully`),
    restored: (item: string) => success(`${item} restored successfully`),
    imported: (item: string) => success(`${item} imported successfully`),
    exported: (item: string) => success(`${item} exported successfully`),
    
    // Error messages
    createFailed: (item: string, errorMessage?: string) => 
      error(`Failed to create ${item}`, errorMessage),
    updateFailed: (item: string, errorMessage?: string) => 
      error(`Failed to update ${item}`, errorMessage),
    deleteFailed: (item: string, errorMessage?: string) => 
      error(`Failed to delete ${item}`, errorMessage),
    saveFailed: (item: string, errorMessage?: string) => 
      error(`Failed to save ${item}`, errorMessage),
    uploadFailed: (item: string, errorMessage?: string) => 
      error(`Failed to upload ${item}`, errorMessage),
    downloadFailed: (item: string, errorMessage?: string) => 
      error(`Failed to download ${item}`, errorMessage),
    sendFailed: (item: string, errorMessage?: string) => 
      error(`Failed to send ${item}`, errorMessage),
    networkError: () => error('Network error', 'Please check your internet connection'),
    serverError: () => error('Server error', 'Please try again later'),
    unauthorized: () => error('Unauthorized', 'You do not have permission to perform this action'),
    
    // Warning messages
    unsavedChanges: () => warning('Unsaved changes', 'You have unsaved changes that will be lost'),
    quotaExceeded: (resource: string) => 
      warning('Quota exceeded', `You have reached your ${resource} limit`),
    offline: () => warning('Offline', 'You are currently offline. Some features may not be available.'),
    
    // Info messages
    loading: () => info('Loading...', 'Please wait'),
    processing: () => info('Processing...', 'This may take a moment'),
    savedAsDraft: () => info('Saved as draft', 'You can continue editing later'),
    noChanges: () => info('No changes', 'No changes were made'),
  };

  return {
    ...toast,
    success,
    error,
    warning,
    info,
    custom,
    messages,
  };
}
