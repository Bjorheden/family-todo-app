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
}

export const FamilyScreen: React.FC<FamilyScreenProps> = ({ currentUser }) => {
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Family</Text>
        </View>
        
        {currentUser.role === 'admin' && (
          <View style={styles.adminSection}>
            <Text style={styles.adminSectionTitle}>Family Management</Text>
            <View style={styles.adminActionsRow}>
              <TouchableOpacity
                style={styles.codeButton}
                onPress={handleShowInviteCode}
              >
                <Text style={styles.codeButtonText}>📋 Family Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => setShowInviteModal(true)}
              >
                <Text style={styles.inviteButtonText}>✉️ Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  adminSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center',
  },
  adminActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#6200EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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