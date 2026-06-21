import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { ProfileService } from '@/services/ProfileService';

export default function AccountScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { user, profile, signOut, refreshProfile, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const handleSaveName = async () => {
    if (!user) {
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      await ProfileService.updateDisplayName(user.id, displayName);
      await refreshProfile();
      setMessage(t('auth.displayNameSaved'));
    } catch {
      setMessage(t('auth.displayNameFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.back();
    } finally {
      setSigningOut(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.content}>
          <ThemedText secondary>{t('auth.notSignedIn')}</ThemedText>
          <Button label={t('auth.signIn')} onPress={() => router.replace('/auth/sign-in')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" style={styles.topTitle}>
          {t('auth.account')}
        </ThemedText>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <ThemedText variant="label" secondary>
            {t('auth.signedInAs')}
          </ThemedText>
          <ThemedText>{user.email ?? user.id}</ThemedText>
          <ThemedText variant="caption" secondary>
            {t('auth.syncNotEnabled')}
          </ThemedText>
        </Card>

        <ThemedText variant="label">{t('auth.displayName')}</ThemedText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('auth.displayNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        {message ? (
          <ThemedText variant="caption" secondary>
            {message}
          </ThemedText>
        ) : null}

        {saving ? (
          <ActivityIndicator color={colors.tint} />
        ) : (
          <Button label={t('auth.saveDisplayName')} onPress={() => void handleSaveName()} variant="secondary" />
        )}

        {signingOut ? (
          <ActivityIndicator color={colors.tint} />
        ) : (
          <Button label={t('auth.signOut')} onPress={() => void handleSignOut()} variant="danger" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center' },
  topSpacer: { width: 24 },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  card: { gap: Spacing.sm },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
