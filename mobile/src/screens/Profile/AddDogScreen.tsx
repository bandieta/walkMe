import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { createDog } from '../../store/slices/dogsSlice';
import { Input, Button } from '../../components';
import { Colors, Spacing, Radius } from '../../utils/theme';

const DOG_EMOJIS = ['🐕', '🐶', '🐾', '🐕‍🦺', '🦮', '🐩', '🧸', '🧁'];

const PERSONALITY_OPTIONS = [
  'Friendly', 'Energetic', 'Playful', 'Calm', 'Loyal', 'Gentle',
  'Curious', 'Athletic', 'Social', 'Protective', 'Funny', 'Smart',
];

export const AddDogScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [bio, setBio] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(DOG_EMOJIS[0]);
  const [personality, setPersonality] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTrait = (t: string) =>
    setPersonality(p => p.includes(t) ? p.filter(x => x !== t) : p.length < 5 ? [...p, t] : p);

  const handleSave = async () => {
    if (!name.trim() || !breed.trim() || !age.trim()) {
      Alert.alert('Missing fields', 'Please fill in name, breed and age.');
      return;
    }
    setSaving(true);
    try {
      await dispatch(createDog({
        name: name.trim(),
        breed: breed.trim(),
        age: parseInt(age, 10),
        weight: weight ? parseFloat(weight) : undefined,
        bio: bio.trim(),
        emoji: selectedEmoji,
        personality,
      } as any));
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Dog</Text>
        <View style={{ width: 60 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Emoji picker */}
        <Text style={styles.label}>Pick an Emoji</Text>
        <View style={styles.emojiRow}>
          {DOG_EMOJIS.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}
              onPress={() => setSelectedEmoji(e)}
            >
              <Text style={styles.emojiChar}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Name *</Text>
        <Input value={name} onChangeText={setName} placeholder="Dog's name" autoCapitalize="words" />

        <Text style={styles.label}>Breed *</Text>
        <Input value={breed} onChangeText={setBreed} placeholder="e.g. Golden Retriever" autoCapitalize="words" />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Age (years) *</Text>
            <Input value={age} onChangeText={setAge} placeholder="e.g. 3" keyboardType="numeric" maxLength={2} />
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Weight (kg)</Text>
            <Input value={weight} onChangeText={setWeight} placeholder="e.g. 25" keyboardType="decimal-pad" maxLength={5} />
          </View>
        </View>

        <Text style={styles.label}>Bio</Text>
        <Input value={bio} onChangeText={setBio} placeholder="What makes them special?" multiline numberOfLines={3} />

        <Text style={styles.label}>Personality (pick up to 5)</Text>
        <View style={styles.traitsGrid}>
          {PERSONALITY_OPTIONS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.trait, personality.includes(t) && styles.traitActive]}
              onPress={() => toggleTrait(t)}
            >
              <Text style={[styles.traitText, personality.includes(t) && styles.traitTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={saving ? 'Adding…' : '🐾 Add Dog'}
          onPress={handleSave}
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
  backBtn: { padding: Spacing.sm },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  form: { padding: Spacing.xl, gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: Spacing.md, marginBottom: 6 },
  emojiRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  emojiBtn: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.cardDark, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  emojiChar: { fontSize: 26 },
  row: { flexDirection: 'row' },
  traitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  trait: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardDark },
  traitActive: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}20` },
  traitText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  traitTextActive: { color: Colors.primary, fontWeight: '700' },
  saveBtn: { marginTop: Spacing.xl },
});
