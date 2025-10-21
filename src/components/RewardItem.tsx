import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reward } from '../types';

interface RewardItemProps {
  reward: Reward;
  userPoints: number;
  onPress: () => void;
}

export const RewardItem: React.FC<RewardItemProps> = ({ reward, userPoints, onPress }) => {
  const canAfford = userPoints >= reward.points_required;

  return (
    <TouchableOpacity 
      style={[styles.container, !canAfford && styles.disabledContainer]} 
      onPress={onPress}
      disabled={!canAfford}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{reward.title}</Text>
        {reward.description && (
          <Text style={styles.description}>{reward.description}</Text>
        )}
        <View style={styles.footer}>
          <Text style={[styles.points, !canAfford && styles.disabledText]}>
            {reward.points_required} points
          </Text>
          {canAfford ? (
            <Text style={styles.affordable}>Can claim!</Text>
          ) : (
            <Text style={styles.notAffordable}>
              Need {reward.points_required - userPoints} more points
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  disabledText: {
    color: '#999',
  },
  affordable: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  notAffordable: {
    fontSize: 12,
    color: '#F44336',
  },
});