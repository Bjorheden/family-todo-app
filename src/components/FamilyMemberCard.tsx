import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../types';

interface FamilyMemberCardProps {
  member: User;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ member }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {member.full_name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{member.full_name}</Text>
        <Text style={styles.role}>
          {member.role === 'admin' ? 'Administrator' : 'Member'}
        </Text>
        <Text style={styles.points}>💰 {member.points}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});