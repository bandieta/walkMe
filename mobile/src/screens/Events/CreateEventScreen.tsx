import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { createEvent } from '../../store/slices/eventsSlice';
import { Input, Button } from '../../components';
import { Colors, Spacing, Radius } from '../../utils/theme';

const CATEGORIES = ['Meetup', 'Competition', 'Playdate', 'Walk', 'Training', 'Wellness', 'Lake', 'Beach', 'Other'];
const EMOJIS = ['🎉', '🐾', '🐕', '🥏', '🏊', '🌲', '🏃', '🌙', '🧘', '🏆', '🎈', '🎯'];

export const CreateEventScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('30');
  const [category, setCategory] = useState('Meetup');
  const [emoji, setEmoji] = useState('🎉');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !location.trim() || !date.trim()) {
      Alert.alert('Required', 'Please fill in title, location and date.');
      return;
    }

    // Parse date + time into ISO string (basic)
    const dateStr = date.trim();
    const timeStr = time.trim() || '10:00';
    let isoDate: string;
    try {
      const parsed = new Date(`${dateStr} ${timeStr}`);
      if (isNaN(parsed.getTime())) throw new Error('bad date');
      isoDate = parsed.toISOString();
    } catch {
      Alert.alert('Invalid date', 'Please enter date as DD/MM/YYYY and time as HH:MM.');
      return;
    }

    setSaving(true);
    try {
      await dispatch(createEvent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        date: isoDate,
        maxParticipants: parseInt(maxParticipants, 10) || 30,
        category,
        emoji,
      }));
      Alert.alert('Event Created! 🎉', 'Your event is now live.', [
        { text: 'View Events', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Event</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Emoji picker */}
        <Text style={styles.label}>Event Emoji</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <View style={styles.emojiRow}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiChar}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Title *</Text>
        <Input value={title} onChangeText={setTitle} placeholder="Give your event a catchy name" autoCapitalize="words" />

        <Text style={styles.label}>Description</Text>
        <Input value={description} onChangeText={setDescription} placeholder="What can attendees expect?" multiline numberOfLines={4} />

        <Text style={styles.label}>Location *</Text>
        <Input value={location} onChangeText={setLocation} placeholder="e.g. Łazienki Park, Warsaw" autoCapitalize="words" />

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Date * (DD/MM/YYYY)</Text>
            <Input value={date} onChangeText={setDate} placeholder="25/06/2025" keyboardType="numbers-and-punctuation" />
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Time</Text>
            <Input value={time} onChangeText={setTime} placeholder="10:00" keyboardType="numbers-and-punctuation" />
          </View>
        </View>

        <Text style={styles.label}>Max Participants</Text>
        <Input value={maxParticipants} onChangeText={setMaxParticipants} placeholder="30" keyboardType="numeric" maxLength={4} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.catBtn, category === c && styles.catBtnActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={saving ? 'Creating…' : '🎉 Create Event'}
          onPress={handleCreate}
          disabled={saving}
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
  backBtn: { padding: Spacing.sm, width: 40 },
  backText: { color: Colors.textSecondary, fontSize: 18 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: 4, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: 6 },
  emojiRow: { flexDirection: 'row', gap: Spacing.sm },
  emojiBtn: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  emojiChar: { fontSize: 26 },
  row: { flexDirection: 'row' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardDark },
  catBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  catText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catTextActive: { color: Colors.primary, fontWeight: '700' },
  saveBtn: { marginTop: Spacing.xl },
});
