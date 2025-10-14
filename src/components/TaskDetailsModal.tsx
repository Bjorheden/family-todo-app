import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task, User } from '../types';

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
  familyMembers: User[];
}

export function TaskDetailsModal({
  visible,
  task,
  onClose,
  onStatusChange,
  onDelete,
  currentUserId,
  isAdmin,
  familyMembers,
}: TaskDetailsModalProps) {
  const insets = useSafeAreaInsets();

  if (!task) return null;

  const getStatusColor = () => {
    switch (task.status) {
      case 'pending': return '#FFA726';
      case 'in_progress': return '#42A5F5';
      case 'completed': return '#66BB6A';
      case 'approved': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'approved': return 'Approved';
      default: return 'Unknown';
    }
  };

  const getAssignedToName = () => {
    if (task.assigned_to === currentUserId) {
      return 'You';
    }
    const assignedMember = familyMembers.find(member => member.id === task.assigned_to);
    return assignedMember?.full_name || 'Unknown User';
  };

  const getCreatedByName = () => {
    const creator = familyMembers.find(member => member.id === task.created_by);
    return creator?.full_name || 'Unknown User';
  };

  const canStartTask = () => {
    return task.assigned_to === currentUserId && task.status === 'pending';
  };

  const canCompleteTask = () => {
    return task.assigned_to === currentUserId && task.status === 'in_progress';
  };

  const canApproveTask = () => {
    return isAdmin && task.status === 'completed';
  };

  const canDeleteTask = () => {
    return isAdmin && onDelete;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Task Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.title}>{task.title || 'Unnamed Task'}</Text>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.description}>
              {task.description || 'No description provided'}
            </Text>
          </View>

          {/* Task Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Assigned to</Text>
              <Text style={styles.infoValue}>{getAssignedToName()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created by</Text>
              <Text style={styles.infoValue}>{getCreatedByName()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Points</Text>
              <Text style={styles.infoValue}>{task.points || 0} pts</Text>
            </View>
            {task.due_date && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(task.due_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Timestamps */}
          <View style={styles.section}>
            <Text style={styles.label}>Timeline</Text>
            <Text style={styles.timestamp}>
              Created: {new Date(task.created_at).toLocaleString()}
            </Text>
            {task.completed_at && (
              <Text style={styles.timestamp}>
                Completed: {new Date(task.completed_at).toLocaleString()}
              </Text>
            )}
            {task.approved_at && (
              <Text style={styles.timestamp}>
                Approved: {new Date(task.approved_at).toLocaleString()}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          {canStartTask() && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                console.log('Start button pressed in modal for task:', task.id);
                
                Alert.alert(
                  'Start Task',
                  'Do you want to start working on this task?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Start', 
                      onPress: () => {
                        console.log('Start confirmed in modal for task:', task.id);
                        onStatusChange(task.id, 'in_progress');
                        onClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>Start Task</Text>
            </TouchableOpacity>
          )}

          {canCompleteTask() && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                console.log('Complete button pressed in modal for task:', task.id);
                
                Alert.alert(
                  'Complete Task',
                  'Are you sure you have completed this task?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Complete', 
                      onPress: () => {
                        console.log('Complete confirmed in modal for task:', task.id);
                        onStatusChange(task.id, 'completed');
                        onClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>Mark Complete</Text>
            </TouchableOpacity>
          )}

          {canApproveTask() && (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => {
                console.log('Approve button pressed in modal for task:', task.id);
                
                Alert.alert(
                  'Approve Task',
                  'Do you want to approve this completed task? The user will receive their points.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Approve', 
                      onPress: () => {
                        console.log('Approve confirmed in modal for task:', task.id);
                        onStatusChange(task.id, 'approved');
                        onClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>Approve Task</Text>
            </TouchableOpacity>
          )}

          {canDeleteTask() && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                console.log('Delete button pressed in modal for task:', task.id);
                
                Alert.alert(
                  'Delete Task',
                  'Are you sure you want to delete this task? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        console.log('Delete confirmed in modal for task:', task.id);
                        onDelete!(task.id);
                        onClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>Delete Task</Text>
            </TouchableOpacity>
          )}
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
    padding: 20,
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
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: '48%',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  actionBar: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    flexDirection: 'row',
    gap: 12,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});