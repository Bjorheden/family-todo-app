import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  currentUserId: string;
  isAdmin: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress, 
  onStatusChange, 
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
      case 'pending': return 'Väntande';
      case 'in_progress': return 'Pågår';
      case 'completed': return 'Klar';
      case 'approved': return 'Godkänd';
      default: return 'Okänd';
    }
  };

  const handleStartTask = () => {
    Alert.alert(
      'Starta uppgift',
      'Vill du börja arbeta med denna uppgift?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Starta', onPress: () => onStatusChange(task.id, 'in_progress') }
      ]
    );
  };

  const handleCompleteTask = () => {
    Alert.alert(
      'Slutför uppgift',
      'Är du säker på att du har slutfört denna uppgift?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Slutför', onPress: () => onStatusChange(task.id, 'completed') }
      ]
    );
  };

  const handleApproveTask = () => {
    Alert.alert(
      'Godkänn uppgift',
      'Vill du godkänn denna slutförda uppgift? Användaren kommer att få sina poäng.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Godkänn', onPress: () => onStatusChange(task.id, 'approved') }
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
        {showStart && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartTask}>
            <Text style={styles.buttonText}>Starta</Text>
          </TouchableOpacity>
        )}
        
        {showComplete && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteTask}>
            <Text style={styles.buttonText}>Slutför</Text>
          </TouchableOpacity>
        )}
        
        {showApprove && (
          <TouchableOpacity style={styles.approveButton} onPress={handleApproveTask}>
            <Text style={styles.buttonText}>Godkänn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{task.title}</Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
        <View style={styles.footer}>
          <View style={[styles.status, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          <Text style={styles.points}>{task.points} poäng</Text>
        </View>
        {task.due_date && (
          <Text style={styles.dueDate}>
            Förfaller: {new Date(task.due_date).toLocaleDateString('sv-SE')}
          </Text>
        )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
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
    gap: 8,
  },
  startButton: {
    backgroundColor: '#42A5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeButton: {
    backgroundColor: '#66BB6A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});