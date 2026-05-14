import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { Section } from '../components/Section';
import { appConfig } from '../config';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../constants/keys';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerAuthScreen() {
  const { t } = useTranslation();
  const {
    customerEmail, setCustomerEmail,
    customerPassword, setCustomerPassword,
    setCustomerView,
    loginWithEmail,
    handleProviderLogin,
  } = useCustomerSession();

  const showDemoHint = !appConfig.apiBaseUrl;

  return (
    <Section title={t('auth.title')} subtitle={t('auth.subtitle')}>
      <Field
        label={t('auth.email')}
        value={customerEmail}
        onChangeText={setCustomerEmail}
        keyboardType="email-address"
      />
      <Field
        label={t('auth.password')}
        value={customerPassword}
        onChangeText={setCustomerPassword}
        secureTextEntry
        rightLabel={t('auth.forgotLink')}
        onRightLabelPress={() => setCustomerView('forgot-password')}
      />
      <ActionButton label={t('auth.loginButton')} onPress={loginWithEmail} />
      <ActionButton label={t('auth.lineButton')} onPress={() => handleProviderLogin('line')} variant="secondary" />
      <ActionButton label={t('auth.googleButton')} onPress={() => handleProviderLogin('google')} variant="secondary" />
      <PrivacyNotice context="social" />
      <ActionButton label={t('auth.registerLink')} onPress={() => setCustomerView('register')} variant="accent" />
      {showDemoHint ? (
        <Text style={styles.helper}>
          Demo preview: {DEMO_EMAIL} / {DEMO_PASSWORD}
        </Text>
      ) : null}
      <Text style={styles.helper}>{t('auth.lineHint')}</Text>
    </Section>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
});
