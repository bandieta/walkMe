import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { updateProfile } from '../../store/slices/profileSlice';
import { Input, Button } from '../../components';
import { Colors, Spacing, Radius } from '../../utils/theme';

export const EditProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);
  const { updating } = useSelector((s: RootState) => s.profile);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }
    await dispatch(updateProfile({
      name: displayName.trim(),
      bio: bio.trim(),
    } as any));
    Alert.alert('Saved! ✅', 'Your profile has been updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {displayName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <Text style={styles.label}>Display Name</Text>
        <Input
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Bio</Text>
        <Input
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about you and your dog(s)…"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Age</Text>
        <Input
          value={age}
          onChangeText={setAge}
          placeholder="Your age"
          keyboardType="numeric"
          maxLength={3}
        />

        <Text style={styles.label}>Location</Text>
        <Input
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Mokotów, Warsaw"
          autoCapitalize="words"
        />

        <Button
          label={updating ? 'Saving…' : 'Save Changes'}
          onPress={handleSave}
          disabled={updating}
          fullWidth
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceDark },
  backBtn: { padding: Spacing.sm },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: 4 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#fff' },
  avatarHint: { fontSize: 13, color: Colors.textMuted },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: 6 },
  saveBtn: { marginTop: Spacing.xl },
});
