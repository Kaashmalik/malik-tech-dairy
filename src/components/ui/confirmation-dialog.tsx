'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Trash2, CheckCircle, XCircle } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'success' | 'default';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ConfirmationVariant, { icon: React.ReactNode; buttonClass: string }> = {
  danger: {
    icon: <Trash2 className="h-6 w-6 text-red-600" />,
    buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    buttonClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  success: {
    icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
  },
  default: {
    icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
  icon,
}: ConfirmationDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const styles = variantStyles[variant];
  const displayIcon = icon || styles.icon;
  const isProcessing = isLoading || loading;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onCancel?.();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
            {displayIcon}
          </div>
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel
            onClick={handleCancel}
            disabled={isProcessing}
            className="sm:min-w-[100px]"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`sm:min-w-[100px] ${styles.buttonClass}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for using confirmation dialog
interface UseConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
}

export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean;
    options: UseConfirmationOptions | null;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: null,
    resolve: null,
  });

  const confirm = React.useCallback(
    (options: UseConfirmationOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ open: true, options, resolve });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState({ open: false, options: null, resolve: null });
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState({ open: false, options: null, resolve: null });
  }, [state.resolve]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const ConfirmDialog = React.useCallback(() => {
    if (!state.options) return null;

    return (
      <ConfirmationDialog
        open={state.open}
        onOpenChange={handleOpenChange}
        title={state.options.title}
        description={state.options.description}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        variant={state.options.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [state.open, state.options, handleOpenChange, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
}

// Delete confirmation helper
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      variant="danger"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}