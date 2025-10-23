import { RewardService } from '../rewardService';
import { NotificationService } from '../notificationService';
import { supabase } from '../supabase';

// Mock dependencies
jest.mock('../supabase');
jest.mock('../notificationService');

const mockSupabase = supabase as any;
const mockNotificationService = NotificationService as any;

describe('RewardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock notification service methods
    mockNotificationService.notifyAdminRewardClaimed = jest.fn().mockResolvedValue(undefined);
    mockNotificationService.notifyUserRewardApproved = jest.fn().mockResolvedValue(undefined);
    mockNotificationService.notifyUserRewardDenied = jest.fn().mockResolvedValue(undefined);
  });

  describe('getFamilyRewards', () => {
    it('should fetch rewards for a family', async () => {
      const mockRewards = [
        {
          id: '1',
          title: 'Test Reward',
          description: 'A test reward',
          points_required: 100,
          family_id: 'family1',
          created_by: 'admin1',
          is_active: true,
          requires_approval: false,
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRewards, error: null }),
      });

      const result = await RewardService.getFamilyRewards('family1');

      expect(mockSupabase.from).toHaveBeenCalledWith('rewards');
      expect(result).toEqual(mockRewards);
    });

    it('should throw error when database fails', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      await expect(RewardService.getFamilyRewards('family1')).rejects.toThrow('Database error');
    });
  });

  describe('createReward', () => {
    const mockRewardData = {
      title: 'New Reward',
      description: 'A new reward for testing',
      points_required: 200,
      family_id: 'family1',
      created_by: 'admin1',
      is_active: true,
      requires_approval: false
    };

    it('should create reward for admin users', async () => {
      const mockCreatedReward = {
        id: '123',
        ...mockRewardData,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedReward, error: null }),
      });

      const result = await RewardService.createReward(mockRewardData, 'admin');

      expect(mockSupabase.from).toHaveBeenCalledWith('rewards');
      expect(result).toEqual(mockCreatedReward);
    });

    it('should reject reward creation for non-admin users', async () => {
      await expect(RewardService.createReward(mockRewardData, 'member'))
        .rejects.toThrow('Only family admins can create rewards');
    });
  });

  describe('updateReward', () => {
    it('should update reward successfully', async () => {
      const updates = {
        title: 'Updated Reward',
        points_required: 150,
        requires_approval: true
      };

      const mockUpdatedReward = {
        id: 'reward1',
        ...updates,
        description: 'Original description',
        family_id: 'family1',
        created_by: 'admin1',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedReward, error: null }),
      });

      const result = await RewardService.updateReward('reward1', updates);

      expect(result).toEqual(mockUpdatedReward);
    });

    it('should throw error if update fails', async () => {
      const mockError = new Error('Update failed');
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      await expect(RewardService.updateReward('reward1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteReward', () => {
    it('should soft delete reward successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [{ id: 'reward1' }], error: null }),
      });

      await RewardService.deleteReward('reward1');

      expect(mockSupabase.from).toHaveBeenCalledWith('rewards');
    });
  });

  describe('getUserClaimedRewards', () => {
    it('should fetch user claimed rewards', async () => {
      const mockClaimedRewards = [
        {
          id: 'claim1',
          user_id: 'user1',
          reward_id: 'reward1',
          status: 'approved',
          claimed_at: '2023-01-01T00:00:00Z',
          reward: {
            id: 'reward1',
            title: 'Test Reward',
            points_required: 100
          },
          user: {
            full_name: 'Test User'
          }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockClaimedRewards, error: null }),
      });

      const result = await RewardService.getUserClaimedRewards('user1');

      expect(mockSupabase.from).toHaveBeenCalledWith('reward_claims');
      expect(result).toEqual(mockClaimedRewards);
    });
  });

  describe('getFamilyRewardClaims', () => {
    it('should fetch family reward claims', async () => {
      const mockFamilyClaims = [
        {
          id: 'claim1',
          user_id: 'user1',
          reward_id: 'reward1',
          status: 'pending',
          claimed_at: '2023-01-01T00:00:00Z',
          reward: {
            id: 'reward1',
            title: 'Test Reward',
            family_id: 'family1'
          },
          user: {
            full_name: 'Test User'
          }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockFamilyClaims, error: null }),
      });

      const result = await RewardService.getFamilyRewardClaims('family1');

      expect(result).toEqual(mockFamilyClaims);
    });
  });

  describe('updateRewardClaimStatus', () => {
    it('should approve reward claim and notify user', async () => {
      const mockClaim = {
        id: 'claim1',
        user_id: 'user1',
        reward_id: 'reward1',
        status: 'approved',
        claimed_at: '2023-01-01T00:00:00Z',
        reward: {
          title: 'Test Reward',
          points_required: 100
        }
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClaim, error: null }),
      });

      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await RewardService.updateRewardClaimStatus('claim1', 'approved');

      expect(result.status).toBe('approved');
      
      // Verify approval notification was sent
      expect(mockNotificationService.notifyUserRewardApproved).toHaveBeenCalledWith(
        'user1',
        'Test Reward',
        'reward1'
      );
    });

    it('should deny reward claim and notify user', async () => {
      const mockClaim = {
        id: 'claim1',
        user_id: 'user1',
        reward_id: 'reward1',
        status: 'denied',
        claimed_at: '2023-01-01T00:00:00Z',
        reward: {
          title: 'Test Reward',
          points_required: 100
        }
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClaim, error: null }),
      });

      const result = await RewardService.updateRewardClaimStatus('claim1', 'denied');

      expect(result.status).toBe('denied');
      
      // Verify denial notification was sent
      expect(mockNotificationService.notifyUserRewardDenied).toHaveBeenCalledWith(
        'user1',
        'Test Reward',
        'reward1'
      );
    });
  });
});