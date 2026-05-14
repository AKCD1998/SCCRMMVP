import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

// NOTE: No backend endpoint for password reset exists yet.
// The submit button surfaces a "coming soon" notice until the backend is ready.
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { customerEmail, setCustomerEmail, setCustomerView } = useCustomerSession();
  const [submitted, setSubmitted] = useState(false);

  return (
    <Section title={t('forgotPassword.title')} subtitle={t('forgotPassword.subtitle')}>
      <Field
        label={t('forgotPassword.email')}
        value={customerEmail}
        onChangeText={setCustomerEmail}
        keyboardType="email-address"
      />
      {submitted ? (
        <Text style={styles.notice}>{t('forgotPassword.pending')}</Text>
      ) : (
        <ActionButton label={t('forgotPassword.submit')} onPress={() => setSubmitted(true)} />
      )}
      <ActionButton label={t('forgotPassword.back')} onPress={() => setCustomerView('auth')} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  notice: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 22,
    paddingVertical: 8,
  },
});
