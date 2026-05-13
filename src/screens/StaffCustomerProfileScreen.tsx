import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffCustomerProfileScreen() {
  const { selectedCustomer, setStaffView } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section title="Customer Profile" subtitle="Three taps or fewer to complete common staff actions.">
      <Text style={styles.metricTitle}>{selectedCustomer.full_name || 'Unnamed Customer'}</Text>
      <Text style={styles.metricRow}>Phone: {selectedCustomer.phone}</Text>
      <Text style={styles.metricRow}>Tier: {selectedCustomer.tier}</Text>
      <Text style={styles.metricRow}>Current Points: {selectedCustomer.balance ?? 0}</Text>
      <Text style={styles.metricRow}>Recent Transactions: {selectedCustomer.recentTransactions?.length ?? 0}</Text>
      <ActionButton label="Add Points" onPress={() => setStaffView('earn')} />
      <ActionButton label="Redeem Points" onPress={() => setStaffView('redeem')} variant="secondary" />
      <ActionButton label="Back to Search" onPress={() => setStaffView('home')} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  metricTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textHeading,
  },
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
});
