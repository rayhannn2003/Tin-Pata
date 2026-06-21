import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { formatMaxCloudPdfSizeMb } from '@/constants/pdfCloud';
import { Spacing } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { PdfCloudError, PdfCloudStorageService } from '@/services/PdfCloudStorageService';
import type { Book } from '@/types';
import { buildPdfCloudStatus } from '@/utils/pdfCloudStatus';

interface BookPdfCloudCardProps {
  book: Book;
  onChanged: () => Promise<void> | void;
  onRelink?: () => void;
}

export function BookPdfCloudCard({ book, onChanged, onRelink }: BookPdfCloudCardProps) {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = Boolean(user && isConfigured);
  const status = useMemo(() => buildPdfCloudStatus(book, isLoggedIn), [book, isLoggedIn]);

  const runAction = useCallback(
    async (action: () => Promise<void>, successMessage?: string) => {
      try {
        setBusy(true);
        setError(null);
        setMessage(null);
        await action();
        if (successMessage) {
          setMessage(successMessage);
        }
        await onChanged();
      } catch (err) {
        const text = err instanceof PdfCloudError ? err.message : t('pdfCloud.uploadFailed');
        setError(text);
      } finally {
        setBusy(false);
      }
    },
    [onChanged, t],
  );

  const handleUpload = () => {
    Alert.alert(t('pdfCloud.title'), t('pdfCloud.uploadConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('pdfCloud.backUpToCloud'),
        onPress: () => {
          void runAction(async () => {
            await PdfCloudStorageService.uploadPdfForBook(book.id);
          }, t('pdfCloud.backedUpToCloud'));
        },
      },
    ]);
  };

  const handleDownload = () => {
    void runAction(async () => {
      await PdfCloudStorageService.downloadPdfForBook(book.id);
    }, t('pdfCloud.downloadPdf'));
  };

  const confirmDeleteCloud = (strong = false) => {
    Alert.alert(
      t('pdfCloud.deleteCloudPdf'),
      strong ? t('pdfCloud.deleteCloudStrongWarning') : t('pdfCloud.deleteCloudWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pdfCloud.deleteCloudPdf'),
          style: 'destructive',
          onPress: () => {
            void runAction(async () => {
              await PdfCloudStorageService.deleteCloudPdfForBook(book.id);
            }, `${t('pdfCloud.cloudDeleted')}. ${t('pdfCloud.localKept')}`);
          },
        },
      ],
    );
  };

  const handleDeleteCloud = () => {
    if (!status.localAvailable) {
      confirmDeleteCloud(true);
      return;
    }
    confirmDeleteCloud(false);
  };

  const statusLabel = (() => {
    switch (status.state) {
      case 'not_logged_in':
        return t('pdfCloud.signInToBackup');
      case 'local_only':
        return t('pdfCloud.localOnly');
      case 'backed_up':
        return t('pdfCloud.backedUpToCloud');
      case 'cloud_available':
        return t('pdfCloud.availableInCloud');
      case 'pdf_missing':
        return t('pdfMissing.badge');
      case 'too_large':
        return t('pdfCloud.tooLarge');
      default:
        return t('pdfCloud.localOnly');
    }
  })();

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('pdfCloud.title')}</ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.metadataOnly')}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {t('pdfCloud.maxSize', { size: formatMaxCloudPdfSizeMb() })}
      </ThemedText>
      <ThemedText variant="caption">{statusLabel}</ThemedText>

      {message ? (
        <ThemedText variant="caption" style={styles.success}>
          {message}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText variant="caption" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      {busy ? <ActivityIndicator /> : null}

      <View style={styles.actions}>
        {status.state === 'not_logged_in' ? (
          <ThemedText variant="caption" secondary>
            {t('pdfCloud.signInToBackup')}
          </ThemedText>
        ) : null}

        {status.canUpload ? (
          <Button
            label={t('pdfCloud.backUpToCloud')}
            onPress={handleUpload}
            disabled={busy}
          />
        ) : null}

        {status.state === 'backed_up' ? (
          <>
            <Button
              label={t('pdfCloud.deleteCloudPdf')}
              onPress={handleDeleteCloud}
              variant="secondary"
              disabled={busy}
            />
            <Button
              label={t('pdfCloud.backUpToCloud')}
              onPress={handleUpload}
              variant="secondary"
              disabled={busy}
            />
          </>
        ) : null}

        {status.canDownload ? (
          <Button
            label={t('pdfCloud.downloadPdf')}
            onPress={handleDownload}
            disabled={busy}
          />
        ) : null}

        {status.canRelink && onRelink ? (
          <Button
            label={t('pdfMissing.relink')}
            onPress={onRelink}
            variant="secondary"
            disabled={busy}
          />
        ) : null}

        {status.state === 'too_large' ? (
          <ThemedText variant="caption" secondary>
            {t('pdfCloud.tooLarge')}
          </ThemedText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.xs },
  success: { color: '#2e7d32' },
  error: { color: '#c62828' },
});
