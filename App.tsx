import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { LoginScreen, TasksScreen, RewardsScreen, FamilyScreen, FamilySetupScreen } from './src/screens';
import { authService } from './src/services/authService';
import { notificationService } from './src/services/notificationService';
import { User, Notification } from './src/types';
import { supabase } from './src/services/supabase';

type Tab = 'tasks' | 'rewards' | 'family';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    setActiveTab('tasks');
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
      <SafeAreaView style={styles.centered}>
        <Text>Laddar...</Text>
      </SafeAreaView>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

    return (
      <SafeAreaView style={styles.container}>
        {/* Notification indicator - Always visible for debugging */}
        {currentUser?.family_id && (
          <View style={styles.notificationBanner}>
            <Text style={styles.notificationText}>
              {`🔔 Notifications: ${notificationCount || 0} unread`}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={async () => {
                  await loadNotificationCount(currentUser.id);
                }}
              >
                <Text style={styles.viewButtonText}>Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewButton}
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
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.content}>
          {renderTabContent()}
        </View>
        
        {/* Only show tab bar if user has a family */}
        {currentUser?.family_id && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text
              style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}
            >
              Uppgifter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text
              style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}
            >
              Belöningar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'family' && styles.activeTab]}
            onPress={() => setActiveTab('family')}
          >
            <Text
              style={[styles.tabText, activeTab === 'family' && styles.activeTabText]}
            >
              Familj
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="dark" />

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{`Notifications (${notificationCount || 0})`}</Text>
            <View style={styles.modalActions}>
              {notificationCount > 0 && (
                <TouchableOpacity 
                  onPress={async () => {
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
                      await loadNotificationCount(currentUser!.id);
                    } catch (error) {
                      console.error('Error marking all notifications as read:', error);
                    }
                  }}
                  style={styles.markAllButton}
                >
                  <Text style={styles.markAllButtonText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
                onPress={async () => {
                  if (!item.is_read) {
                    try {
                      await notificationService.markAsRead(item.id);
                      
                      // Update local state
                      setNotifications(prev => 
                        prev.map(n => 
                          n.id === item.id ? { ...n, is_read: true } : n
                        )
                      );
                      
                      // Refresh notification count
                      await loadNotificationCount(currentUser!.id);
                    } catch (error) {
                      console.error('Error marking notification as read:', error);
                    }
                  }
                }}
              >
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  {!item.is_read && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationDate}>
                  {`${new Date(item.created_at).toLocaleDateString()} ${new Date(item.created_at).toLocaleTimeString()}`}
                </Text>
                {!item.is_read && (
                  <Text style={styles.tapToRead}>Tap to mark as read</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyNotifications}>
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  notificationBanner: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#6200EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  unreadNotification: {
    borderLeftColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tapToRead: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  markAllButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
