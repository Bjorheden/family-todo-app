import { supabase } from './supabase';
import { Task, Notification } from '../types';

export class TaskService {
  // Get all tasks for a family
  static async getFamilyTasks(familyId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get tasks assigned to a specific user
  static async getUserTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Create new task (admin only)
  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;

    // Create notification for the assigned user
    try {
      console.log('Creating notification for user:', task.assigned_to, 'task:', data.id);
      await this.createTaskNotification(task.assigned_to, data.id, 'task_assigned');
      console.log('Notification created successfully');
    } catch (error) {
      console.error('Failed to create task assignment notification:', error);
    }

    return data;
  }

  // Update task status
  static async updateTaskStatus(taskId: string, status: Task['status'], userId: string): Promise<Task> {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // If task is marked as completed, notify admin
    if (status === 'completed') {
      await this.createTaskNotification(data.created_by, taskId, 'task_completed');
    }

    // If task is approved by admin, add points to user
    if (status === 'approved') {
      await this.addPointsToUser(data.assigned_to, data.points);
      await this.createTaskNotification(data.assigned_to, taskId, 'task_approved');
    }

    return data;
  }

  // Add points to user
  private static async addPointsToUser(userId: string, points: number): Promise<void> {
    const { error } = await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    });

    if (error) throw error;
  }

  // Create notification
  private static async createTaskNotification(
    userId: string, 
    taskId: string, 
    type: 'task_assigned' | 'task_completed' | 'task_approved'
  ): Promise<void> {
    const messages = {
      task_assigned: 'You have received a new task!',
      task_completed: 'A task has been marked as completed!',
      task_approved: 'Your task has been approved! You have received points.'
    };

    const titles = {
      task_assigned: 'New Task',
      task_completed: 'Task Completed',
      task_approved: 'Task Approved'
    };

    const notification: Omit<Notification, 'id' | 'created_at'> = {
      user_id: userId,
      title: titles[type],
      message: messages[type],
      type,
      is_read: false,
      related_task_id: taskId
    };

    console.log('Inserting notification:', notification);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select();

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    } else {
      console.log('Notification inserted successfully:', data);
    }
  }

  // Delete task (admin only)
  static async deleteTask(taskId: string): Promise<void> {    
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .select(); // Add select to see if anything was actually deleted    
    if (error) {
      console.error('TaskService: Delete error:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('TaskService: No task was deleted - may not exist or no permission');
      throw new Error('Task could not be deleted. You may not have permission or the task may not exist.');
    }
  }
}

export const taskService = TaskService;