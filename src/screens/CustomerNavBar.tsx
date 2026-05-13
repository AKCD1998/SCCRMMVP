import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Section } from '../components/Section';
import { useCustomerSession } from '../context/CustomerSessionContext';

export function CustomerNavBar() {
  const { customerView, setCustomerView, logoutCustomer } = useCustomerSession();

  return (
    <Section title="Customer Navigation">
      <View style={styles.tabRow}>
        <ActionButton
          label="My Points"
          onPress={() => setCustomerView('points')}
          variant={customerView === 'points' ? 'primary' : 'ghost'}
        />
        <ActionButton
          label="History"
          onPress={() => setCustomerView('history')}
          variant={customerView === 'history' ? 'primary' : 'ghost'}
        />
        <ActionButton
          label="Profile"
          onPress={() => setCustomerView('profile')}
          variant={customerView === 'profile' ? 'primary' : 'ghost'}
        />
      </View>
      <ActionButton label="Log Out" onPress={logoutCustomer} variant="secondary" />
    </Section>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    gap: 10,
  },
});
