import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface SettingsScreenProps {
  currentUser: User;
  onLogout: () => void;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  currentUser, 
  onLogout, 
  onClose 
}) => {
  const insets = useSafeAreaInsets();
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: performLogout },
      ]
    );
  };

  const performLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'About Family Todo App',
      'Version 1.0.0\n\nA collaborative task management app for families.\n\nBuilt with React Native and Supabase.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser.full_name}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
            <Text style={styles.userRole}>
              Role: {currentUser.role === 'admin' ? 'Family Admin' : 'Family Member'}
            </Text>
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
            <Text style={styles.settingItemText}>About</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  userInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  userRole: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  settingItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
  },
  settingItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
    textAlign: 'center',
  },
});