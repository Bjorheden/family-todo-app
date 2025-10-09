import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LoginScreen, TasksScreen, RewardsScreen, FamilyScreen, FamilySetupScreen } from './src/screens';
import { authService } from './src/services/authService';
import { User } from './src/types';
import { supabase } from './src/services/supabase';

type Tab = 'tasks' | 'rewards' | 'family';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

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

    return () => subscription.unsubscribe();
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
      console.log('Loading user data...');
      const user = await authService.getCurrentUser();
      console.log('User loaded:', user);
      if (user) {
        setCurrentUser(user);
        await loadFamilyMembers(user.family_id);
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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
    console.log('Login success triggered, loading user data...');
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
          />
        );
      case 'rewards':
        return <RewardsScreen currentUser={currentUser} />;
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
});
