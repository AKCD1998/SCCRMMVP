import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MemberCodeModal } from '../components/MemberCodeModal';
import { Section } from '../components/Section';
import { ScanButtonV1 } from '../components/ScanButton';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';
import { fetchMemberCard } from '../services/memberService';
import type { MemberCardViewModel } from '../types/memberTypes';

export function CustomerPointsScreen() {
  const {
    customer,
    customerAccessToken,
    customerBalance,
    customerLifetimeEarned,
    tierProgress,
  } = useCustomerSession();

  const [showMemberCode, setShowMemberCode] = useState(false);
  const [memberCard, setMemberCard] = useState<MemberCardViewModel | null>(null);

  // Lazily fetch the member card the first time the modal is opened.
  // memberService.fetchMemberCard() returns mock data now; later it will
  // call the shared backend (currentSC-official-website-project).
  const handleOpenMemberCard = useCallback(async () => {
    setShowMemberCode(true);
    if (memberCard || !customer || !customerAccessToken) return;
    const card = await fetchMemberCard(customer.id, customerAccessToken);
    setMemberCard(card);
  }, [memberCard, customer, customerAccessToken]);

  if (!customer) return null;

  return (
    <>
      <Section
        title="My Points"
        subtitle="Current balance plus tier progress."
        headerRight={<ScanButtonV1 onPress={handleOpenMemberCard} />}
      >
        <Text style={styles.pointsValue}>{customerBalance}</Text>
        <Text style={styles.metricRow}>Tier: {customer.tier}</Text>
        <Text style={styles.metricRow}>Lifetime earned: {customerLifetimeEarned}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
        </View>
        <Text style={styles.helper}>
          Redeem is coming soon. The app is already structured to support it later.
        </Text>
      </Section>

      <MemberCodeModal
        visible={showMemberCode}
        onClose={() => setShowMemberCode(false)}
        memberCard={memberCard}
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
});
