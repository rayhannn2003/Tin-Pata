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
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface BookRenameModalProps {
  visible: boolean;
  initialTitle: string;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

export function BookRenameModal({
  visible,
  initialTitle,
  onClose,
  onSave,
}: BookRenameModalProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setError(null);
    }
  }, [visible, initialTitle]);

  const handleSave = () => {
    void (async () => {
      try {
        setSaving(true);
        setError(null);
        await onSave(title);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not rename book.');
      } finally {
        setSaving(false);
      }
    })();
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
            <ThemedText variant="subtitle">Rename book</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Book title"
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
            />
            {error ? (
              <ThemedText variant="caption" style={{ color: colors.danger }}>
                {error}
              </ThemedText>
            ) : null}
            <View style={styles.actions}>
              <Button label="Cancel" onPress={onClose} variant="secondary" disabled={saving} />
              <Button label={saving ? 'Saving…' : 'Save'} onPress={handleSave} disabled={saving} />
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
    padding: Spacing.xl,
  },
  centered: { width: '100%' },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
