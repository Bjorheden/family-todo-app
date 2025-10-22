import { supabase } from './supabase';
import { Reward, RewardClaim } from '../types';

export class RewardService {
  // Get all active rewards for a family
  static async getFamilyRewards(familyId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create new reward (admin only)
  static async createReward(reward: Omit<Reward, 'id' | 'created_at'>, userRole?: string): Promise<Reward> {
    // Client-side validation: only admins can create rewards
    if (userRole && userRole !== 'admin') {
      throw new Error('Only family admins can create rewards');
    }

    const { data, error } = await supabase
      .from('rewards')
      .insert([{
        ...reward,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Claim a reward
  static async claimReward(rewardId: string, userId: string, pointsRequired: number): Promise<void> {
    // Start transaction by creating the claim record
    const { data: claimData, error: claimError } = await supabase
      .from('reward_claims')
      .insert([
        {
          user_id: userId,
          reward_id: rewardId,
          status: 'approved',
          claimed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (claimError) throw claimError;

    // Deduct points from user using RPC function
    const { error: pointsError } = await supabase.rpc('deduct_user_points', {
      user_id: userId,
      points_to_deduct: pointsRequired
    });

    if (pointsError) {
      // If points deduction fails, rollback the claim
      await supabase
        .from('reward_claims')
        .delete()
        .eq('id', claimData.id);
      
      throw pointsError;
    }
  }

  // Delete reward (admin only)
  static async deleteReward(rewardId: string): Promise<void> {
    const { data, error } = await supabase
      .from('rewards')
      .update({ is_active: false }) // Soft delete by marking as inactive
      .eq('id', rewardId)
      .select();

    if (error) {
      console.error('RewardService: Delete error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('RewardService: No reward was deleted - may not exist or no permission');
      throw new Error('Reward could not be deleted. You may not have permission or the reward may not exist.');
    }
  }

  // Update reward (admin only)
  static async updateReward(rewardId: string, updates: Partial<Omit<Reward, 'id' | 'created_at' | 'family_id'>>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user's claimed rewards
  static async getUserClaimedRewards(userId: string): Promise<(RewardClaim & { reward: Reward; user: { full_name: string } })[]> {
    const { data, error } = await supabase
      .from('reward_claims')
      .select(`
        *,
        reward:rewards(*),
        user:users(full_name)
      `)
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get all reward claims for a family (admin only)
  static async getFamilyRewardClaims(familyId: string): Promise<(RewardClaim & { reward: Reward; user: { full_name: string } })[]> {
    const { data, error } = await supabase
      .from('reward_claims')
      .select(`
        *,
        reward:rewards!inner(*),
        user:users(full_name)
      `)
      .eq('reward.family_id', familyId)
      .order('claimed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update reward claim status (admin only)
  static async updateRewardClaimStatus(claimId: string, status: 'approved' | 'denied'): Promise<RewardClaim> {
    const updateData: any = { 
      status,
      processed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reward_claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const rewardService = RewardService;