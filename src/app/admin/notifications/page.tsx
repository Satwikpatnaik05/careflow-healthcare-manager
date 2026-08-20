"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry(notificationId: string) {
    setRetryingId(notificationId);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Notification retried and delivered successfully!");
        fetchNotifications();
      } else {
        toast.error(data.error || "Retry attempt failed.");
      }
    } catch {
      toast.error("Network error during retry.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Notification Dispatch & Email Audit Logs
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit outbound booking confirmations, reminder cron dispatches, leave alerts, and medication reminders.
          </p>
        </div>

        <Button
          onClick={fetchNotifications}
          variant="outline"
          size="sm"
          className="text-xs font-semibold gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* Notifications Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((log) => (
            <Card
              key={log.id}
              className="border border-slate-200 shadow-card hover:border-teal-200 transition-all"
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      log.status === "SENT"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : log.status === "FAILED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{log.subject}</strong>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          log.status === "SENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : log.status === "FAILED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {log.type}
                      </span>
                    </div>

                    <p className="text-slate-500 mt-1">
                      <strong>To:</strong> {log.recipientEmail} ({log.recipientRole}) • Dispatched: {formatDateTime(log.createdAt)}
                    </p>

                    {log.lastError && (
                      <p className="text-rose-600 mt-1 font-mono text-[11px]">
                        Error: {log.lastError} (Retries: {log.retryCount})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    className="text-xs h-8 gap-1 font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5 text-teal-600" />
                    <span>View Email</span>
                  </Button>

                  {log.status === "FAILED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRetry(log.id)}
                      isLoading={retryingId === log.id}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-xs text-slate-400">
          No notification logs recorded yet.
        </Card>
      )}

      {/* View Email Content Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent onClose={() => setSelectedLog(null)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedLog.subject}</DialogTitle>
              <DialogDescription>
                To: {selectedLog.recipientEmail} • Status: {selectedLog.status}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 border rounded-xl p-4 bg-white max-h-[60vh] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: selectedLog.bodyHtml }}
                className="text-xs"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
