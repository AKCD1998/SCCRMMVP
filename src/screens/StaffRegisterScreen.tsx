import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffRegisterScreen() {
  const {
    staffRegisterName, setStaffRegisterName,
    staffRegisterPhone, setStaffRegisterPhone,
    staffRegisterEmail, setStaffRegisterEmail,
    registerStaffCustomer,
    setStaffView,
  } = useStaffSession();

  return (
    <Section title="Register Customer" subtitle="Minimum fields only.">
      <Field label="Full Name" value={staffRegisterName} onChangeText={setStaffRegisterName} />
      <Field label="Phone" value={staffRegisterPhone} onChangeText={setStaffRegisterPhone} keyboardType="phone-pad" />
      <Field
        label="Email (optional)"
        value={staffRegisterEmail}
        onChangeText={setStaffRegisterEmail}
        keyboardType="email-address"
      />
      <ActionButton label="Create Customer" onPress={registerStaffCustomer} />
      <ActionButton label="Back to Staff Home" onPress={() => setStaffView('home')} variant="ghost" />
    </Section>
  );
}
