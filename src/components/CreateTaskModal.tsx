import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Task, User } from '../types';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'approved_at'>) => void;
  familyMembers: User[];
  currentUserId: string;
  familyId: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  familyMembers,
  currentUserId,
  familyId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !assignedTo || !points) {
      Alert.alert('Fel', 'Vänligen fyll i alla obligatoriska fält');
      return;
    }

    const task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'approved_at'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      points: parseInt(points, 10),
      assigned_to: assignedTo,
      created_by: currentUserId,
      family_id: familyId,
      status: 'pending',
      due_date: dueDate || undefined,
    };

    onSubmit(task);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPoints('');
    setAssignedTo('');
    setDueDate('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView style={styles.content}>
            <Text style={styles.title}>Skapa ny uppgift</Text>

            <Text style={styles.label}>Titel *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ange uppgiftens titel"
            />

            <Text style={styles.label}>Beskrivning</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Ange beskrivning (valfritt)"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Poäng *</Text>
            <TextInput
              style={styles.input}
              value={points}
              onChangeText={setPoints}
              placeholder="Ange antal poäng"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Tilldela till *</Text>
            <ScrollView horizontal style={styles.memberSelector}>
              {familyMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberOption,
                    assignedTo === member.id && styles.selectedMember,
                  ]}
                  onPress={() => setAssignedTo(member.id)}
                >
                  <Text
                    style={[
                      styles.memberText,
                      assignedTo === member.id && styles.selectedMemberText,
                    ]}
                  >
                    {member.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Förfallodatum (valfritt)</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
            />
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Skapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  memberSelector: {
    marginTop: 8,
  },
  memberOption: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedMember: {
    backgroundColor: '#6200EA',
  },
  memberText: {
    color: '#333',
  },
  selectedMemberText: {
    color: '#fff',
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
});