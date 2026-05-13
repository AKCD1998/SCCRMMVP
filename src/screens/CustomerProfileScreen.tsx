import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerProfileScreen() {
  const {
    customer,
    customerName, setCustomerName,
    customerEmail, setCustomerEmail,
    saveCustomerProfile,
  } = useCustomerSession();

  if (!customer) return null;

  return (
    <Section title="Profile" subtitle="Update the basics only for MVP.">
      <Field
        label="Full Name"
        value={customerName || customer.full_name || ''}
        onChangeText={setCustomerName}
      />
      <Field
        label="Email"
        value={customerEmail || customer.email || ''}
        onChangeText={setCustomerEmail}
        keyboardType="email-address"
      />
      <Field label="Phone" value={customer.phone} onChangeText={() => {}} keyboardType="phone-pad" />
      <ActionButton label="Save Profile" onPress={saveCustomerProfile} />
    </Section>
  );
}
