import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RewardItem, CreateRewardModal } from '../components';
import { Reward, User, RewardClaim } from '../types';
import { RewardService } from '../services';

interface RewardsScreenProps {
  currentUser: User;
  familyMembers: User[];
  onUserDataUpdate: () => Promise<void>;
}

type RewardTab = 'available' | 'claimed' | 'pending';
type ClaimedRewardWithDetails = RewardClaim & { reward: Reward; user: { full_name: string } };

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ 
  currentUser, 
  familyMembers,
  onUserDataUpdate
}) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedRewardWithDetails[]>([]);
  const [pendingRewards, setPendingRewards] = useState<ClaimedRewardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<RewardTab>('available');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);  // For admin filtering

  const loadRewards = async () => {
    try {
      const rewards = await RewardService.getFamilyRewards(currentUser.family_id!);
      setRewards(rewards);
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const loadClaimedRewards = async () => {
    try {
      if (currentUser.role === 'admin') {
        // Load all family claims for admin
        const claims = await RewardService.getFamilyRewardClaims(currentUser.family_id!);
        setClaimedRewards(claims as ClaimedRewardWithDetails[]);
      } else {
        // Load only user's own claims
        const claims = await RewardService.getUserClaimedRewards(currentUser.id);
        setClaimedRewards(claims as ClaimedRewardWithDetails[]);
      }
    } catch (error) {
      console.error('Error loading claimed rewards:', error);
    }
  };

  const loadPendingRewards = async () => {
    try {
      if (currentUser.role === 'admin') {
        // Load pending reward claims that require approval
        const claims = await RewardService.getFamilyRewardClaims(currentUser.family_id!);
        const pendingClaims = claims.filter((claim: any) => 
          claim.status === 'pending' && claim.reward.requires_approval
        );
        setPendingRewards(pendingClaims as ClaimedRewardWithDetails[]);
      }
    } catch (error) {
      console.error('Error loading pending rewards:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const promises = [loadRewards(), loadClaimedRewards()];
      if (currentUser.role === 'admin') {
        promises.push(loadPendingRewards());
      }
      await Promise.all(promises);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
    onUserDataUpdate(); // Refresh user data to get current points
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAllData(),
      onUserDataUpdate() // Refresh user data to get updated points
    ]);
  };

  const handleRewardPress = (reward: Reward) => {
    // Check if user already has a pending claim for this reward
    const existingPendingClaim = claimedRewards.find(claim => 
      claim.reward_id === reward.id && 
      claim.user_id === currentUser.id && 
      claim.status === 'pending'
    );

    if (currentUser.points >= reward.points_required || reward.requires_approval) {
      let message = `Do you want to claim "${reward.title}" for 💰 ${reward.points_required}?`;
      
      if (reward.requires_approval) {
        message += '\n\nThis reward requires admin approval.';
      }
      
      if (existingPendingClaim) {
        message += '\n\n⚠️ You already have a pending claim for this reward.';
      }

      Alert.alert(
        'Claim Reward',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: existingPendingClaim ? 'Claim Again' : 'Claim', onPress: () => claimReward(reward) },
        ]
      );
    } else {
      Alert.alert(
        'Not Enough Points',
        `You need 💰 ${reward.points_required - currentUser.points} more to claim this reward.`
      );
    }
  };

  const claimReward = async (reward: Reward) => {
    try {
      console.log('🎁 Claiming reward:', { 
        rewardTitle: reward.title, 
        requiresApproval: reward.requires_approval,
        userId: currentUser.id,
        userRole: currentUser.role 
      });

      if (reward.requires_approval) {
        // Create a pending claim without deducting points
        await RewardService.createPendingRewardClaim(reward.id, currentUser.id);
        
        Alert.alert(
          'Claim Submitted!',
          `Your claim for "${reward.title}" has been submitted for admin approval.`
        );

        // Refresh pending rewards (if admin) and claimed rewards
        if (currentUser.role === 'admin') {
          await loadPendingRewards();
        }
        await loadClaimedRewards();
      } else {
        console.log('⚡ Reward does not require approval - immediate claim');
        // Process immediate claim with point deduction
        await RewardService.claimReward(reward.id, currentUser.id, reward.points_required);

        Alert.alert(
          'Reward Claimed!',
          `You have successfully claimed "${reward.title}" for ${reward.points_required} points!`
        );

        // Refresh user data and claimed rewards
        await onUserDataUpdate();
        await loadClaimedRewards();
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Could not claim reward. Please try again.');
    }
  };

  const handleCreateReward = async (rewardData: Omit<Reward, 'id' | 'created_at'>) => {
    try {
      await RewardService.createReward(rewardData, currentUser.role);

      Alert.alert('Success', 'Reward created successfully!');
      await loadRewards(); // Reload rewards to show the new one
    } catch (error: any) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', error.message || 'Failed to create reward');
      throw error; // Re-throw to let the modal handle loading state
    }
  };

  const handleApproveReward = async (claimId: string, rewardTitle: string) => {
    try {
      await RewardService.updateRewardClaimStatus(claimId, 'approved');
      Alert.alert('Success', `Reward claim for "${rewardTitle}" approved!`);
      await Promise.all([loadClaimedRewards(), loadPendingRewards()]);
    } catch (error) {
      console.error('Error approving claim:', error);
      Alert.alert('Error', 'Failed to approve the reward claim.');
    }
  };

  const handleDenyReward = async (claimId: string, rewardTitle: string) => {
    try {
      await RewardService.updateRewardClaimStatus(claimId, 'denied');
      Alert.alert('Success', `Reward claim for "${rewardTitle}" denied.`);
      await Promise.all([loadClaimedRewards(), loadPendingRewards()]);
    } catch (error) {
      console.error('Error denying claim:', error);
      Alert.alert('Error', 'Failed to deny the reward claim.');
    }
  };

  const getFilteredClaimedRewards = () => {
    if (selectedUserId === null || currentUser.role !== 'admin') {
      return claimedRewards;
    }
    
    return claimedRewards.filter(claim => claim.user_id === selectedUserId);
  };

  const renderReward = ({ item }: { item: Reward }) => {
    // Count pending claims for this specific reward by this user
    const pendingClaimsCount = claimedRewards.filter(claim => 
      claim.reward_id === item.id && 
      claim.user_id === currentUser.id && 
      claim.status === 'pending'
    ).length;

    return (
      <RewardItem
        reward={item}
        userPoints={currentUser.points}
        onPress={() => handleRewardPress(item)}
        pendingClaimsCount={pendingClaimsCount}
      />
    );
  };

    const renderClaimedReward = ({ item }: { item: ClaimedRewardWithDetails }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return '#4CAF50';
        case 'pending': return '#FF9800';
        case 'denied': return '#F44336';
        default: return '#757575';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'approved': return 'Approved';
        case 'pending': return 'Pending';
        case 'denied': return 'Denied';
        default: return 'Unknown';
      }
    };

    return (
      <View style={styles.claimedRewardCard}>
        <View style={styles.claimedRewardHeader}>
          <View style={styles.claimedRewardInfo}>
            <Text style={styles.claimedRewardTitle}>{item.reward.title}</Text>
            {currentUser.role === 'admin' && (
              <Text style={styles.claimedRewardUser}>By: {item.user.full_name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) || '#757575' }]}>
            <Text style={styles.statusText}>
              {getStatusText(item.status) || 'Unknown'}
            </Text>
          </View>
        </View>
        
        {item.reward.description && (
          <Text style={styles.claimedRewardDescription}>{item.reward.description}</Text>
        )}
        
          <Text style={styles.claimedRewardPoints}>💰 {item.reward.points_required}</Text>
          <Text style={styles.claimedRewardDate}>
            Claimed: {new Date(item.claimed_at).toLocaleDateString()}
          </Text>

        {currentUser.role === 'admin' && item.status === 'pending' && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApproveReward(item.id, item.reward.title)}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.denyButton}
              onPress={() => handleDenyReward(item.id, item.reward.title)}
            >
              <Text style={styles.actionButtonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading rewards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <View style={styles.headerRight}>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsValue}>💰 {currentUser.points}</Text>
          </View>
          
          {currentUser.role === 'admin' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonIcon}>+</Text>
              <Text style={styles.addButtonText}>New Reward</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'claimed' && styles.activeTab]}
          onPress={() => setActiveTab('claimed')}
        >
          <Text style={[styles.tabText, activeTab === 'claimed' && styles.activeTabText]}>
            Claimed
          </Text>
        </TouchableOpacity>
        {currentUser.role === 'admin' && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
              Pending
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* User Filter for Admin (only on claimed tab) */}
      {activeTab === 'claimed' && currentUser.role === 'admin' && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by user:</Text>
          <View style={styles.userFilterContainer}>
            <TouchableOpacity
              style={[styles.userFilterButton, !selectedUserId && styles.activeUserFilter]}
              onPress={() => setSelectedUserId(null)}
            >
              <Text style={[styles.userFilterText, !selectedUserId && styles.activeUserFilterText]}>
                All Users
              </Text>
            </TouchableOpacity>
            {familyMembers?.map(member => (
              <TouchableOpacity
                key={member.id}
                style={[styles.userFilterButton, selectedUserId === member.id && styles.activeUserFilter]}
                onPress={() => setSelectedUserId(member.id)}
              >
                <Text style={[styles.userFilterText, selectedUserId === member.id && styles.activeUserFilterText]}>
                  {member.full_name || 'Unknown'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Content based on active tab */}
      {activeTab === 'available' ? (
        <FlatList
          data={rewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rewards available</Text>
              <Text style={styles.emptySubtext}>
                The administrator has not created any rewards yet
              </Text>
            </View>
          }
        />
      ) : activeTab === 'claimed' ? (
        <FlatList
          data={getFilteredClaimedRewards()}
          renderItem={renderClaimedReward}
          keyExtractor={(item) => `claimed-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No claimed rewards</Text>
              <Text style={styles.emptySubtext}>
                {selectedUserId 
                  ? 'This user hasn\'t claimed any rewards yet'
                  : 'No one has claimed any rewards yet'
                }
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingRewards}
          renderItem={renderClaimedReward}
          keyExtractor={(item) => `pending-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending approvals</Text>
              <Text style={styles.emptySubtext}>
                All reward claims have been processed
              </Text>
            </View>
          }
        />
      )}

      {currentUser.role === 'admin' && (
        <CreateRewardModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReward}
          familyId={currentUser.family_id!}
          currentUserId={currentUser.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 4,
  },
  addButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6200EA',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#6200EA',
    fontWeight: '600',
  },
  // Filter styles
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  userFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    marginBottom: 8,
  },
  activeUserFilter: {
    backgroundColor: '#6200EA',
    borderColor: '#6200EA',
  },
  userFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeUserFilterText: {
    color: '#fff',
  },
  // Claimed reward styles
  claimedRewardCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  claimedRewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  claimedRewardInfo: {
    flex: 1,
    marginRight: 12,
  },
  claimedRewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  claimedRewardUser: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  claimedRewardDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
  },
  approvedBadge: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  deniedBadge: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingText: {
    color: '#856404',
  },
  approvedText: {
    color: '#155724',
  },
  deniedText: {
    color: '#721c24',
  },
  claimedRewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  claimedRewardPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200EA',
    marginBottom: 12,
  },
  adminActions: {
    flexDirection: 'row',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 4,
  },
  denyButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});