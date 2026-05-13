import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { appConfig } from '../config';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../constants/keys';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerAuthScreen() {
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
    <Section title="Customer Login" subtitle="Use email first. Social login stays available below.">
      <Field label="Email" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
      <Field label="Password" value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
      <ActionButton label="Log In with Email" onPress={loginWithEmail} />
      <ActionButton label="Continue with LINE" onPress={() => handleProviderLogin('line')} variant="secondary" />
      <ActionButton label="Continue with Google" onPress={() => handleProviderLogin('google')} variant="secondary" />
      {showDemoHint ? (
        <Text style={styles.helper}>
          Demo preview is enabled. Use {DEMO_EMAIL} / {DEMO_PASSWORD} while the API base URL is still unset.
        </Text>
      ) : null}
      {!signupExpanded ? (
        <ActionButton label="Open Signup" onPress={() => setSignupExpanded(true)} variant="ghost" />
      ) : (
        <View style={styles.signupBlock}>
          <Field label="Full Name" value={customerName} onChangeText={setCustomerName} />
          <Field label="Phone" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
          <Field label="Email" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
          <ActionButton label="Send Signup OTP" onPress={startEmailOtpSignup} variant="secondary" />
          <Field label="Verification Code" value={customerOtp} onChangeText={setCustomerOtp} keyboardType="numeric" />
          <Field label="Password" value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
          <ActionButton label="Complete Signup by Email" onPress={completeEmailSignup} />
          <ActionButton label="Cancel" onPress={() => setSignupExpanded(false)} variant="ghost" />
        </View>
      )}
      <Text style={styles.helper}>
        LINE uses Expo Auth Session and should be tested on a real Android device because emulator behavior differs.
      </Text>
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
