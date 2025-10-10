import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../services/authService';
import { User } from '../types';

interface FamilySetupScreenProps {
  currentUser: User;
  onFamilyCreated: () => void;
}

export const FamilySetupScreen: React.FC<FamilySetupScreenProps> = ({
  currentUser,
  onFamilyCreated,
}) => {
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    setLoading(true);
    try {
      await authService.createFamily(familyName.trim(), currentUser.id);
      Alert.alert('Success!', 'Family created successfully!');
      onFamilyCreated();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!familyCode.trim()) {
      Alert.alert('Error', 'Please enter a family code');
      return;
    }

    setLoading(true);
    try {
      await authService.joinFamilyByCode(familyCode.trim(), currentUser.id);
      Alert.alert('Success!', 'Joined family successfully!');
      onFamilyCreated();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Family Todo!</Text>
        <Text style={styles.subtitle}>
          You need to create or join a family to get started
        </Text>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.activeModeButton]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeButtonText, mode === 'create' && styles.activeModeButtonText]}>
              Create Family
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'join' && styles.activeModeButton]}
            onPress={() => setMode('join')}
          >
            <Text style={[styles.modeButtonText, mode === 'join' && styles.activeModeButtonText]}>
              Join Family
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Family Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your family name"
              value={familyName}
              onChangeText={setFamilyName}
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreateFamily}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : 'Create Family'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              You'll become the family administrator and can invite others
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Family Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter family invitation code"
              value={familyCode}
              onChangeText={setFamilyCode}
              autoCapitalize="characters"
            />
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleJoinFamily}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Joining...' : 'Join Family'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              Ask your family administrator to share the family code from the Family tab → "Family Code" button
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6200EA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#fff',
  },
  modeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeModeButtonText: {
    color: '#6200EA',
  },
  form: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3700B3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});