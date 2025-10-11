import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { RewardItem } from '../components';
import { Reward, User } from '../types';
import { supabase } from '../services/supabase';

interface RewardsScreenProps {
  currentUser: User;
  onUserDataUpdate: () => Promise<void>;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ currentUser, onUserDataUpdate }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', currentUser.family_id)
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRewards();
    onUserDataUpdate(); // Refresh user data to get current points
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadRewards(),
      onUserDataUpdate() // Refresh user data to get updated points
    ]);
  };

  const handleRewardPress = (reward: Reward) => {
    if (currentUser.points >= reward.points_required) {
      Alert.alert(
        'Claim Reward',
        `Do you want to claim "${reward.title}" for ${reward.points_required} points?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Claim', onPress: () => claimReward(reward) },
        ]
      );
    } else {
      Alert.alert(
        'Not Enough Points',
        `You need ${reward.points_required - currentUser.points} more points to claim this reward.`
      );
    }
  };

  const claimReward = async (reward: Reward) => {
    try {
      const { error } = await supabase
        .from('reward_claims')
        .insert([
          {
            user_id: currentUser.id,
            reward_id: reward.id,
            status: 'pending',
            claimed_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      Alert.alert(
        'Reward Claimed!',
        'Your reward request has been sent and is waiting for approval.'
      );
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Could not claim reward. Please try again.');
    }
  };

  const renderReward = ({ item }: { item: Reward }) => (
    <RewardItem
      reward={item}
      userPoints={currentUser.points}
      onPress={() => handleRewardPress(item)}
    />
  );

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
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Your points:</Text>
          <Text style={styles.pointsValue}>{currentUser.points}</Text>
        </View>
      </View>

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
  pointsContainer: {
    alignItems: 'flex-end',
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
});