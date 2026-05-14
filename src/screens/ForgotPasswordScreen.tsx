import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { StepIndicator } from '../components/StepIndicator';
import { theme } from '../constants/theme';
import { appConfig } from '../config';
import { apiRequest } from '../lib/api';
import { useCustomerSession } from '../context/CustomerSessionContext';

type ResetStep = 1 | 2 | 3;

// ─── Password requirement row (same rules as register) ────────────────────────

const prStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 13, fontWeight: '700', width: 18, textAlign: 'center' },
  label: { fontSize: 13 },
  pass: { color: theme.colors.success },
  fail: { color: theme.colors.error },
});

function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={prStyles.row}>
      <Text style={[prStyles.icon, met ? prStyles.pass : prStyles.fail]}>{met ? '✓' : '✗'}</Text>
      <Text style={[prStyles.label, met ? prStyles.pass : prStyles.fail]}>{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { customerEmail, setCustomerEmail, setCustomerView } = useCustomerSession();

  const [step, setStep] = useState<ResetStep>(1);
  const [submittedEmail, setSubmittedEmail] = useState(''); // locked once OTP is sent
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const subtitles: Record<ResetStep, string> = {
    1: t('forgotPassword.step1Subtitle'),
    2: t('forgotPassword.step2Subtitle'),
    3: t('forgotPassword.step3Subtitle'),
  };

  const passwordRules = [
    { met: newPassword.length >= 2,                              text: t('forgotPassword.ruleMin2') },
    { met: /[A-Z]/.test(newPassword),                           text: t('forgotPassword.ruleUppercase') },
    { met: newPassword.length >= 8,                             text: t('forgotPassword.ruleMin8') },
    { met: newPassword.length > 0 && newPassword.length <= 32,  text: t('forgotPassword.ruleMax32') },
  ];

  async function handleSendOtp() {
    setError('');
    if (!customerEmail.trim()) {
      setError(t('forgotPassword.email') + ' is required.');
      return;
    }
    if (!appConfig.apiBaseUrl) {
      setError('API not configured — cannot send OTP in demo mode.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/auth/forgot-password', {
        method: 'POST',
        body: { email: customerEmail.trim().toLowerCase() },
      });
      setSubmittedEmail(customerEmail.trim().toLowerCase());
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResendOtp() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/sccrm/auth/forgot-password', {
        method: 'POST',
        body: { email: submittedEmail },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    if (!otp.trim()) {
      setError('OTP is required.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest<{ ok: boolean; resetToken: string }>(
        '/api/sccrm/auth/verify-reset-otp',
        { method: 'POST', body: { email: submittedEmail, otp: otp.trim() } }
      );
      setResetToken(result.resetToken);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify OTP.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    setError('');
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/auth/reset-password', {
        method: 'POST',
        body: { email: submittedEmail, resetToken, newPassword },
      });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Section title={t('forgotPassword.title')} subtitle="">
        <Text style={styles.successTitle}>{t('forgotPassword.successTitle')}</Text>
        <Text style={styles.successBody}>{t('forgotPassword.successBody')}</Text>
        <ActionButton label={t('forgotPassword.back')} onPress={() => setCustomerView('auth')} />
      </Section>
    );
  }

  return (
    <Section title={t('forgotPassword.title')} subtitle={subtitles[step]}>
      <StepIndicator total={3} current={step} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* ── Step 1: Email ── */}
      {step === 1 && (
        <>
          <Field
            label={t('forgotPassword.email')}
            value={customerEmail}
            onChangeText={(v) => { setCustomerEmail(v); setError(''); }}
            keyboardType="email-address"
            placeholder={t('forgotPassword.emailPlaceholder')}
          />
          <ActionButton
            label={busy ? '...' : t('forgotPassword.sendOtp')}
            onPress={handleSendOtp}
            disabled={busy}
          />
          <ActionButton label={t('forgotPassword.back')} onPress={() => setCustomerView('auth')} variant="danger" />
        </>
      )}

      {/* ── Step 2: OTP ── */}
      {step === 2 && (
        <>
          <Text style={styles.instruction}>
            {t('forgotPassword.otpInstruction')} {submittedEmail}
          </Text>
          <Field
            label={t('forgotPassword.otp')}
            value={otp}
            onChangeText={(v) => { setOtp(v); setError(''); }}
            keyboardType="numeric"
            placeholder={t('forgotPassword.otpPlaceholder')}
            rightLabel={t('forgotPassword.resendOtp')}
            onRightLabelPress={handleResendOtp}
          />
          <ActionButton
            label={busy ? '...' : t('forgotPassword.verify')}
            onPress={handleVerifyOtp}
            disabled={busy}
          />
          <ActionButton label={t('forgotPassword.goBack')} onPress={() => setStep(1)} variant="danger" />
        </>
      )}

      {/* ── Step 3: New password ── */}
      {step === 3 && (
        <>
          <Text style={styles.stepLabel}>{t('forgotPassword.setPassword')}</Text>
          <Field
            label={t('forgotPassword.password')}
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); setMismatch(false); setError(''); }}
            placeholder={t('forgotPassword.passwordPlaceholder')}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((s) => !s)}
          />
          <Field
            label={t('forgotPassword.confirmPassword')}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setMismatch(false); setError(''); }}
            placeholder={t('forgotPassword.confirmPlaceholder')}
            secureTextEntry={!showConfirm}
            onToggleSecure={() => setShowConfirm((s) => !s)}
          />
          {mismatch && <Text style={styles.error}>{t('forgotPassword.passwordMismatch')}</Text>}
          <Text style={styles.rulesTitle}>{t('forgotPassword.passwordRulesTitle')}:</Text>
          <View style={styles.rules}>
            {passwordRules.map((rule, i) => (
              <PasswordRule key={i} met={rule.met} text={rule.text} />
            ))}
          </View>
          <ActionButton
            label={busy ? '...' : t('forgotPassword.save')}
            onPress={handleResetPassword}
            disabled={busy}
          />
          <ActionButton label={t('forgotPassword.goBack')} onPress={() => setStep(2)} variant="danger" />
        </>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 13,
    color: theme.colors.error,
    lineHeight: 20,
  },
  instruction: {
    fontSize: 14,
    color: theme.colors.textBody,
    lineHeight: 22,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textHeading,
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
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.success,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 15,
    color: theme.colors.textBody,
    lineHeight: 24,
    textAlign: 'center',
  },
});
