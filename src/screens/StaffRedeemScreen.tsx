import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffRedeemScreen() {
  const { t } = useTranslation();
  const {
    selectedCustomer,
    staffRedeemPoints, setStaffRedeemPoints,
    staffRewardName, setStaffRewardName,
    redeemPoints,
    setStaffView,
  } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section
      title={t('redeem.title')}
      subtitle={t('redeem.subtitle', { balance: selectedCustomer.balance ?? 0 })}
    >
      <Field
        label={t('redeem.points')}
        value={staffRedeemPoints}
        onChangeText={setStaffRedeemPoints}
        keyboardType="numeric"
      />
      <Field
        label={t('redeem.reward')}
        value={staffRewardName}
        onChangeText={setStaffRewardName}
        placeholder={t('redeem.rewardPlaceholder')}
      />
      <ActionButton label={t('redeem.confirm')} onPress={redeemPoints} />
      <ActionButton label={t('redeem.back')} onPress={() => setStaffView('profile')} variant="ghost" />
    </Section>
  );
}
