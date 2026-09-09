"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getNotificationsAction, 
  markNotificationReadAction, 
  markAllNotificationsReadAction 
} from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

// Define Notification type to match Prisma schema
type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    // Setting up a basic interval to refresh notifications could be done here, 
    // but for SIH Demo we'll refresh when the dropdown opens
  }, [fetchNotifications]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    await markNotificationReadAction(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = async () => {
    await markAllNotificationsReadAction();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
        )}
        <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-muted-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-default flex flex-col gap-1 ${notif.isRead ? 'opacity-70' : ''}`}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className={`text-sm ${notif.isRead ? 'text-muted-foreground' : 'font-medium'}`}>
                    {notif.message}
                  </p>
                  {!notif.isRead && (
                    <span className="h-2 w-2 mt-1 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="justify-center text-center cursor-pointer text-primary"
          onClick={() => {
            setOpen(false);
            router.push('/notifications');
          }}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
