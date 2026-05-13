import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffRedeemScreen() {
  const {
    selectedCustomer,
    staffRedeemPoints, setStaffRedeemPoints,
    staffRewardName, setStaffRewardName,
    redeemPoints,
    setStaffView,
  } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section title="Redeem Points" subtitle={`Available balance: ${selectedCustomer.balance ?? 0}`}>
      <Field
        label="Points to Redeem"
        value={staffRedeemPoints}
        onChangeText={setStaffRedeemPoints}
        keyboardType="numeric"
      />
      <Field
        label="Reward Name"
        value={staffRewardName}
        onChangeText={setStaffRewardName}
        placeholder="Coupon or reward"
      />
      <ActionButton label="Confirm Redemption" onPress={redeemPoints} />
      <ActionButton label="Back to Profile" onPress={() => setStaffView('profile')} variant="ghost" />
    </Section>
  );
}
