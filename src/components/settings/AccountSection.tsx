import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthService } from '@/services/AuthService';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';

export function AccountSection() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading, user, isConfigured, signOut } = useAuth();

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card style={styles.card}>
        <ThemedText variant="subtitle">{t('auth.account')}</ThemedText>
        <ThemedText variant="caption" secondary>
          {t('auth.signInPrompt')}
        </ThemedText>
        <ThemedText variant="caption" secondary>
          {t('auth.localOnlyMode')}
        </ThemedText>
        {!AuthService.hasEnvConfigured() ? (
          <ThemedText variant="caption" secondary>
            {t('auth.notConfigured')}
          </ThemedText>
        ) : !isConfigured ? (
          <ThemedText variant="caption" secondary>
            {t('auth.rebuildDevClient')}
          </ThemedText>
        ) : null}
        <View style={styles.actions}>
          <Button
            label={t('auth.signIn')}
            onPress={() => router.push('/auth/sign-in')}
            disabled={!isConfigured}
          />
          <Button
            label={t('auth.signUp')}
            onPress={() => router.push('/auth/sign-up')}
            variant="secondary"
            disabled={!isConfigured}
          />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('auth.account')}</ThemedText>
      <ThemedText variant="caption" secondary>
        {t('auth.signedInAs')} {user.email ?? user.id}
      </ThemedText>
      <View style={styles.actions}>
        <Button label={t('auth.account')} onPress={() => router.push('/auth/account')} variant="secondary" />
        <Button label={t('auth.signOut')} onPress={() => void signOut()} variant="danger" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.xs },
});
