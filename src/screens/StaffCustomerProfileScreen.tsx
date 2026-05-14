import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useStaffSession } from '../context/StaffSessionContext';

export function StaffCustomerProfileScreen() {
  const { t } = useTranslation();
  const { selectedCustomer, setStaffView } = useStaffSession();

  if (!selectedCustomer) return null;

  return (
    <Section title={t('staffProfile.title')} subtitle={t('staffProfile.subtitle')}>
      <Text style={styles.metricTitle}>
        {selectedCustomer.full_name || t('staffProfile.unnamed')}
      </Text>
      <Text style={styles.metricRow}>{t('staffProfile.phone')} {selectedCustomer.phone}</Text>
      <Text style={styles.metricRow}>{t('staffProfile.tier')} {selectedCustomer.tier}</Text>
      <Text style={styles.metricRow}>{t('staffProfile.points')} {selectedCustomer.balance ?? 0}</Text>
      <Text style={styles.metricRow}>{t('staffProfile.recentTx')} {selectedCustomer.recentTransactions?.length ?? 0}</Text>
      <ActionButton label={t('staffProfile.addPoints')} onPress={() => setStaffView('earn')} />
      <ActionButton label={t('staffProfile.redeemPoints')} onPress={() => setStaffView('redeem')} variant="secondary" />
      <ActionButton label={t('staffProfile.backToSearch')} onPress={() => setStaffView('home')} variant="ghost" />
    </Section>
  );
}

const styles = StyleSheet.create({
  metricTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textHeading,
  },
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
});
