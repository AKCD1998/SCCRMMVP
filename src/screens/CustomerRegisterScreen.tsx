import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { StepIndicator } from '../components/StepIndicator';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

type RegisterStep = 1 | 2 | 3;

// ─── Password requirement row ─────────────────────────────────────────────────

const prStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 13,
    fontWeight: '700',
    width: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
  },
  pass: { color: theme.colors.success },
  fail: { color: theme.colors.error },
});

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={prStyles.row}>
      <Text style={[prStyles.icon, met ? prStyles.pass : prStyles.fail]}>
        {met ? '✓' : '✗'}
      </Text>
      <Text style={[prStyles.label, met ? prStyles.pass : prStyles.fail]}>{text}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function CustomerRegisterScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<RegisterStep>(1);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const {
    customerEmail, setCustomerEmail,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerOtp, setCustomerOtp,
    customerPassword, setCustomerPassword,
    setCustomerView,
    startEmailOtpSignup,
    completeEmailSignup,
  } = useCustomerSession();

  const subtitles: Record<RegisterStep, string> = {
    1: t('signup.step1Subtitle'),
    2: t('signup.step2Subtitle'),
    3: t('signup.step3Subtitle'),
  };

  const passwordRules = [
    { met: customerPassword.length >= 2,                                   text: t('signup.ruleMin2') },
    { met: /[A-Z]/.test(customerPassword),                                 text: t('signup.ruleUppercase') },
    { met: customerPassword.length >= 8,                                   text: t('signup.ruleMin8') },
    { met: customerPassword.length > 0 && customerPassword.length <= 32,   text: t('signup.ruleMax32') },
  ];

  function handleSendOtp() {
    void startEmailOtpSignup();
    setStep(2);
  }

  function handleComplete() {
    if (customerPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    void completeEmailSignup();
  }

  return (
    <Section title={t('signup.title')} subtitle={subtitles[step]}>
      <StepIndicator total={3} current={step} />

      {/* ── Step 1: Personal info ── */}
      {step === 1 && (
        <>
          <Text style={styles.stepLabel}>{t('signup.personalInfo')}</Text>
          <Field
            label={t('signup.fullName')}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={t('signup.fullNamePlaceholder')}
          />
          <Field
            label={t('signup.phone')}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
            placeholder={t('signup.phonePlaceholder')}
          />
          <Field
            label={t('signup.email')}
            value={customerEmail}
            onChangeText={setCustomerEmail}
            keyboardType="email-address"
            placeholder={t('signup.emailPlaceholder')}
          />
          <ActionButton label={t('signup.sendOtp')} onPress={handleSendOtp} variant="secondary" />
          <ActionButton label={t('signup.back')} onPress={() => setCustomerView('auth')} variant="danger" />
        </>
      )}

      {/* ── Step 2: OTP verification ── */}
      {step === 2 && (
        <>
          <Text style={styles.instruction}>{t('signup.otpInstruction')}</Text>
          <Text style={styles.emailChip}>{customerEmail}</Text>
          <Field
            label={t('signup.otp')}
            value={customerOtp}
            onChangeText={setCustomerOtp}
            keyboardType="numeric"
            placeholder={t('signup.otpPlaceholder')}
            rightLabel={t('signup.resendOtp')}
            onRightLabelPress={() => void startEmailOtpSignup()}
          />
          <ActionButton label={t('signup.continue')} onPress={() => setStep(3)} />
          <ActionButton label={t('signup.goBack')} onPress={() => setStep(1)} variant="danger" />
        </>
      )}

      {/* ── Step 3: Set password ── */}
      {step === 3 && (
        <>
          <Text style={styles.stepLabel}>{t('signup.setPassword')}</Text>
          <Field
            label={t('signup.password')}
            value={customerPassword}
            onChangeText={(v) => { setCustomerPassword(v); setMismatch(false); }}
            placeholder={t('signup.passwordPlaceholder')}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((s) => !s)}
          />
          <Field
            label={t('signup.confirmPassword')}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setMismatch(false); }}
            placeholder={t('signup.confirmPlaceholder')}
            secureTextEntry={!showConfirm}
            onToggleSecure={() => setShowConfirm((s) => !s)}
          />
          {mismatch && (
            <Text style={styles.mismatch}>{t('signup.passwordMismatch')}</Text>
          )}
          <Text style={styles.rulesTitle}>{t('signup.passwordRulesTitle')}:</Text>
          <View style={styles.rules}>
            {passwordRules.map((rule, i) => (
              <PasswordRule key={i} met={rule.met} text={rule.text} />
            ))}
          </View>
          <ActionButton label={t('signup.complete')} onPress={handleComplete} />
          <ActionButton label={t('signup.goBack')} onPress={() => setStep(2)} variant="danger" />
        </>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textHeading,
  },
  instruction: {
    fontSize: 14,
    color: theme.colors.textBody,
    lineHeight: 22,
  },
  emailChip: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: -4,
  },
  mismatch: {
    fontSize: 13,
    color: theme.colors.error,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textBody,
    marginTop: 4,
  },
  rules: {
    gap: 6,
  },
});
