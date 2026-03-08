import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchMyDogs, deleteDog } from '../../store/slices/dogsSlice';
import { Colors, Spacing, Radius } from '../../utils/theme';
import { Badge, EmptyState } from '../../components';

export const MyDogsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { dogs, loading } = useSelector((s: RootState) => s.dogs);

  useEffect(() => { dispatch(fetchMyDogs()); }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      `Remove ${name}?`,
      'Are you sure you want to remove this dog from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => dispatch(deleteDog(id)) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Dogs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddDog')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={dogs}
          keyExtractor={d => d.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              emoji="🐾"
              title="No dogs yet"
              subtitle="Add your first dog to your profile!"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.dogEmoji}>{(item as any).emoji ?? '🐾'}</Text>
                <View style={styles.dogInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.dogName}>{item.name}</Text>
                    <Text style={styles.dogAge}>{item.age}y</Text>
                  </View>
                  <Text style={styles.dogBreed}>{item.breed}</Text>
                  {item.weight && <Text style={styles.dogMeta}>⚖️ {item.weight} kg</Text>}
                  {(item as any).personality && (
                    <View style={styles.tagsRow}>
                      {(item as any).personality.slice(0, 2).map((p: string) => (
                        <Badge key={p} label={p} variant="primary" size="sm" />
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDog')}>
        <Text style={styles.fabText}>+ Dog</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surfaceDark },
  backBtn: { padding: Spacing.sm },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { padding: Spacing.sm },
  addBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardDark, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dogEmoji: { fontSize: 40 },
  dogInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  dogName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  dogAge: { fontSize: 14, color: Colors.textMuted },
  dogBreed: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  dogMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  tagsRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  deleteBtn: { padding: Spacing.sm },
  deleteIcon: { fontSize: 18 },
  fab: { position: 'absolute', bottom: 28, right: 24, backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 12 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
