import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../constants/theme';
import { useLanguage, type SupportedLanguage } from '../context/LanguageContext';

const OPTIONS: { code: SupportedLanguage; flag: string; label: string }[] = [
  { code: 'th', flag: '🇹🇭', label: 'ไทย' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

// Shown exactly once — on first app launch before any other screen.
// Both languages are displayed bilingually so the user can read the screen
// regardless of which language they speak.
export function LanguageSelectScreen() {
  const { changeLanguage } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.appName}>SCCRM</Text>

        {/* Bilingual title so the screen is readable in either language */}
        <Text style={styles.title}>เลือกภาษา / Choose Language</Text>
        <Text style={styles.subtitle}>
          เปลี่ยนได้ทุกเมื่อในหน้าตั้งค่า{'\n'}You can change this anytime in Settings.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map(({ code, flag, label }) => (
            <Pressable
              key={code}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => void changeLanguage(code)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={styles.flag}>{flag}</Text>
              <Text style={styles.label}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    color: theme.colors.brand,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textHeading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  options: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  optionPressed: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.secondaryBg,
  },
  flag: {
    fontSize: 32,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textHeading,
  },
});
