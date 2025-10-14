import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { TaskItem, CreateTaskModal, TaskDetailsModal } from '../components';
import { Task, User } from '../types';
import { taskService } from '../services/taskService';

interface TasksScreenProps {
  currentUser: User;
  familyMembers: User[];
  onTaskCreated?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ currentUser, familyMembers, onTaskCreated }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const loadTasks = async () => {
    try {
      const familyTasks = await taskService.getFamilyTasks(currentUser.family_id!);
      setTasks(familyTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await taskService.updateTaskStatus(taskId, status, currentUser.id);
      loadTasks(); // Reload tasks
      onTaskCreated?.(); // Notify parent to refresh notifications (status changes can create notifications too)
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      loadTasks(); // Reload tasks after deletion
    } catch (error: any) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', `Failed to delete task: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'approved_at'>) => {
    try {
      await taskService.createTask(taskData, currentUser.role);
      loadTasks(); // Reload tasks
      onTaskCreated?.(); // Notify parent to refresh notifications
    } catch (error: any) {
      console.error('Error creating task:', error);
      Alert.alert('Error', error.message || 'Failed to create task');
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onPress={() => handleTaskPress(item)}
      onStatusChange={handleStatusChange}
      onDelete={handleDeleteTask}
      currentUserId={currentUser.id}
      isAdmin={currentUser.role === 'admin'}
      familyMembers={familyMembers}
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        {currentUser.role === 'admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks to show</Text>
            <Text style={styles.emptySubtext}>
              {currentUser.role === 'admin' 
                ? 'Tap + to create a new task' 
                : 'Ask your family admin to create tasks'
              }
            </Text>
          </View>
        }
      />

      {currentUser.role === 'admin' && (
        <CreateTaskModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          familyMembers={familyMembers}
          currentUserId={currentUser.id}
          familyId={currentUser.family_id!}
        />
      )}

      <TaskDetailsModal
        visible={showTaskDetails}
        task={selectedTask}
        onClose={() => {
          setShowTaskDetails(false);
          setSelectedTask(null);
        }}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
        currentUserId={currentUser.id}
        isAdmin={currentUser.role === 'admin'}
        familyMembers={familyMembers}
      />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});