import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { useThemeColors } from '@/hooks/useColorScheme';

interface GoToPageModalProps {
  visible: boolean;
  totalPages: number;
  error: string | null;
  onClose: () => void;
  onSubmit: (pageInput: string) => void;
}

export function GoToPageModal({
  visible,
  totalPages,
  error,
  onClose,
  onSubmit,
}: GoToPageModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (visible) {
      setInput('');
    }
  }, [visible]);

  const handleSubmit = () => {
    onSubmit(input);
  };

  const hint =
    totalPages > 0
      ? t('reader.goToPageHint', { max: totalPages })
      : t('reader.goToPageHintGeneric');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <ThemedText variant="subtitle">{t('reader.goToPage')}</ThemedText>
            <ThemedText variant="caption" secondary>
              {hint}
            </ThemedText>

            <TextInput
              value={input}
              onChangeText={setInput}
              keyboardType="number-pad"
              placeholder={t('reader.pageNumber')}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: error ? colors.danger : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {error ? (
              <ThemedText variant="caption" style={{ color: colors.danger }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.actions}>
              <Button label={t('common.cancel')} onPress={onClose} variant="secondary" />
              <Button label={t('common.go')} onPress={handleSubmit} />
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
