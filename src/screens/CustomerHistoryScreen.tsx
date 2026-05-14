import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';
import { Section } from '../components/Section';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerHistoryScreen() {
  const { t } = useTranslation();
  const { customerHistory } = useCustomerSession();

  return (
    <Section title={t('history.title')} subtitle={t('history.subtitle')}>
      {customerHistory.length === 0 ? (
        <Text style={styles.helper}>{t('history.empty')}</Text>
      ) : (
        customerHistory.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={[styles.historyAmount, item.amount < 0 && styles.historyAmountNegative]}>
              {item.amount > 0 ? `+${item.amount}` : item.amount}
            </Text>
            <View style={styles.historyMeta}>
              <Text style={styles.historyNote}>{item.note || item.type}</Text>
              <Text style={styles.historyTime}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </View>
        ))
      )}
      <ActionButton label={t('history.redeemSoon')} onPress={() => {}} disabled />
    </Section>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  historyAmount: {
    width: 70,
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.success,
  },
  historyAmountNegative: {
    color: theme.colors.textMuted,
  },
  historyMeta: {
    flex: 1,
    gap: 4,
  },
  historyNote: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  historyTime: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
