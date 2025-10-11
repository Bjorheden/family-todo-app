import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { User } from '../types';

interface HomeScreenProps {
  currentUser: User;
  notificationCount: number;
  pendingApprovals?: number; // Optional since only admins need this
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  currentUser, 
  notificationCount, 
  pendingApprovals = 0
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{currentUser.full_name}</Text>
        <Text style={styles.profileRole}>
          {currentUser.role === 'admin' ? 'Admin' : 'Me'}
        </Text>
      </View>

      <View style={styles.statsContainer}>

        {/* Points Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Points</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.pointsValue}>{currentUser.points}</Text>
            <Text style={styles.pointsLabel}>points</Text>
          </View>
        </View>

        {/* Notifications Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
          <View style={styles.cardContent}>
            {notificationCount > 0 ? (
              <>
                <Text style={styles.notificationCount}>{notificationCount}</Text>
                <Text style={styles.notificationLabel}>
                  {notificationCount === 1 ? 'unread messages' : 'unread messages'}
                </Text>
              </>
            ) : (
              <Text style={styles.noNotifications}>No new messages</Text>
            )}
          </View>
        </View>

        {/* Pending Approvals Card - Only for Admins */}
        {currentUser.role === 'admin' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pending Approvals</Text>
            </View>
            <View style={styles.cardContent}>
              {pendingApprovals > 0 ? (
                <>
                  <Text style={styles.approvalCount}>{pendingApprovals}</Text>
                  <Text style={styles.approvalLabel}>
                    {pendingApprovals === 1 ? 'task awaiting approval' : 'tasks awaiting approval'}
                  </Text>
                </>
              ) : (
                <Text style={styles.noApprovals}>All tasks approved</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 24,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
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
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#666',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666',
  },
  notificationCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  notificationLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noNotifications: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  approvalCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  approvalLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noApprovals: {
    fontSize: 16,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
});