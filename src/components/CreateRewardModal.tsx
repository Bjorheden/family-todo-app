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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
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
        description: description.trim() || undefined,
        points_required: Number(pointsRequired),
        family_id: familyId,
        created_by: currentUserId,
        is_active: true,
      };

      await onSubmit(rewardData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setPointsRequired('');
      
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
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New Reward</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reward Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Extra allowance, Movie night, etc."
              placeholderTextColor="#999"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this reward includes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Points Required Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Points Required *</Text>
            <TextInput
              style={styles.input}
              value={pointsRequired}
              onChangeText={setPointsRequired}
              placeholder="e.g. 50"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Preview Card */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>
                {title || 'Reward Title'}
              </Text>
              {description && (
                <Text style={styles.previewDescription}>{description}</Text>
              )}
              <View style={styles.previewFooter}>
                <Text style={styles.previewPoints}>
                  {pointsRequired || '0'} points
                </Text>
                <Text style={styles.previewStatus}>New Reward</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Reward'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212529',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  previewSection: {
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  previewStatus: {
    fontSize: 12,
    color: '#6200EA',
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    backgroundColor: '#6200EA',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});