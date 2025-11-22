"use client";

import { useEffect, useState } from "react";
import { useTenantContext } from "@/components/tenant/TenantProvider";
import { subscribeToMilkLogs } from "@/lib/firebase/realtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface RealtimeMilkLogsProps {
  animalId: string;
}

export function RealtimeMilkLogs({ animalId }: RealtimeMilkLogsProps) {
  const { config } = useTenantContext();
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!config?.tenantId) return;

    // Subscribe to real-time milk logs
    const unsubscribe = subscribeToMilkLogs(config.tenantId, (logs) => {
      // Filter logs for this animal and get recent ones
      const animalLogs = logs
        .filter((log) => log.animalId === animalId)
        .sort((a, b) => {
          const dateA = a.timestamp || a.createdAt;
          const dateB = b.timestamp || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
        .slice(0, 5); // Show last 5 logs

      setRecentLogs(animalLogs);
    });

    return () => {
      unsubscribe();
    };
  }, [config?.tenantId, animalId]);

  if (recentLogs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Milk Logs (Live)</CardTitle>
        <CardDescription>Real-time updates when staff logs milk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentLogs.map((log, index) => (
            <div
              key={log.id || index}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <p className="font-medium">{log.date || "N/A"}</p>
                <p className="text-sm text-muted-foreground">
                  {log.session} - {log.quantity}L
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                {log.timestamp
                  ? format(new Date(log.timestamp), "HH:mm")
                  : log.createdAt
                  ? format(new Date(log.createdAt), "HH:mm")
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

