import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress, 
  onStatusChange, 
  onDelete,
  currentUserId, 
  isAdmin 
}) => {
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
      case 'completed': return 'Complete';
      case 'approved': return 'Approved';
      default: return 'Unknown';
    }
  };

  const handleStartTask = () => {
    Alert.alert(
      'Start Task',
      'Do you want to start working on this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStatusChange(task.id, 'in_progress') }
      ]
    );
  };

  const handleCompleteTask = () => {
    Alert.alert(
      'Complete Task',
      'Are you sure you have completed this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => onStatusChange(task.id, 'completed') }
      ]
    );
  };

  const handleApproveTask = () => {
    Alert.alert(
      'Approve Task',
      'Do you want to approve this completed task? The user will receive their points.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => onStatusChange(task.id, 'approved') }
      ]
    );
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(task.id) 
        }
      ]
    );
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
    return isAdmin && onDelete; // Admin can delete any task if delete function is provided
  };

  const renderActionButtons = () => {
    const showStart = canStartTask();
    const showComplete = canCompleteTask();
    const showApprove = canApproveTask();

    // Only render the container if there are buttons to show
    if (!showStart && !showComplete && !showApprove) {
      return null;
    }

    return (
      <View style={styles.actionButtons}>
        {showStart ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartTask}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        ) : null}
        
        {showComplete ? (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteTask}>
            <Text style={styles.buttonText}>Complete</Text>
          </TouchableOpacity>
        ) : null}
        
        {showApprove ? (
          <TouchableOpacity style={styles.approveButton} onPress={handleApproveTask}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{task.title || 'Unnamed Task'}</Text>
          {canDeleteTask() && (
            <TouchableOpacity style={styles.deleteIcon} onPress={handleDeleteTask}>
              <Text style={styles.deleteIconText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
        {task.description ? (
          <Text style={styles.description}>{task.description}</Text>
        ) : null}
        <View style={styles.footer}>
          <View style={[styles.status, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={styles.points}>{task.points || 0} points</Text>
        </View>
        {task.due_date ? (
          <Text style={styles.dueDate}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Text>
        ) : null}
        {renderActionButtons()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  deleteIcon: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  deleteIconText: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  completeButton: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});