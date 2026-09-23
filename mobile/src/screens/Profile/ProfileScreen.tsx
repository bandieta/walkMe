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
import { logoutAndInvalidate } from '../../store/slices/authSlice';
import { Colors, Typography, Spacing, Radius, Shadow, Ramp } from '../../utils/theme';
import { Avatar } from '../../components/Avatar';
import { Icon, IconName } from '../../components/Icon';

interface StatCardProps {
  value: string;
  label: string;
  icon: IconName;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => (
  <View style={statStyles.card}>
    <View style={statStyles.icon}>
      <Icon name={icon} size={20} color={Colors.primary} />
    </View>
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
  icon: { marginBottom: 6 },
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

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
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
          onPress: () => dispatch(logoutAndInvalidate()),
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
              <Avatar name={user?.displayName ?? initials} uri={user?.photoUrl} size="xl" />
            </View>
            <View style={styles.avatarBadge}>
              <Icon name="paw" size={12} color={Colors.primary} weight="fill" />
            </View>
          </View>
          <Text style={styles.name}>{user?.displayName ?? 'Walker'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.pill}>
            <Icon name="walk" size={13} color={Colors.primary} />
            <Text style={styles.pillText}>Active walker</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value="12" label="Walks done" icon="checkCircle" />
          <StatCard value="34 km" label="Distance" icon="pin" />
          <StatCard value="8" label="Friends" icon="users" />
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
            { icon: 'dog', label: 'My dogs', route: 'MyDogs' },
            { icon: 'walk', label: 'Walks & events', route: 'MyWalks' },
            { icon: 'medal', label: 'Achievements', route: null },
            { icon: 'lock', label: 'Privacy & safety', route: null },
            { icon: 'question', label: 'Help & support', route: null },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <Icon name={item.icon as IconName} size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.md }} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Icon name="chevronRight" size={16} color={Colors.textMuted} />
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
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
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
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Ramp.accent[900],
    borderRadius: 6, borderWidth: 1, borderColor: Ramp.accent[700],
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
