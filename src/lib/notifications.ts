import { supabase } from './supabase';
import { initializeFirebaseMessaging } from './firebaseMessaging';

/**
 * Register device token for push notifications
 */
export const registerDeviceToken = async (
  token: string,
  platform: 'web' | 'ios' | 'android' = 'web',
  deviceInfo?: Record<string, any>
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('register_device_token', {
      p_token: token,
      p_platform: platform,
      p_device_info: deviceInfo || null,
    });

    if (error) {
      throw new Error(`Failed to register device token: ${error.message}`);
    }
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
};

/**
 * Unregister device token
 */
export const unregisterDeviceToken = async (token: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('unregister_device_token', {
      p_token: token,
    });

    if (error) {
      console.error('Error unregistering device token:', error);
    }
  } catch (error) {
    console.error('Error unregistering device token:', error);
  }
};

/**
 * Initialize push notifications and register token
 */
export const initializePushNotifications = async (): Promise<void> => {
  try {
    // Request notification permission and get FCM token
    const token = await initializeFirebaseMessaging();
    
    if (token) {
      // Detect platform
      const platform = 'web'; // For web app, always 'web'
      
      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      };
      
      // Register token with Supabase
      await registerDeviceToken(token, platform, deviceInfo);
      console.log('Push notifications initialized and token registered');
    }
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
  }
};

/**
 * Get user's notifications
 */
export const getNotifications = async (limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

