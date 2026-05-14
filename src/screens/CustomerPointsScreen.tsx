import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberCodeModal, MOCK_MEMBER_CODE } from '../components/MemberCodeModal';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

// Small inline QR-style icon built from Views — no icon library needed.
function QrIconButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.qrButton, pressed && styles.qrButtonPressed]}
      accessibilityLabel="Show member code"
      accessibilityRole="button"
    >
      <View style={styles.qrIconGrid}>
        {/* Top row: filled, gap, filled */}
        <View style={[styles.qrDot, styles.qrDotFilled]} />
        <View style={styles.qrDot} />
        <View style={[styles.qrDot, styles.qrDotFilled]} />
        {/* Middle row: gap, filled, gap */}
        <View style={styles.qrDot} />
        <View style={[styles.qrDot, styles.qrDotFilled]} />
        <View style={styles.qrDot} />
        {/* Bottom row: filled, gap, filled */}
        <View style={[styles.qrDot, styles.qrDotFilled]} />
        <View style={styles.qrDot} />
        <View style={[styles.qrDot, styles.qrDotFilled]} />
      </View>
    </Pressable>
  );
}

export function CustomerPointsScreen() {
  const { customerBalance, customer, customerLifetimeEarned, tierProgress } = useCustomerSession();
  const [showMemberCode, setShowMemberCode] = useState(false);

  if (!customer) return null;

  // TODO: When backend is ready, replace MOCK_MEMBER_CODE with the real member code.
  // Options:
  //   1. Add memberCode field to the Customer type in src/types.ts
  //   2. Expose it from CustomerSessionContext (e.g. customer.memberCode)
  //   3. Fetch from: GET /api/sccrm/customers/:id/member-code
  //      (Backend service: https://dashboard.render.com/web/srv-d58idfm3jp1c73bhgv40)
  const memberCode = MOCK_MEMBER_CODE;

  return (
    <>
      <Section
        title="My Points"
        subtitle="Current balance plus tier progress."
        rightAction={<QrIconButton onPress={() => setShowMemberCode(true)} />}
      >
        <Text style={styles.pointsValue}>{customerBalance}</Text>
        <Text style={styles.metricRow}>Tier: {customer.tier}</Text>
        <Text style={styles.metricRow}>Lifetime earned: {customerLifetimeEarned}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
        </View>
        <Text style={styles.helper}>Redeem is coming soon. The app is already structured to support it later.</Text>
      </Section>

      <MemberCodeModal
        visible={showMemberCode}
        onClose={() => setShowMemberCode(false)}
        memberCode={memberCode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pointsValue: {
    fontSize: 56,
    fontWeight: '900',
    color: theme.colors.brand,
  },
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.progressTrack,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
  },
  helper: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  qrButton: {
    padding: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondaryBg,
  },
  qrButtonPressed: {
    opacity: 0.7,
  },
  qrIconGrid: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  qrDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  qrDotFilled: {
    backgroundColor: theme.colors.brand,
  },
});
