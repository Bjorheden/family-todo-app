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
    <View style={styles.container}>
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
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
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

      {/* BODY - Clickable area for full details */}
      <TouchableOpacity style={styles.body} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.clickHint}>Tap to view details</Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.points}>💰 {task.points || 0} pts</Text>
        {renderActionButtons()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
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
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  assignedTo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  
  // BODY STYLES
  body: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  clickHint: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  
  // FOOTER STYLES
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  
  // ACTION BUTTONS
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completeButton: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  approveButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});