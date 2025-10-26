import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Reward } from '../types';

interface CreateRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rewardData: Omit<Reward, 'id' | 'created_at'>) => Promise<void>;
  familyId: string;
  currentUserId: string;
}

export function CreateRewardModal({
  visible,
  onClose,
  onSubmit,
  familyId,
  currentUserId,
}: CreateRewardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reward title');
      return;
    }

    if (!pointsRequired.trim() || isNaN(Number(pointsRequired)) || Number(pointsRequired) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of points');
      return;
    }

    try {
      setLoading(true);
      
      const rewardData: Omit<Reward, 'id' | 'created_at'> = {
        title: title.trim(),
        description: description.trim() || null,
        points_required: Number(pointsRequired),
        family_id: familyId,
        created_by: currentUserId,
        is_active: true,
        requires_approval: requiresApproval,
      };

      await onSubmit(rewardData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPointsRequired('');
      setRequiresApproval(false);
      
      onClose();
    } catch (error) {
      console.error('Error creating reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPointsRequired('');
    setRequiresApproval(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView style={styles.content}>
            <Text style={styles.title}>Create New Reward</Text>
            <Text style={styles.label}>Reward Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Extra allowance, Movie night, etc."
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this reward includes..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Points Required *</Text>
            <TextInput
              style={styles.input}
              value={pointsRequired}
              onChangeText={setPointsRequired}
              placeholder="e.g. 50"
              keyboardType="numeric"
            />

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setRequiresApproval(!requiresApproval)}
            >
              <View style={[styles.checkbox, requiresApproval && styles.checkboxChecked]}>
                {requiresApproval && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Requires admin approval before claiming
              </Text>
            </TouchableOpacity>

          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating...' : 'Create Reward'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    padding: 20,
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
  disabledButton: {
    opacity: 0.6,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#6200EA',
    backgroundColor: '#6200EA',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});