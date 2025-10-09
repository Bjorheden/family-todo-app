import { supabase } from './supabase';
import { Task, Notification } from '../types';

export class TaskService {
  // Hämta alla uppgifter för en familj
  static async getFamilyTasks(familyId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Hämta uppgifter tilldelade till en specifik användare
  static async getUserTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Skapa ny uppgift (endast admin)
  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;

    // Skapa notifiering till den tilldelade användaren
    await this.createTaskNotification(task.assigned_to, data.id, 'task_assigned');

    return data;
  }

  // Uppdatera uppgiftsstatus
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

    // Om uppgiften markeras som slutförd, notifiera admin
    if (status === 'completed') {
      await this.createTaskNotification(data.created_by, taskId, 'task_completed');
    }

    // Om uppgiften godkänns av admin, lägg till poäng till användaren
    if (status === 'approved') {
      await this.addPointsToUser(data.assigned_to, data.points);
      await this.createTaskNotification(data.assigned_to, taskId, 'task_approved');
    }

    return data;
  }

  // Lägg till poäng till användare
  private static async addPointsToUser(userId: string, points: number): Promise<void> {
    const { error } = await supabase.rpc('add_user_points', {
      user_id: userId,
      points_to_add: points
    });

    if (error) throw error;
  }

  // Skapa notifiering
  private static async createTaskNotification(
    userId: string, 
    taskId: string, 
    type: 'task_assigned' | 'task_completed' | 'task_approved'
  ): Promise<void> {
    const messages = {
      task_assigned: 'Du har fått en ny uppgift!',
      task_completed: 'En uppgift har markerats som slutförd!',
      task_approved: 'Din uppgift har godkänts! Du har fått poäng.'
    };

    const titles = {
      task_assigned: 'Ny uppgift',
      task_completed: 'Uppgift slutförd',
      task_approved: 'Uppgift godkänd'
    };

    const notification: Omit<Notification, 'id' | 'created_at'> = {
      user_id: userId,
      title: titles[type],
      message: messages[type],
      type,
      is_read: false,
      related_task_id: taskId
    };

    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) console.error('Failed to create notification:', error);
  }

  // Ta bort uppgift (endast admin)
  static async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
}

export const taskService = TaskService;