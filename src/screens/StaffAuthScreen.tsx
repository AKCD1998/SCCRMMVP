import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffAuthScreen() {
  const { t } = useTranslation();
  const { staffDeviceName, setStaffDeviceName, staffPin, setStaffPin, bootstrapStaffDevice } = useStaffSession();

  return (
    <Section title={t('staffAuth.title')} subtitle={t('staffAuth.subtitle')}>
      <Field label={t('staffAuth.deviceName')} value={staffDeviceName} onChangeText={setStaffDeviceName} />
      <Field label={t('staffAuth.pin')} value={staffPin} onChangeText={setStaffPin} secureTextEntry keyboardType="numeric" />
      <ActionButton label={t('staffAuth.unlock')} onPress={bootstrapStaffDevice} />
    </Section>
  );
}
