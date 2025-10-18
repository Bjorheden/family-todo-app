import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Task, User } from '../types';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDelete?: (taskId: string) => void;
  currentUserId: string;
  isAdmin: boolean;
  familyMembers: User[];
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress, 
  onStatusChange, 
  onDelete,
  currentUserId, 
  isAdmin,
  familyMembers
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

  const getAssignedToName = () => {
    if (task.assigned_to === currentUserId) {
      return 'You';
    }
    const assignedMember = familyMembers.find(member => member.id === task.assigned_to);
    return assignedMember?.full_name || 'Unknown User';
  };

  const handleStartTask = () => {
    console.log('Start button pressed for task:', task.id);
    
    Alert.alert(
      'Start Task',
      'Do you want to start working on this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            console.log('Start confirmed for task:', task.id);
            onStatusChange(task.id, 'in_progress');
          }
        }
      ]
    );
  };

  const handleCompleteTask = () => {
    console.log('Complete button pressed for task:', task.id);
    
    Alert.alert(
      'Complete Task',
      'Are you sure you have completed this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            console.log('Complete confirmed for task:', task.id);
            onStatusChange(task.id, 'completed');
          }
        }
      ]
    );
  };

  const handleApproveTask = () => {
    console.log('Approve button pressed for task:', task.id);
    
    Alert.alert(
      'Approve Task',
      'Do you want to approve this completed task? The user will receive their points.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => {
            console.log('Approve confirmed for task:', task.id);
            onStatusChange(task.id, 'approved');
          }
        }
      ]
    );
  };

  const handleDeleteTask = () => {
    console.log('Delete button pressed for task:', task.id);
    
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            console.log('Delete confirmed for task:', task.id);
            onDelete?.(task.id);
          }
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
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.95}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{task.title || 'Unnamed Task'}</Text>
          <View style={styles.taskMeta}>
            <Text style={styles.assignedTo}>
              👤 {getAssignedToName()}
            </Text>
            {task.due_date && (
              <Text style={styles.dueDate}>
                📅 {new Date(task.due_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusChip, { borderColor: getStatusColor() }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>
          {canDeleteTask() && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteTask}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.points}>💰 {task.points || 0} pts</Text>
        {renderActionButtons()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    // Android shadow
    elevation: 6,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#fafafa',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  taskMeta: {
    flexDirection: 'column',
    gap: 4,
  },
  assignedTo: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: '#2d3748',
    fontWeight: '500',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: 'rgba(98, 0, 234, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#dc3545',
  },
  
  // FOOTER STYLES
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    backgroundColor: '#f7fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  points: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3748',
    backgroundColor: '#e6fffa',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  // ACTION BUTTONS
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#6200EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  completeButton: {
    backgroundColor: '#38a169',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  approveButton: {
    backgroundColor: '#2b6cb0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});