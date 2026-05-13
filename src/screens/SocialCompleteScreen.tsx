import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function SocialCompleteScreen() {
  const {
    customerName, setCustomerName,
    customerEmail, setCustomerEmail,
    customerPhone, setCustomerPhone,
    customerPassword, setCustomerPassword,
    completeSocialSignup,
    setCustomerView,
  } = useCustomerSession();

  return (
    <Section title="Complete Social Signup" subtitle="Phone is mandatory before customer creation completes.">
      <Field label="Full Name" value={customerName} onChangeText={setCustomerName} />
      <Field label="Email" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
      <Field label="Phone" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
      <Field label="Set Password" value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
      <ActionButton label="Finish Signup" onPress={completeSocialSignup} />
      <ActionButton label="Back to Login" onPress={() => setCustomerView('auth')} variant="ghost" />
    </Section>
  );
}
