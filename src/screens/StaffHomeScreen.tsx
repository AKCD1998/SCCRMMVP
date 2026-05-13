import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffHomeScreen() {
  const { staffSearchPhone, setStaffSearchPhone, searchCustomer, setStaffView, logoutStaff } = useStaffSession();

  return (
    <Section title="Staff Home" subtitle="Search a customer by phone in one step.">
      <Field
        label="Phone Number"
        value={staffSearchPhone}
        onChangeText={setStaffSearchPhone}
        keyboardType="phone-pad"
        placeholder="0812345678"
      />
      <ActionButton label="Search Customer" onPress={searchCustomer} />
      <ActionButton label="Register New Customer" onPress={() => setStaffView('register')} variant="secondary" />
      <ActionButton label="Exit Staff Mode" onPress={logoutStaff} variant="ghost" />
    </Section>
  );
}
