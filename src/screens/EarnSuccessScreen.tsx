import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';
import type { EarnResult } from '../types/memberTypes';

interface EarnSuccessScreenProps {
  earnResult: EarnResult;
  onBack: () => void;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(i18n.language === 'th' ? 'th-TH' : 'en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatThb(amount: number | null): string {
  if (amount == null) return '—';
  return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EarnSuccessScreen({ earnResult, onBack }: EarnSuccessScreenProps) {
  const { t } = useTranslation();
  const { customer } = useCustomerSession();

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      {/* ── Success badge ── */}
      <View style={styles.successBadge}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.heading}>{t('earnSuccess.heading')}</Text>
      <Text style={styles.subheading}>{t('earnSuccess.subheading')}</Text>

      {/* ── Details card ── */}
      <Section title={t('earnSuccess.detailsTitle')}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('earnSuccess.memberName')}</Text>
          <Text style={styles.value}>
            {earnResult.customerName || customer?.full_name || '—'}
          </Text>
        </View>

        {earnResult.receiptNumber ? (
          <View style={styles.row}>
            <Text style={styles.label}>{t('earnSuccess.receipt')}</Text>
            <Text style={styles.value}>{earnResult.receiptNumber}</Text>
          </View>
        ) : null}

        {earnResult.branchName ? (
          <View style={styles.row}>
            <Text style={styles.label}>{t('earnSuccess.branch')}</Text>
            <Text style={styles.value}>{earnResult.branchName}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>{t('earnSuccess.amount')}</Text>
          <Text style={styles.value}>{formatThb(earnResult.totalAmount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>{t('earnSuccess.totalPoints')}</Text>
          <Text style={[styles.value, styles.pointsEarned]}>
            {t('earnSuccess.pointsEarned', { points: earnResult.earnedPoints.toLocaleString() })}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{t('earnSuccess.totalPoints')}</Text>
          <Text style={[styles.value, styles.totalPoints]}>
            {t('earnSuccess.totalValue', { balance: earnResult.newBalance.toLocaleString() })}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>{t('earnSuccess.time')}</Text>
          <Text style={styles.value}>{formatDateTime(earnResult.createdAt)}</Text>
        </View>
      </Section>

      {/* ── Back button ── */}
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('earnSuccess.back')}
      >
        <Text style={styles.backButtonText}>{t('earnSuccess.back')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: 48,
    gap: theme.spacing.md,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 42,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textHeading,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textBody,
    textAlign: 'right',
    flex: 1,
  },
  pointsEarned: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.success,
  },
  totalPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.brand,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 6,
  },
  backButton: {
    width: '100%',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
