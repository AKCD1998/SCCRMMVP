import React from 'react';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffAuthScreen() {
  const { staffDeviceName, setStaffDeviceName, staffPin, setStaffPin, bootstrapStaffDevice } = useStaffSession();

  return (
    <Section title="Staff Device Access" subtitle="Authenticate this device with the shared staff PIN.">
      <Field label="Device Name" value={staffDeviceName} onChangeText={setStaffDeviceName} />
      <Field label="Staff PIN" value={staffPin} onChangeText={setStaffPin} secureTextEntry keyboardType="numeric" />
      <ActionButton label="Unlock Staff Mode" onPress={bootstrapStaffDevice} />
    </Section>
  );
}
