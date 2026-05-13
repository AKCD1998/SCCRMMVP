import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffEarnScreen() {
  const { selectedCustomer, staffAmount, setStaffAmount, earnPoints, setStaffView } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section
      title="Add Points"
      subtitle={`1 point per 10 THB. Customer: ${selectedCustomer.full_name || selectedCustomer.phone}`}
    >
      <Field label="Purchase Amount (THB)" value={staffAmount} onChangeText={setStaffAmount} keyboardType="numeric" />
      <Text style={styles.metricRow}>Estimated points: {Math.floor(Number(staffAmount || 0) / 10)}</Text>
      <ActionButton label="Confirm Add Points" onPress={earnPoints} />
      <ActionButton label="Back to Profile" onPress={() => setStaffView('profile')} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
});
