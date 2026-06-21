import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { AuthService, getAuthErrorMessage } from '@/services/AuthService';

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { signIn, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!isConfigured) {
      setError(
        AuthService.hasEnvConfigured() ? t('auth.rebuildDevClient') : t('auth.notConfigured'),
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signIn(email, password);
      router.back();
    } catch (err) {
      setError(getAuthErrorMessage(err, t, 'auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" style={styles.topTitle}>
          {t('auth.signIn')}
        </ThemedText>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <ThemedText secondary>{t('auth.signInSubtitle')}</ThemedText>
        <ThemedText variant="caption" secondary>
          {t('auth.noSyncYet')}
        </ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder={t('auth.email')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder={t('auth.password')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        {error ? (
          <ThemedText variant="caption" style={{ color: colors.danger }}>
            {error}
          </ThemedText>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.tint} />
        ) : (
          <Button label={t('auth.signIn')} onPress={() => void handleSignIn()} disabled={!isConfigured} />
        )}

        <Pressable onPress={() => router.replace('/auth/sign-up')} disabled={!isConfigured}>
          <ThemedText variant="caption" style={[styles.link, { color: colors.tint }]}>
            {t('auth.noAccountSignUp')}
          </ThemedText>
        </Pressable>
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  link: { textAlign: 'center', marginTop: Spacing.xs },
});
