import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

interface StatCardProps {
  value: string;
  label: string;
  emoji: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, emoji }) => (
  <View style={statStyles.card}>
    <Text style={statStyles.emoji}>{emoji}</Text>
    <Text style={statStyles.value}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardDark,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: { fontSize: 24, marginBottom: 4 },
  value: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 2 },
  label: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
});

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, value, onToggle }) => (
  <View style={settingStyles.row}>
    <View style={settingStyles.text}>
      <Text style={settingStyles.label}>{label}</Text>
      {description && <Text style={settingStyles.desc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: Colors.border, true: `${Colors.primary}80` }}
      thumbColor={value ? Colors.primary : Colors.textMuted}
      ios_backgroundColor={Colors.border}
    />
  </View>
);

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  text: { flex: 1 },
  label: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  desc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((s: RootState) => s.auth);

  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surfaceDark} />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={{ fontSize: 12 }}>🐾</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Walker'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>🚶 Active Walker</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value="12" label="Walks Done" emoji="✅" />
          <StatCard value="34 km" label="Total Distance" emoji="📍" />
          <StatCard value="8" label="Friends" emoji="👥" />
        </View>

        {/* Settings card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingRow
            label="Push Notifications"
            description="Walk invites, chat messages"
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            label="Share Location"
            description="Visible to walk participants"
            value={locationSharing}
            onToggle={setLocationSharing}
          />
          <SettingRow
            label="Nearby Walk Alerts"
            description="Notify when walks start nearby"
            value={nearbyAlerts}
            onToggle={setNearbyAlerts}
          />
        </View>

        {/* Menu items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          {[
            { emoji: '🐶', label: 'My Dogs' },
            { emoji: '🏅', label: 'Achievements' },
            { emoji: '🔒', label: 'Privacy & Safety' },
            { emoji: '❓', label: 'Help & Support' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuRow} activeOpacity={0.7}>
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  editBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: `${Colors.primary}50`,
  },
  editBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  scroll: { padding: Spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: `${Colors.primary}60`,
    ...Shadow.card,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.cardDark, borderWidth: 2, borderColor: Colors.backgroundDark,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { ...Typography.h2, color: Colors.textPrimary, marginBottom: 2 },
  email: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: `${Colors.secondary}20`,
    borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.secondary}50`,
  },
  pillText: { ...Typography.caption, color: Colors.secondary, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    letterSpacing: 1.5,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  menuEmoji: { fontSize: 20, marginRight: Spacing.md },
  menuLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  menuChevron: { fontSize: 22, color: Colors.textMuted },
  signOutBtn: {
    borderWidth: 1.5, borderColor: Colors.error,
    borderRadius: Radius.xl, padding: Spacing.md + 2,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signOutText: { ...Typography.body, color: Colors.error, fontWeight: '700' },
});
