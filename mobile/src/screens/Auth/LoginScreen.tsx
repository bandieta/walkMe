import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { login, register } from '../../store/slices/authSlice';

export const LoginScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (isRegister) {
      await dispatch(register({ email, displayName, password }));
    } else {
      await dispatch(login({ email, password }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚶 WalkMe</Text>
      <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>

      {isRegister && (
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isRegister ? 'Sign Up' : 'Sign In'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
        <Text style={styles.switchText}>
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 32, color: '#1a1a1a' },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, marginBottom: 12, fontSize: 16, backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchText: { textAlign: 'center', marginTop: 16, color: '#666', fontSize: 14 },
  error: { color: '#f44336', textAlign: 'center', marginBottom: 8, fontSize: 14 },
});
