import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Mode } from './src/types/app';
import { theme } from './src/constants/theme';
import { CustomerDrawer } from './src/components/CustomerDrawer';
import { CustomerSessionProvider, useCustomerSession } from './src/context/CustomerSessionContext';
import { StaffSessionProvider, useStaffSession } from './src/context/StaffSessionContext';

import { CustomerAuthScreen } from './src/screens/CustomerAuthScreen';
import { CustomerHistoryScreen } from './src/screens/CustomerHistoryScreen';
import { CustomerPointsScreen } from './src/screens/CustomerPointsScreen';
import { CustomerProfileScreen } from './src/screens/CustomerProfileScreen';
import { SocialCompleteScreen } from './src/screens/SocialCompleteScreen';
import { StaffAuthScreen } from './src/screens/StaffAuthScreen';
import { StaffCustomerProfileScreen } from './src/screens/StaffCustomerProfileScreen';
import { StaffEarnScreen } from './src/screens/StaffEarnScreen';
import { StaffHomeScreen } from './src/screens/StaffHomeScreen';
import { StaffRedeemScreen } from './src/screens/StaffRedeemScreen';
import { StaffRegisterScreen } from './src/screens/StaffRegisterScreen';

// ─── Inner shell (must live inside both providers) ────────────────────────────

function AppShell({ mode, message }: { mode: Mode; message: string }) {
  const { customerView, customer } = useCustomerSession();
  const { staffView } = useStaffSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showHamburger =
    mode === 'customer' &&
    customer !== null &&
    customerView !== 'auth' &&
    customerView !== 'social-complete';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {showHamburger && (
        <CustomerDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}

      <ScrollView contentContainerStyle={styles.container}>
        {showHamburger ? (
          <View style={styles.headerRow}>
            <Pressable
              style={styles.hamburger}
              onPress={() => setDrawerOpen(true)}
              hitSlop={10}
            >
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </Pressable>
            <Text style={styles.brand}>SCCRM</Text>
          </View>
        ) : (
          <Text style={styles.brand}>SCCRM</Text>
        )}
        <Text style={styles.brandSubtitle}>Pharmacy CRM MVP for staff speed and customer self-service.</Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* Staff screens */}
        {mode === 'staff' && staffView === 'auth' && <StaffAuthScreen />}
        {mode === 'staff' && staffView === 'home' && <StaffHomeScreen />}
        {mode === 'staff' && staffView === 'register' && <StaffRegisterScreen />}
        {mode === 'staff' && staffView === 'profile' && <StaffCustomerProfileScreen />}
        {mode === 'staff' && staffView === 'earn' && <StaffEarnScreen />}
        {mode === 'staff' && staffView === 'redeem' && <StaffRedeemScreen />}

        {/* Customer auth screens */}
        {mode === 'customer' && customerView === 'auth' && <CustomerAuthScreen />}
        {mode === 'customer' && customerView === 'social-complete' && <SocialCompleteScreen />}

        {/* Authenticated customer screens */}
        {mode === 'customer' && customer && customerView !== 'auth' && customerView !== 'social-complete' && (
          <>
            {customerView === 'points' && <CustomerPointsScreen />}
            {customerView === 'history' && <CustomerHistoryScreen />}
            {customerView === 'profile' && <CustomerProfileScreen />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>('customer');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <CustomerSessionProvider setBusy={setBusy} setMessage={setMessage} setMode={setMode}>
      <StaffSessionProvider setBusy={setBusy} setMessage={setMessage} setMode={setMode}>
        {busy ? (
          <SafeAreaView style={styles.loadingScreen}>
            <ActivityIndicator size="large" color={theme.colors.brand} />
            <Text style={styles.loadingText}>Preparing SCCRM...</Text>
          </SafeAreaView>
        ) : (
          <AppShell mode={mode} message={message} />
        )}
      </StaffSessionProvider>
    </CustomerSessionProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  container: {
    padding: 20,
    gap: 18,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.pageBackground,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textBody,
    fontSize: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburger: {
    gap: 5,
    padding: 4,
    justifyContent: 'center',
  },
  bar: {
    width: 22,
    height: 2.5,
    backgroundColor: theme.colors.brand,
    borderRadius: 2,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: theme.colors.brand,
  },
  brandSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  message: {
    backgroundColor: theme.colors.messageBg,
    color: theme.colors.messageText,
    padding: 12,
    borderRadius: theme.radius.md,
    fontWeight: '600',
  },
});
