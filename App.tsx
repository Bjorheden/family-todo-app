import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen, HomeScreen, TasksScreen, RewardsScreen, FamilyScreen, FamilySetupScreen } from './src/screens';
import { authService } from './src/services/authService';
import { notificationService } from './src/services/notificationService';
import { taskService } from './src/services/taskService';
import { User, Notification } from './src/types';
import { supabase } from './src/services/supabase';
import { NotificationModal } from './src/components/NotificationModal';

type Tab = 'home' | 'tasks' | 'rewards' | 'family';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setFamilyMembers([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await loadFamilyMembers(user.family_id);
        await loadNotificationCount(user.id);
        
        // Load pending approvals count for admins
        if (user.role === 'admin' && user.family_id) {
          await loadPendingApprovals(user.family_id);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await loadFamilyMembers(user.family_id);
        await loadNotificationCount(user.id);
        
        // Load pending approvals count for admins
        if (user.role === 'admin' && user.family_id) {
          await loadPendingApprovals(user.family_id);
        }
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadNotificationCount = async (userId: string) => {
    try {
      const count = await notificationService.getUnreadCount(userId);
      setNotificationCount(count);
      
      // Also log total notifications for debugging
      const allNotifications = await notificationService.getUserNotifications(userId);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadPendingApprovals = async (familyId: string) => {
    try {
      const count = await taskService.getPendingApprovalCount(familyId);
      setPendingApprovals(count);
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await notificationService.markAsRead(notification.id);
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      // Refresh notification count
      if (currentUser) {
        await loadNotificationCount(currentUser.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      // Refresh notification count
      if (currentUser) {
        await loadNotificationCount(currentUser.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const loadFamilyMembers = async (familyId?: string) => {
    if (!familyId) return;

    try {
      const members = await authService.getFamilyMembers(familyId);
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handleLoginSuccess = async () => {
    await loadUserData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setFamilyMembers([]);
    setActiveTab('home');
  };

  const handleFamilySetupComplete = async () => {
    await loadUserData();
  };

  const renderTabContent = () => {
    if (!currentUser) return null;

    // If user doesn't have a family, show family setup
    if (!currentUser.family_id) {
      return (
        <FamilySetupScreen
          currentUser={currentUser}
          onFamilyCreated={handleFamilySetupComplete}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            currentUser={currentUser}
            notificationCount={notificationCount}
            pendingApprovals={pendingApprovals}
          />
        );
      case 'tasks':
        return (
          <TasksScreen
            currentUser={currentUser}
            familyMembers={familyMembers}
            onTaskCreated={async () => {
              await loadNotificationCount(currentUser.id);
            }}
          />
        );
      case 'rewards':
        return (
          <RewardsScreen 
            currentUser={currentUser} 
            onUserDataUpdate={loadUserData}
          />
        );
      case 'family':
        return (
          <FamilyScreen
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centered}>
          <Text>Loading...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
        {/* Compact notification bar */}
        {currentUser?.family_id && (
          <View style={styles.compactNotificationBar}>
            <TouchableOpacity 
              style={styles.notificationIndicator}
              onPress={async () => {
                try {
                  const userNotifications = await notificationService.getUserNotifications(currentUser.id);
                  setNotifications(userNotifications);
                  setShowNotifications(true);
                } catch (error) {
                  console.error('Error fetching notifications:', error);
                  Alert.alert('Error', 'Failed to load notifications');
                }
              }}
            >
              <Text style={styles.notificationEmoji}>🔔</Text>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
              <Text style={styles.compactNotificationText}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.refreshIcon}
              onPress={async () => {
                await loadNotificationCount(currentUser.id);
                if (currentUser.role === 'admin' && currentUser.family_id) {
                  await loadPendingApprovals(currentUser.family_id);
                }
              }}
            >
              <Text style={styles.refreshEmoji}>🔄</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.content}>
          {renderTabContent()}
        </View>
        
        {/* Only show tab bar if user has a family */}
        {currentUser?.family_id && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'home' && styles.activeTab]}
            onPress={() => setActiveTab('home')}
          >
            <Text
              style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text
              style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}
            >
              Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text
              style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}
            >
              Rewards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'family' && styles.activeTab]}
            onPress={() => setActiveTab('family')}
          >
            <Text
              style={[styles.tabText, activeTab === 'family' && styles.activeTabText]}
            >
              Family
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="dark" />

      {/* Notifications Modal */}
      <NotificationModal
        visible={showNotifications}
        notifications={notifications}
        notificationCount={notificationCount}
        onClose={() => setShowNotifications(false)}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onMarkNotificationAsRead={markNotificationAsRead}
      />
    </SafeAreaView>
      </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f3e5f5',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#6200EA',
    fontWeight: 'bold',
  },
  compactNotificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  notificationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  notificationBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: -4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactNotificationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  refreshIcon: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshEmoji: {
    fontSize: 16,
  },
});
