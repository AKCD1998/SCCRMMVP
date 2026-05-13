import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerPointsScreen() {
  const { customerBalance, customer, customerLifetimeEarned, tierProgress } = useCustomerSession();

  if (!customer) return null;

  return (
    <Section title="My Points" subtitle="Current balance plus tier progress.">
      <Text style={styles.pointsValue}>{customerBalance}</Text>
      <Text style={styles.metricRow}>Tier: {customer.tier}</Text>
      <Text style={styles.metricRow}>Lifetime earned: {customerLifetimeEarned}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
      </View>
      <Text style={styles.helper}>Redeem is coming soon. The app is already structured to support it later.</Text>
    </Section>
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
