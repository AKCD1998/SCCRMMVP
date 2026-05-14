import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffRegisterScreen() {
  const { t } = useTranslation();
  const {
    staffRegisterName, setStaffRegisterName,
    staffRegisterPhone, setStaffRegisterPhone,
    staffRegisterEmail, setStaffRegisterEmail,
    registerStaffCustomer,
    setStaffView,
  } = useStaffSession();

  return (
    <Section title={t('register.title')} subtitle={t('register.subtitle')}>
      <Field label={t('register.fullName')} value={staffRegisterName} onChangeText={setStaffRegisterName} />
      <Field label={t('register.phone')} value={staffRegisterPhone} onChangeText={setStaffRegisterPhone} keyboardType="phone-pad" />
      <Field
        label={t('register.email')}
        value={staffRegisterEmail}
        onChangeText={setStaffRegisterEmail}
        keyboardType="email-address"
      />
      <ActionButton label={t('register.create')} onPress={registerStaffCustomer} />
      <ActionButton label={t('register.back')} onPress={() => setStaffView('home')} variant="ghost" />
    </Section>
  );
}
