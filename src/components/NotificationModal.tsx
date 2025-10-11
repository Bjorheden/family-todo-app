import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification } from '../types';

interface NotificationModalProps {
  visible: boolean;
  notifications: Notification[];
  notificationCount: number;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onMarkNotificationAsRead: (notificationId: string) => void;
}

export function NotificationModal({ 
  visible, 
  notifications, 
  notificationCount, 
  onClose, 
  onMarkAllAsRead,
  onMarkNotificationAsRead 
}: NotificationModalProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{`Notifications (${notificationCount || 0})`}</Text>
          <View style={styles.modalActions}>
            {notificationCount > 0 && (
              <TouchableOpacity onPress={onMarkAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
              onPress={() => {
                if (!item.is_read) {
                  onMarkNotificationAsRead(item.id);
                }
              }}
            >
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                {!item.is_read && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>
                {`${new Date(item.created_at).toLocaleDateString()} ${new Date(item.created_at).toLocaleTimeString()}`}
              </Text>
              {!item.is_read && (
                <Text style={styles.tapToRead}>Tap to mark as read</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyNotifications}>
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  markAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  tapToRead: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});