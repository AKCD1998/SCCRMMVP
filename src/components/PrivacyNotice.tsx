import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../constants/theme';

interface Props {
  context: 'social' | 'forgot';
}

export function PrivacyNotice({ context }: Props) {
  const { t } = useTranslation();
  const text = context === 'social' ? t('consent.socialNotice') : t('consent.forgotNotice');

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
  },
  icon: {
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 19,
  },
});
