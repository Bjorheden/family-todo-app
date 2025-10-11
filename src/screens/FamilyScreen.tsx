import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { FamilyMemberCard } from '../components';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface FamilyScreenProps {
  currentUser: User;
  onLogout: () => void;
}

export const FamilyScreen: React.FC<FamilyScreenProps> = ({ currentUser, onLogout }) => {
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const loadFamilyMembers = async () => {
    try {
      if (!currentUser.family_id) {
        console.log('No family_id found for current user');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('family_id', currentUser.family_id)
        .order('points', { ascending: false });

      if (error) {
        console.error('Supabase error loading family members:', error);
        throw error;
      }
      
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, [currentUser.family_id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFamilyMembers();
  };

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

  const handleShowInviteCode = () => {
    if (!currentUser.family_id) return;
    
    Alert.alert(
      'Family Invitation Code',
      `Share this code with family members to join:\n\n${currentUser.family_id}\n\nThey can use this code in the "Join Family" option when setting up the app.`,
      [
        { text: 'Copy Code', onPress: () => {
          // In a real app, you'd copy to clipboard here
          console.log('Family code:', currentUser.family_id);
        }},
        { text: 'OK' }
      ]
    );
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      // TODO: Implement family invitation logic
      // This would typically involve sending an invitation email
      // and creating a pending invitation record

      Alert.alert(
        'Invitation sent!',
        `An invitation has been sent to ${inviteEmail}`
      );
      
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting member:', error);
      Alert.alert('Error', 'Could not send invitation. Please try again.');
    }
  };

  const renderMember = ({ item }: { item: User }) => (
    <FamilyMemberCard member={item} />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading family members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Family</Text>
        <View style={styles.headerButtons}>
          {currentUser.role === 'admin' && (
            <>
              <TouchableOpacity
                style={styles.codeButton}
                onPress={handleShowInviteCode}
              >
                <Text style={styles.codeButtonText}>Family Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={familyMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No family members</Text>
          </View>
        }
      />

      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invite family member</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleInviteMember}
              >
                <Text style={styles.submitButtonText}>Send invitation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  codeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#6200EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6200EA',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});