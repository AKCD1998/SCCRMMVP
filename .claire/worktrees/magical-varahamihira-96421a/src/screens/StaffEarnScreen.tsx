import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import type { Customer } from '../types';

interface StaffEarnScreenProps {
  customer: Customer;
  staffAmount: string;
  setStaffAmount: (v: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function StaffEarnScreen({ customer, staffAmount, setStaffAmount, onConfirm, onBack }: StaffEarnScreenProps) {
  return (
    <Section
      title="Add Points"
      subtitle={`1 point per 10 THB. Customer: ${customer.full_name || customer.phone}`}
    >
      <Field label="Purchase Amount (THB)" value={staffAmount} onChangeText={setStaffAmount} keyboardType="numeric" />
      <Text style={styles.metricRow}>Estimated points: {Math.floor(Number(staffAmount || 0) / 10)}</Text>
      <ActionButton label="Confirm Add Points" onPress={onConfirm} />
      <ActionButton label="Back to Profile" onPress={onBack} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    color: '#314a45',
    fontSize: 15,
  },
});
