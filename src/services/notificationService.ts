// Quick notification service to test if notifications are working
import { supabase } from './supabase';
import { Notification } from '../types';

export class NotificationService {
  // Get notifications for current user
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

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

  // Create a new notification
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'task_completed' | 'task_assigned' | 'task_approved' | 'reward_claimed' | 'general',
    relatedRewardId?: string,
    relatedTaskId?: string
  ): Promise<void> {
    const notificationData = {
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      related_reward_id: relatedRewardId,
      related_task_id: relatedTaskId,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notificationData]);

    if (error) throw error;
  }

  // Send reward claim notification to admin
  static async notifyAdminRewardClaimed(
    adminUserId: string,
    userName: string,
    rewardTitle: string,
    requiresApproval: boolean,
    rewardId: string
  ): Promise<void> {
    const title = requiresApproval ? 'Reward Pending Approval' : 'Reward Claimed';
    const message = requiresApproval 
      ? `${userName} has claimed "${rewardTitle}" and is waiting for your approval.`
      : `${userName} has claimed "${rewardTitle}".`;

    await this.createNotification(
      adminUserId,
      title,
      message,
      'reward_claimed',
      rewardId
    );
  }

  // Send reward approval notification to user
  static async notifyUserRewardApproved(
    userId: string,
    rewardTitle: string,
    rewardId: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Reward Approved!',
      `Your claim for "${rewardTitle}" has been approved! Enjoy your reward!`,
      'reward_claimed',
      rewardId
    );
  }

  // Send reward denial notification to user
  static async notifyUserRewardDenied(
    userId: string,
    rewardTitle: string,
    rewardId: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      'Reward Claim Denied',
      `Your claim for "${rewardTitle}" has been denied. Please contact an admin for more information.`,
      'reward_claimed',
      rewardId
    );
  }
}

export const notificationService = NotificationService;