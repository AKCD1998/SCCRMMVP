import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useLanguage, type SupportedLanguage } from '../context/LanguageContext';

const LANGUAGES: { code: SupportedLanguage; flag: string; label: string }[] = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

export function SettingsScreen() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <Section title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>

      <View style={styles.langRow}>
        {LANGUAGES.map(({ code, flag, label }) => {
          const active = language === code;
          return (
            <Pressable
              key={code}
              style={[styles.langOption, active && styles.langOptionActive]}
              onPress={() => changeLanguage(code)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={styles.flag}>{flag}</Text>
              <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                {label}
              </Text>
              {active ? <View style={styles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>{t('settings.languageNote')}</Text>
    </Section>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  langRow: {
    gap: 10,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
  },
  langOptionActive: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.secondaryBg,
  },
  flag: {
    fontSize: 24,
  },
  langLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  langLabelActive: {
    color: theme.colors.brand,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
});
