/**
 * Confirmation Dialog Components
 * Reusable confirmation dialogs for destructive actions and important decisions
 */

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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Trash2,
  Archive,
  Ban,
  Power,
  Download,
  Upload,
  Mail,
  UserX,
  Key,
  RefreshCw,
} from 'lucide-react';

interface BaseConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive';
}

export function BaseConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
  variant = 'default',
}: BaseConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirm}
              disabled={loading}
              variant={variant}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Delete confirmation dialog
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Bulk delete confirmation dialog
export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  count,
  itemType = 'items',
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  itemType?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${count} ${itemType}?`}
      description={`Are you sure you want to delete ${count} selected ${itemType}? This action cannot be undone.`}
      confirmText={`Delete ${count} ${itemType}`}
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Archive confirmation dialog
export function ArchiveConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Archive ${itemType}?`}
      description={`Are you sure you want to archive "${itemName}"? You can restore it later if needed.`}
      confirmText="Archive"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// Deactivate confirmation dialog
export function DeactivateConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Deactivate ${itemType}?`}
      description={`Are you sure you want to deactivate "${itemName}"? It will no longer be accessible but can be reactivated later.`}
      confirmText="Deactivate"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Remove user confirmation dialog
export function RemoveUserConfirmDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove team member?"
      description={`Are you sure you want to remove "${userName}" from your team? They will lose access to this farm.`}
      confirmText="Remove"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Revoke API key confirmation dialog
export function RevokeKeyConfirmDialog({
  open,
  onOpenChange,
  keyName,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revoke API key?"
      description={`Are you sure you want to revoke the API key "${keyName}"? All applications using this key will lose access.`}
      confirmText="Revoke"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Reset data confirmation dialog
export function ResetDataConfirmDialog({
  open,
  onOpenChange,
  dataType,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataType: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Reset ${dataType}?`}
      description={`This will permanently delete all ${dataType.toLowerCase()} and cannot be undone. Please backup your data before proceeding.`}
      confirmText="Reset Data"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
      variant="destructive"
    />
  );
}

// Export confirmation dialog
export function ExportConfirmDialog({
  open,
  onOpenChange,
  dataType,
  format = 'CSV',
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataType: string;
  format?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Export ${dataType}?`}
      description={`Prepare to export your ${dataType.toLowerCase()} in ${format} format. You will receive a download link via email.`}
      confirmText="Export"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// Import confirmation dialog
export function ImportConfirmDialog({
  open,
  onOpenChange,
  fileName,
  recordCount,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  recordCount: number;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Import data?"
      description={`Ready to import ${recordCount} records from "${fileName}". Existing data may be updated.`}
      confirmText="Import Data"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// Send invitation confirmation dialog
export function SendInviteConfirmDialog({
  open,
  onOpenChange,
  email,
  role,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  role: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Send invitation?"
      description={`Send an invitation to ${email} to join your farm as a ${role.toLowerCase()}.`}
      confirmText="Send Invite"
      cancelText="Cancel"
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}

// Custom confirmation dialog with actions
interface CustomConfirmDialogProps extends BaseConfirmDialogProps {
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  extraInfo?: string;
}

export function CustomConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
  variant = 'default',
  icon,
  extraInfo,
}: CustomConfirmDialogProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-primary" />;
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn('max-w-md', getVariantClass())}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
            {extraInfo && (
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                {extraInfo}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={onConfirm}
              disabled={loading}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Quick action buttons with built-in confirmation
export function ConfirmButton({
  children,
  onConfirm,
  title,
  description,
  confirmText,
  loading = false,
  variant = 'default',
}: {
  children: React.ReactNode;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  loading?: boolean;
  variant?: 'default' | 'destructive';
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {children}
      </Button>
      <BaseConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmText={confirmText}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        loading={loading}
        variant={variant}
      />
    </>
  );
}

import React from 'react';
