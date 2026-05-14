import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffHomeScreen() {
  const { t } = useTranslation();
  const { staffSearchPhone, setStaffSearchPhone, searchCustomer, setStaffView, logoutStaff } = useStaffSession();

  return (
    <Section title={t('staffHome.title')} subtitle={t('staffHome.subtitle')}>
      <Field
        label={t('staffHome.phone')}
        value={staffSearchPhone}
        onChangeText={setStaffSearchPhone}
        keyboardType="phone-pad"
        placeholder="0812345678"
      />
      <ActionButton label={t('staffHome.search')} onPress={searchCustomer} />
      <ActionButton label={t('staffHome.register')} onPress={() => setStaffView('register')} variant="secondary" />
      <ActionButton label={t('staffHome.exit')} onPress={logoutStaff} variant="ghost" />
    </Section>
  );
}
