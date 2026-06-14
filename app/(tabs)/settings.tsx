import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { DataBackupSection } from '@/components/settings/DataBackupSection';
import { ReadingExperienceSettings } from '@/components/settings/ReadingExperienceSettings';
import { LanguagePicker } from '@/components/settings/LanguagePicker';
import { NotificationSettingsPanel } from '@/components/settings/NotificationSettings';
import { ReflectionHistory } from '@/components/settings/ReflectionHistory';
import { GoalEditor } from '@/components/settings/GoalEditor';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HideScreenHeader } from '@/components/ui/HideScreenHeader';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ThemedText } from '@/components/ui/ThemedText';
import { APP_DISPLAY_NAME, APP_NAME_BN, APP_NAME_EN } from '@/constants/brand';
import { useDailyGoal } from '@/features/goals/useDailyGoal';
import { useTranslation } from '@/i18n/useTranslation';
import { SettingsService } from '@/services/SettingsService';
import { Spacing } from '@/constants/layout';

function SettingRow({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <View style={styles.settingRow}>
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <ThemedText secondary>{value}</ThemedText>
      {description ? (
        <ThemedText variant="caption" secondary>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { goal, refresh } = useDailyGoal();
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleResetData = () => {
    Alert.alert(t('settings.resetTitle'), t('settings.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetConfirm'),
        style: 'destructive',
        onPress: () => {
          void SettingsService.resetAllData();
        },
      },
    ]);
  };

  return (
    <>
      <HideScreenHeader />
      <ScreenContainer>
        <ThemedText secondary style={styles.intro}>
          {t('settings.intro')}
        </ThemedText>

        <View style={styles.section}>
          <SectionHeader
            title={t('settings.readingExperience')}
            subtitle={t('settings.readingExperienceSubtitle')}
          />
          <ReadingExperienceSettings />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.language')} subtitle={t('settings.languageSubtitle')} />
          <LanguagePicker />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.dailyGoal')} subtitle={t('settings.dailyGoalSubtitle')} />
          <GoalEditor goal={goal} onSaved={() => void refresh()} />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.theme')} subtitle={t('settings.themeSubtitle')} />
          <ThemePicker />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
          />
          <NotificationSettingsPanel />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('settings.reflections')}
            subtitle={t('settings.reflectionsSubtitle')}
          />
          <ReflectionHistory />
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('annotations.librarySectionTitle')}
            subtitle={t('annotations.librarySectionSubtitle')}
          />
          <Card style={styles.linkCard}>
            <Button
              label={t('annotations.allNotes')}
              onPress={() => router.push('/notes')}
              variant="secondary"
            />
            <Button
              label={t('annotations.allBookmarks')}
              onPress={() => router.push('/bookmarks')}
              variant="secondary"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.dataBackup')} />
          <DataBackupSection />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.dataPrivacy')} />
          <Card muted>
            <SettingRow
              label={t('settings.storage')}
              value={t('settings.storageValue')}
              description={t('settings.storageDesc')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.appInfo')} />
          <Card>
            <SettingRow label={t('settings.appNameLabel')} value={APP_DISPLAY_NAME} />
            <SettingRow label={t('common.english')} value={APP_NAME_EN} />
            <SettingRow label={t('common.bengali')} value={APP_NAME_BN} />
            <SettingRow label={t('settings.versionLabel')} value={appVersion} />
            <SettingRow
              label={t('settings.buildLabel')}
              value={t('settings.build')}
              description={t('settings.buildDesc')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('settings.dangerZone')} subtitle={t('settings.dangerSubtitle')} />
          <Card style={styles.dangerCard}>
            <ThemedText variant="caption" secondary>
              {t('settings.resetHint')}
            </ThemedText>
            <Button label={t('settings.resetAll')} onPress={handleResetData} variant="danger" />
          </Card>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Spacing.xl, lineHeight: 22 },
  section: { marginBottom: Spacing.xl, gap: Spacing.sm },
  settingRow: { gap: Spacing.xs },
  settingLabel: { fontWeight: '600', fontSize: 16 },
  dangerCard: { gap: Spacing.md },
  linkCard: { gap: Spacing.sm },
});
