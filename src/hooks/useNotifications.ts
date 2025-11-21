import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'wave' | 'proxy_request' | 'event_update' | 'payment' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at: string | null;
  sent_at: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const loadNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          getNotifications(50),
          getUnreadNotificationsCount(),
        ]);
        setNotifications(notifs as Notification[]);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new notifications via Realtime
    channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          // Reload notifications when new one is created
          await loadNotifications();

          // Call Edge Function to send push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: payload.new as Notification,
            });
          } catch (error) {
            console.error('Error sending push notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: async () => {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(50),
        getUnreadNotificationsCount(),
      ]);
      setNotifications(notifs as Notification[]);
      setUnreadCount(count);
      setLoading(false);
    },
  };
};

