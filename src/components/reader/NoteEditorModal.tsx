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
import type { Note } from '@/types';

interface NoteEditorModalProps {
  visible: boolean;
  pageNumber: number;
  existingNote: Note | null;
  saving?: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (text: string) => void;
  onDelete?: () => void;
}

export function NoteEditorModal({
  visible,
  pageNumber,
  existingNote,
  saving = false,
  error,
  onClose,
  onSave,
  onDelete,
}: NoteEditorModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText(existingNote?.noteText ?? '');
    }
  }, [visible, existingNote]);

  const handleSave = () => {
    onSave(text);
  };

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
            <ThemedText variant="subtitle">
              {existingNote
                ? t('reader.editNote')
                : t('reader.addNote', { page: pageNumber })}
            </ThemedText>
            <ThemedText variant="caption" secondary>
              {t('reader.noteHint')}
            </ThemedText>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('reader.notePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: error ? colors.danger : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              autoFocus
            />

            {error ? (
              <ThemedText variant="caption" style={{ color: colors.danger }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.actions}>
              {existingNote && onDelete ? (
                <Button
                  label={t('common.delete')}
                  onPress={onDelete}
                  variant="danger"
                  disabled={saving}
                />
              ) : null}
              <Button label={t('common.cancel')} onPress={onClose} variant="secondary" disabled={saving} />
              <Button
                label={saving ? t('notifications.saving') : t('common.save')}
                onPress={handleSave}
                disabled={saving}
              />
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
  centered: { width: '100%' },
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
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
});
