import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

// ─── Social Complete Screen ───────────────────────────────────────────────────
//
// Shown after LINE / Google login when a user has no existing account.
// The provider already gave us their name and email — we only need phone.
//
// TODO (Profile Settings — future): implement formal account linking here so
// a user can connect LINE ↔ Google ↔ email in one unified profile page.

export function SocialCompleteScreen() {
  const { t } = useTranslation();
  const {
    customerName,
    customerEmail,
    customerPhone, setCustomerPhone,
    completeSocialSignup,
    setCustomerView,
  } = useCustomerSession();

  return (
    <Section title={t('social.title')} subtitle={t('social.subtitle')}>

      {/* ── Provider info (read-only) ── */}
      {(customerName || customerEmail) ? (
        <View style={styles.providerCard}>
          {customerName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('social.fullName')}</Text>
              <Text style={styles.infoValue}>{customerName}</Text>
            </View>
          ) : null}
          {customerEmail ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('social.email')}</Text>
              <Text style={styles.infoValue}>{customerEmail}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Only missing field: phone ── */}
      <Field
        label={t('social.phone')}
        value={customerPhone}
        onChangeText={setCustomerPhone}
        keyboardType="phone-pad"
        placeholder={t('social.phonePlaceholder')}
      />

      <ActionButton label={t('social.finish')} onPress={completeSocialSignup} />
      <ActionButton
        label={t('social.backToLogin')}
        onPress={() => setCustomerView('auth')}
        variant="ghost"
      />
    </Section>
  );
}

const styles = StyleSheet.create({
  providerCard: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textBody,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
});
