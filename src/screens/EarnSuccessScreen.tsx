import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    return new Date(iso).toLocaleString('th-TH', {
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
  const { customer } = useCustomerSession();

  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      {/* ── Success badge ── */}
      <View style={styles.successBadge}>
        <Text style={styles.successIcon}>✓</Text>
      </View>
      <Text style={styles.heading}>สะสมแต้มเสร็จสิ้น</Text>
      <Text style={styles.subheading}>ยินดีด้วย! คุณได้รับแต้มสะสมแล้ว</Text>

      {/* ── Details card ── */}
      <Section title="รายละเอียดการทำรายการ">
        <View style={styles.row}>
          <Text style={styles.label}>ชื่อสมาชิก</Text>
          <Text style={styles.value}>
            {earnResult.customerName || customer?.full_name || '—'}
          </Text>
        </View>

        {earnResult.receiptNumber ? (
          <View style={styles.row}>
            <Text style={styles.label}>เลขที่ใบเสร็จ</Text>
            <Text style={styles.value}>{earnResult.receiptNumber}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>ยอดซื้อ</Text>
          <Text style={styles.value}>{formatThb(earnResult.totalAmount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>แต้มที่ได้รับ</Text>
          <Text style={[styles.value, styles.pointsEarned]}>
            +{earnResult.earnedPoints.toLocaleString()} แต้ม
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>แต้มสะสมทั้งหมด</Text>
          <Text style={[styles.value, styles.totalPoints]}>
            {earnResult.newBalance.toLocaleString()} แต้ม
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>ทำรายการเมื่อ</Text>
          <Text style={styles.value}>{formatDateTime(earnResult.createdAt)}</Text>
        </View>
      </Section>

      {/* ── Back button ── */}
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="ย้อนกลับ"
      >
        <Text style={styles.backButtonText}>ย้อนกลับ</Text>
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
