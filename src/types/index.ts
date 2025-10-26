// Användare och familj
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  family_id: string | null;
  role: string | null; // 'admin' | 'member' but stored as string in DB
  points: number | null;
  created_at: string | null;
}

export interface Family {
  id: string;
  name: string;
  admin_id: string | null;
  created_at: string | null;
}

// Uppgifter
export interface Task {
  id: string;
  title: string;
  description: string | null;
  points: number;
  assigned_to: string | null;
  created_by: string | null;
  family_id: string | null;
  status: string | null; // 'pending' | 'in_progress' | 'completed' | 'approved' but stored as string in DB
  due_date: string | null;
  completed_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Rewards
export interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  family_id: string | null;
  created_by: string | null;
  is_active: boolean | null;
  requires_approval: boolean;
  created_at: string | null;
}

// Notifieringar
export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string; // 'task_completed' | 'task_assigned' | 'task_approved' | 'reward_claimed' | 'general' but stored as string in DB
  is_read: boolean | null;
  related_task_id: string | null;
  related_reward_id: string | null;
  created_at: string | null;
}

// Belöningsanspråk
export interface RewardClaim {
  id: string;
  user_id: string | null;
  reward_id: string | null;
  status: string | null; // 'pending' | 'approved' | 'denied' but stored as string in DB
  claimed_at: string | null;
  processed_at: string | null;
}