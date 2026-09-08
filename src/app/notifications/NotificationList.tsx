"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAsReadAction, markAllAsReadAction, clearNotificationsAction } from "./actions";
import { Card, CardContent } from "@/components/ui/card";

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    startTransition(() => {
      markAsReadAction(id);
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(() => {
      markAllAsReadAction();
    });
  };

  const handleClearAll = () => {
    startTransition(() => {
      clearNotificationsAction();
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "alert": return <XCircle className="h-5 w-5 text-red-500" />;
      case "info":
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-lg bg-card border-dashed">
        <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-500/50" />
        <p className="text-lg font-medium">All caught up!</p>
        <p className="text-sm">You have no new notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isPending || !notifications.some(n => !n.isRead)}>
          <Check className="h-4 w-4 mr-2" />
          Mark all as read
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={isPending}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear all
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id} className={notification.isRead ? "bg-muted/30" : "bg-card shadow-sm border-primary/20"}>
            <CardContent className="p-4 flex gap-4 items-start">
              <div className="mt-1 flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${notification.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>
              {!notification.isRead && (
                <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)} disabled={isPending}>
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
