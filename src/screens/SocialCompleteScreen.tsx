import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function SocialCompleteScreen() {
  const { t } = useTranslation();
  const {
    customerName, setCustomerName,
    customerEmail, setCustomerEmail,
    customerPhone, setCustomerPhone,
    customerPassword, setCustomerPassword,
    completeSocialSignup,
    setCustomerView,
  } = useCustomerSession();

  return (
    <Section title={t('social.title')} subtitle={t('social.subtitle')}>
      <Field label={t('social.fullName')} value={customerName} onChangeText={setCustomerName} />
      <Field label={t('social.email')} value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
      <Field label={t('social.phone')} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
      <Field label={t('social.password')} value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
      <ActionButton label={t('social.finish')} onPress={completeSocialSignup} />
      <ActionButton label={t('social.backToLogin')} onPress={() => setCustomerView('auth')} variant="ghost" />
    </Section>
  );
}
