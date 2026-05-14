import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerProfileScreen() {
  const { t } = useTranslation();
  const {
    customer,
    customerName, setCustomerName,
    customerEmail, setCustomerEmail,
    saveCustomerProfile,
  } = useCustomerSession();

  if (!customer) return null;

  return (
    <Section title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <Field
        label={t('profile.fullName')}
        value={customerName || customer.full_name || ''}
        onChangeText={setCustomerName}
      />
      <Field
        label={t('profile.email')}
        value={customerEmail || customer.email || ''}
        onChangeText={setCustomerEmail}
        keyboardType="email-address"
      />
      <Field label={t('profile.phone')} value={customer.phone} onChangeText={() => {}} keyboardType="phone-pad" />
      <ActionButton label={t('profile.save')} onPress={saveCustomerProfile} />
    </Section>
  );
}
