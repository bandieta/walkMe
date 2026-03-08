import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { walksApi } from '../../services/api';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label, placeholder, value, onChangeText, multiline, keyboardType, error,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          focused && fieldStyles.inputFocused,
          !!error && fieldStyles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        numberOfLines={multiline ? 4 : 1}
        returnKeyType={multiline ? 'default' : 'next'}
      />
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.lg },
  label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  multiline: { minHeight: 100, paddingTop: Spacing.sm + 2 },
  inputFocused: { borderColor: Colors.primary },
  inputError: { borderColor: Colors.error },
  error: { ...Typography.caption, color: Colors.error, marginTop: 4 },
});

const CATEGORIES = ['Park 🌳', 'Trail 🥾', 'Lake 🏞', 'Beach 🏖', 'Cafe ☕', 'City 🏙'];
const DURATIONS = ['30 min', '1 hour', '1.5 hrs', '2 hours', '2+ hours'];

export const CreateWalkScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [category, setCategory] = useState('Park 🌳');
  const [duration, setDuration] = useState('1 hour');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const errors: Record<string, string> = {};
  if (title.trim().length > 0 && title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (isNaN(parseInt(maxParticipants)) || parseInt(maxParticipants) < 2) errors.maxParticipants = 'Minimum 2 participants';

  const canSubmit = title.trim().length >= 3 && date && time && address && !loading;

  const handleCreate = async () => {
    if (!canSubmit) return;

    const scheduledAt = new Date(`${date}T${time}`);
    if (isNaN(scheduledAt.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date (YYYY-MM-DD) and time (HH:MM).');
      return;
    }

    setLoading(true);
    try {
      await walksApi.create({
        title: title.trim(),
        description: description.trim(),
        maxParticipants: parseInt(maxParticipants),
        scheduledAt: scheduledAt.toISOString(),
        meetingPoint: { address, lat: 0, lng: 0 },
        category: category.split(' ')[0],
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to create walk. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDark} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Walk</Text>
        <View style={{ width: 64 }} />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CATEGORY</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <InputField label="TITLE" placeholder="Morning Park Walk…" value={title} onChangeText={setTitle} error={errors.title} />
        <InputField label="DESCRIPTION" placeholder="Describe the walk route, pace, dog-friendliness…" value={description} onChangeText={setDescription} multiline />

        {/* Date + Time */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <InputField label="DATE" placeholder="2025-09-20" value={date} onChangeText={setDate} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <InputField label="TIME" placeholder="09:00" value={time} onChangeText={setTime} />
          </View>
        </View>

        <InputField label="MEETING POINT" placeholder="Enter address or landmark…" value={address} onChangeText={setAddress} />
        <InputField label="MAX PARTICIPANTS" placeholder="8" value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="number-pad" error={errors.maxParticipants} />

        {/* Duration */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ESTIMATED DURATION</Text>
        </View>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationChip, duration === d && styles.durationChipActive]}
              onPress={() => setDuration(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Create Walk 🚶</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: {
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  cancelBtn: { paddingVertical: 4, minWidth: 64 },
  cancelText: { ...Typography.body, color: Colors.textSecondary },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { ...Typography.overline, color: Colors.textMuted, letterSpacing: 1.5 },
  chips: { marginBottom: Spacing.lg },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.cardDark, borderRadius: Radius.full,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row' },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  durationChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.cardDark, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  durationChipActive: { borderColor: Colors.secondary, backgroundColor: `${Colors.secondary}20` },
  durationText: { ...Typography.caption, color: Colors.textSecondary },
  durationTextActive: { color: Colors.secondary, fontWeight: '700' },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.md + 2, alignItems: 'center', ...Shadow.card,
  },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitText: { ...Typography.h3, color: '#fff' },
});
