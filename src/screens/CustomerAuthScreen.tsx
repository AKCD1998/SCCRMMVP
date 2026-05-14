import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
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
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerOtp, setCustomerOtp,
    signupExpanded, setSignupExpanded,
    loginWithEmail,
    handleProviderLogin,
    startEmailOtpSignup,
    completeEmailSignup,
  } = useCustomerSession();

  const showDemoHint = !appConfig.apiBaseUrl;

  return (
    <Section title={t('auth.title')} subtitle={t('auth.subtitle')}>
      <Field label={t('auth.email')} value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
      <Field label={t('auth.password')} value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
      <ActionButton label={t('auth.loginButton')} onPress={loginWithEmail} />
      <ActionButton label={t('auth.lineButton')} onPress={() => handleProviderLogin('line')} variant="secondary" />
      <ActionButton label={t('auth.googleButton')} onPress={() => handleProviderLogin('google')} variant="secondary" />
      {showDemoHint ? (
        <Text style={styles.helper}>
          Demo preview: {DEMO_EMAIL} / {DEMO_PASSWORD}
        </Text>
      ) : null}
      {!signupExpanded ? (
        <ActionButton label={t('auth.openSignup')} onPress={() => setSignupExpanded(true)} variant="ghost" />
      ) : (
        <View style={styles.signupBlock}>
          <Field label={t('auth.fullName')} value={customerName} onChangeText={setCustomerName} />
          <Field label={t('auth.phone')} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
          <Field label={t('auth.email')} value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
          <ActionButton label={t('auth.sendOtp')} onPress={startEmailOtpSignup} variant="secondary" />
          <Field label={t('auth.otp')} value={customerOtp} onChangeText={setCustomerOtp} keyboardType="numeric" />
          <Field label={t('auth.password')} value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
          <ActionButton label={t('auth.completeSignup')} onPress={completeEmailSignup} />
          <ActionButton label={t('auth.cancel')} onPress={() => setSignupExpanded(false)} variant="ghost" />
        </View>
      )}
      <Text style={styles.helper}>{t('auth.lineHint')}</Text>
    </Section>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  signupBlock: {
    gap: theme.spacing.sm,
    paddingTop: 6,
  },
});
