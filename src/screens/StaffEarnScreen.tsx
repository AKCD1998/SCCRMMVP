import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffEarnScreen() {
  const { t } = useTranslation();
  const { selectedCustomer, staffAmount, setStaffAmount, earnPoints, setStaffView } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section
      title={t('earn.title')}
      subtitle={t('earn.subtitle', { name: selectedCustomer.full_name || selectedCustomer.phone })}
    >
      <Field label={t('earn.amount')} value={staffAmount} onChangeText={setStaffAmount} keyboardType="numeric" />
      <Text style={styles.metricRow}>
        {t('earn.estimated', { points: Math.floor(Number(staffAmount || 0) / 10) })}
      </Text>
      <ActionButton label={t('earn.confirm')} onPress={earnPoints} />
      <ActionButton label={t('earn.back')} onPress={() => setStaffView('profile')} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
});
