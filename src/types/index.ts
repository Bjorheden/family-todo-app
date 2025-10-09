// Användare och familj
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  family_id?: string;
  role: 'admin' | 'member';
  points: number;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  admin_id: string;
  created_at: string;
}

// Uppgifter
export interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  assigned_to: string;
  created_by: string;
  family_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  due_date?: string;
  completed_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Belöningar
export interface Reward {
  id: string;
  title: string;
  description?: string;
  points_required: number;
  family_id: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
}

// Notifieringar
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task_completed' | 'task_assigned' | 'task_approved' | 'reward_claimed' | 'general';
  is_read: boolean;
  related_task_id?: string;
  related_reward_id?: string;
  created_at: string;
}

// Belöningsanspråk
export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: 'pending' | 'approved' | 'denied';
  claimed_at: string;
  processed_at?: string;
}