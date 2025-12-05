"use client";

import { Wifi, WifiOff, Sync, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSyncStatus } from "@/lib/offline/hooks";
import { useState } from "react";
import { toast } from "sonner";

interface SyncStatusIndicatorProps {
  tenantId: string;
  className?: string;
}

export function SyncStatusIndicator({ tenantId, className }: SyncStatusIndicatorProps) {
  const { isOnline, pendingMutations, lastSync, syncInProgress, manualSync } = useSyncStatus(tenantId);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await manualSync();
      toast.success("Sync completed successfully");
    } catch (error) {
      toast.error("Sync failed. Please try again later");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return "Never";
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (isOnline && pendingMutations === 0) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <Wifi className="w-4 h-4" />
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">All synced</span>
        <Badge variant="outline" className="text-xs">
          {formatLastSync(lastSync)}
        </Badge>
      </div>
    );
  }

  if (isOnline && pendingMutations > 0) {
    return (
      <div className={`flex items-center gap-2 text-amber-600 ${className}`}>
        <Wifi className="w-4 h-4" />
        <Sync className={`w-4 h-4 ${syncInProgress || isSyncing ? 'animate-spin' : ''}`} />
        <span className="text-sm">
          {pendingMutations} pending change{pendingMutations > 1 ? 's' : ''}
        </span>
        <Badge variant="outline" className="text-xs">
          Last: {formatLastSync(lastSync)}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={syncInProgress || isSyncing}
          className="h-6 px-2 text-xs"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Offline</span>
        {pendingMutations > 0 && (
          <Badge variant="destructive" className="text-xs">
            {pendingMutations} pending
          </Badge>
        )}
      </div>
    );
  }

  return null;
}

// Compact version for mobile or tight spaces
export function CompactSyncStatus({ tenantId, className }: SyncStatusIndicatorProps) {
  const { isOnline, pendingMutations, syncInProgress } = useSyncStatus(tenantId);

  if (isOnline && pendingMutations === 0) {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${className}`}>
        <CheckCircle className="w-3 h-3" />
      </div>
    );
  }

  if (isOnline && pendingMutations > 0) {
    return (
      <div className={`flex items-center gap-1 text-amber-600 ${className}`}>
        <Sync className={`w-3 h-3 ${syncInProgress ? 'animate-spin' : ''}`} />
        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
          {pendingMutations}
        </Badge>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={`flex items-center gap-1 text-red-600 ${className}`}>
        <WifiOff className="w-3 h-3" />
        {pendingMutations > 0 && (
          <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
            {pendingMutations}
          </Badge>
        )}
      </div>
    );
  }

  return null;
}

// Full sync status panel for settings page
export function SyncStatusPanel({ tenantId }: { tenantId: string }) {
  const { isOnline, pendingMutations, lastSync, syncInProgress, manualSync } = useSyncStatus(tenantId);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await manualSync();
      toast.success("Sync completed successfully");
    } catch (error) {
      toast.error("Sync failed. Please try again later");
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return "Never";
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Sync Status</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pending Changes</span>
          <Badge variant={pendingMutations > 0 ? "secondary" : "outline"}>
            {pendingMutations} items
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Last Sync</span>
          <span className="text-sm text-muted-foreground">
            {formatLastSync(lastSync)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Sync Status</span>
          <div className="flex items-center gap-2">
            {syncInProgress || isSyncing ? (
              <>
                <Sync className="w-4 h-4 animate-spin text-amber-600" />
                <span className="text-sm text-amber-600">Syncing...</span>
              </>
            ) : pendingMutations > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-600">Pending</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Up to date</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleManualSync}
            disabled={!isOnline || (syncInProgress || isSyncing) || pendingMutations === 0}
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          {!isOnline && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Connect to internet to sync changes
            </p>
          )}
          {isOnline && pendingMutations === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              All changes are synced
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
