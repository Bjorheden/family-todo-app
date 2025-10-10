// Quick notification service to test if notifications are working
import { supabase } from './supabase';
import { Notification } from '../types';

export class NotificationService {
  // Get notifications for current user
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    console.log('Fetching notifications for user:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    console.log('Notifications fetched:', data);
    return data || [];
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Count unread notifications
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }
}

export const notificationService = NotificationService;