import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { appConfig } from './src/config';
import { apiRequest, decodeJwtPayload } from './src/lib/api';
import { startGoogleLogin, startLineLogin } from './src/lib/auth';
import type { Customer, PointHistoryItem, SessionResponse } from './src/types';

const STAFF_TOKEN_KEY = 'sccrm_staff_token';
const STAFF_DEVICE_ID_KEY = 'sccrm_staff_device_id';
const CUSTOMER_REFRESH_TOKEN_KEY = 'sccrm_customer_refresh_token';
const DEMO_EMAIL = 'auukunn.bkk@gmail.com';
const DEMO_PASSWORD = 'StrongPass123';

type Mode = 'gateway' | 'staff' | 'customer';
type StaffView = 'auth' | 'home' | 'profile' | 'earn' | 'redeem' | 'register';
type CustomerView = 'auth' | 'points' | 'history' | 'profile' | 'social-complete';

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#83918e"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'ghost' && styles.buttonTextGhost,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>('customer');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');

  const [staffView, setStaffView] = useState<StaffView>('auth');
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [staffDeviceName, setStaffDeviceName] = useState('Counter Tablet');
  const [staffPin, setStaffPin] = useState('');
  const [staffSearchPhone, setStaffSearchPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [staffAmount, setStaffAmount] = useState('');
  const [staffRedeemPoints, setStaffRedeemPoints] = useState('');
  const [staffRewardName, setStaffRewardName] = useState('');
  const [staffRegisterName, setStaffRegisterName] = useState('');
  const [staffRegisterPhone, setStaffRegisterPhone] = useState('');
  const [staffRegisterEmail, setStaffRegisterEmail] = useState('');

  const [customerView, setCustomerView] = useState<CustomerView>('auth');
  const [customerAccessToken, setCustomerAccessToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [customerLifetimeEarned, setCustomerLifetimeEarned] = useState(0);
  const [customerHistory, setCustomerHistory] = useState<PointHistoryItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerOtp, setCustomerOtp] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerOnboardingToken, setCustomerOnboardingToken] = useState<string | null>(null);
  const [signupExpanded, setSignupExpanded] = useState(false);

  useEffect(() => {
    void restoreLocalSessions();
  }, []);

  async function restoreLocalSessions() {
    setBusy(true);
    try {
      const storedStaffToken = await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
      if (storedStaffToken) {
        setStaffToken(storedStaffToken);
        setStaffView('home');
      }

      const refreshToken = await SecureStore.getItemAsync(CUSTOMER_REFRESH_TOKEN_KEY);
      if (refreshToken && appConfig.apiBaseUrl) {
        const refresh = await apiRequest<{ ok: true; accessToken: string; refreshToken: string }>(
          '/api/sccrm/auth/refresh',
          {
            method: 'POST',
            body: { refreshToken },
          }
        );
        await persistCustomerSession({
          accessToken: refresh.accessToken,
          refreshToken: refresh.refreshToken,
          customer: null,
        });
        await hydrateCustomerFromToken(refresh.accessToken);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to restore session.');
    } finally {
      setBusy(false);
    }
  }

  function loadDemoCustomerSession() {
    setCustomerAccessToken('demo-customer-token');
    setCustomer({
      id: 'demo-customer',
      phone: '0812345678',
      full_name: 'Auukunn BKK',
      email: DEMO_EMAIL,
      tier: 'silver',
      balance: 245,
      recentTransactions: [
        {
          id: 'txn-demo-1',
          total_amount: 850,
          point_earned: 85,
          source: 'manual',
          created_at: new Date().toISOString(),
        },
      ],
    });
    setCustomerBalance(245);
    setCustomerLifetimeEarned(1240);
    setCustomerHistory([
      {
        id: 'hist-demo-1',
        amount: 85,
        type: 'purchase',
        note: 'Boots pharmacy purchase',
        created_by: 'staff-demo',
        created_at: new Date().toISOString(),
      },
      {
        id: 'hist-demo-2',
        amount: -40,
        type: 'redeem',
        note: 'Voucher redemption',
        created_by: 'staff-demo',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    setCustomerName('Auukunn BKK');
    setCustomerEmail(DEMO_EMAIL);
    setCustomerPhone('0812345678');
    setCustomerView('points');
    setMode('customer');
    setSignupExpanded(false);
  }

  async function persistCustomerSession(payload: {
    accessToken: string;
    refreshToken: string;
    customer: Customer | null;
  }) {
    setCustomerAccessToken(payload.accessToken);
    if (payload.customer) setCustomer(payload.customer);
    await SecureStore.setItemAsync(CUSTOMER_REFRESH_TOKEN_KEY, payload.refreshToken);
  }

  async function hydrateCustomerFromToken(accessToken: string) {
    const payload = decodeJwtPayload(accessToken);
    const customerId = String(payload.customerId || '');
    if (!customerId) throw new Error('Customer token did not include customerId.');

    const detail = await apiRequest<{ ok: true; customer: Customer }>(`/api/sccrm/customers/${customerId}`, {
      token: accessToken,
    });
    const balance = await apiRequest<{
      ok: true;
      balance: number;
      lifetimeEarned: number;
    }>(`/api/sccrm/points/${customerId}/balance`, { token: accessToken });
    const history = await apiRequest<{ ok: true; items: PointHistoryItem[] }>(
      `/api/sccrm/points/${customerId}/history`,
      { token: accessToken }
    );

    setCustomer(detail.customer);
    setCustomerBalance(balance.balance);
    setCustomerLifetimeEarned(balance.lifetimeEarned);
    setCustomerHistory(history.items);
    setCustomerView('points');
    setMode('customer');
  }

  async function ensureStaffDeviceId() {
    const existing = await SecureStore.getItemAsync(STAFF_DEVICE_ID_KEY);
    if (existing) return existing;
    const next = createLocalId('staff-device');
    await SecureStore.setItemAsync(STAFF_DEVICE_ID_KEY, next);
    return next;
  }

  async function bootstrapStaffDevice() {
    setBusy(true);
    try {
      const deviceId = await ensureStaffDeviceId();
      const response = await apiRequest<{ ok: true; staffToken: string }>('/api/sccrm/auth/staff-device', {
        method: 'POST',
        body: {
          deviceId,
          deviceName: staffDeviceName,
          pin: staffPin,
        },
      });
      await SecureStore.setItemAsync(STAFF_TOKEN_KEY, response.staffToken);
      setStaffToken(response.staffToken);
      setStaffPin('');
      setStaffView('home');
      setMode('staff');
      setMessage('Staff device authenticated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to authenticate staff device.');
    } finally {
      setBusy(false);
    }
  }

  async function searchCustomer() {
    if (!staffToken) return;
    setBusy(true);
    try {
      const response = await apiRequest<{ ok: true; customer: Customer | null }>(
        `/api/sccrm/customers/search?phone=${encodeURIComponent(staffSearchPhone)}`,
        { token: staffToken }
      );
      if (!response.customer) {
        setSelectedCustomer(null);
        setMessage('No customer found for that phone number.');
        return;
      }
      await loadStaffCustomer(response.customer.id);
      setStaffView('profile');
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Customer search failed.');
    } finally {
      setBusy(false);
    }
  }

  async function loadStaffCustomer(customerId: string) {
    if (!staffToken) return;
    const response = await apiRequest<{ ok: true; customer: Customer }>(`/api/sccrm/customers/${customerId}`, {
      token: staffToken,
    });
    setSelectedCustomer(response.customer);
  }

  async function registerStaffCustomer() {
    if (!staffToken) return;
    setBusy(true);
    try {
      const response = await apiRequest<{ ok: true; customer: Customer }>('/api/sccrm/customers', {
        method: 'POST',
        token: staffToken,
        body: {
          phone: staffRegisterPhone,
          fullName: staffRegisterName,
          email: staffRegisterEmail || undefined,
        },
      });
      setSelectedCustomer(response.customer);
      setStaffRegisterName('');
      setStaffRegisterPhone('');
      setStaffRegisterEmail('');
      setStaffView('profile');
      setMessage('Customer created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create customer.');
    } finally {
      setBusy(false);
    }
  }

  async function earnPoints() {
    if (!staffToken || !selectedCustomer) return;
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/points/earn', {
        method: 'POST',
        token: staffToken,
        body: {
          customer_id: selectedCustomer.id,
          amount_thb: Number(staffAmount),
          reference_id: `manual-${Date.now()}`,
        },
      });
      await loadStaffCustomer(selectedCustomer.id);
      setStaffAmount('');
      setStaffView('profile');
      setMessage('Points added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to add points.');
    } finally {
      setBusy(false);
    }
  }

  async function redeemPoints() {
    if (!staffToken || !selectedCustomer) return;
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/points/redeem', {
        method: 'POST',
        token: staffToken,
        body: {
          customer_id: selectedCustomer.id,
          points: Number(staffRedeemPoints),
          reward_name: staffRewardName,
        },
      });
      await loadStaffCustomer(selectedCustomer.id);
      setStaffRedeemPoints('');
      setStaffRewardName('');
      setStaffView('profile');
      setMessage('Points redeemed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to redeem points.');
    } finally {
      setBusy(false);
    }
  }

  async function startEmailOtpSignup() {
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/auth/register', {
        method: 'POST',
        body: {
          step: 'send-otp',
          email: customerEmail,
        },
      });
      setMessage('Verification code sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send verification code.');
    } finally {
      setBusy(false);
    }
  }

  async function completeEmailSignup() {
    setBusy(true);
    try {
      const session = await apiRequest<SessionResponse>('/api/sccrm/auth/register', {
        method: 'POST',
        body: {
          step: 'complete-email-signup',
          email: customerEmail,
          otp: customerOtp,
          phone: customerPhone,
          fullName: customerName,
          password: customerPassword,
          deviceLabel: 'expo-customer',
        },
      });
      await persistCustomerSession(session);
      await hydrateCustomerFromToken(session.accessToken);
      setMessage('Account created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to complete signup.');
    } finally {
      setBusy(false);
    }
  }

  async function loginWithEmail() {
    setBusy(true);
    try {
      if (!appConfig.apiBaseUrl) {
        if (customerEmail.trim().toLowerCase() === DEMO_EMAIL && customerPassword === DEMO_PASSWORD) {
          loadDemoCustomerSession();
          setMessage('Logged in with demo customer access.');
          return;
        }
        throw new Error('Backend is not configured. Use the demo email and password for preview access.');
      }

      const session = await apiRequest<SessionResponse>('/api/sccrm/auth/login', {
        method: 'POST',
        body: {
          email: customerEmail,
          password: customerPassword,
          deviceLabel: 'expo-customer',
        },
      });
      await persistCustomerSession(session);
      await hydrateCustomerFromToken(session.accessToken);
      setMessage('Logged in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Email login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleProviderLogin(provider: 'line' | 'google') {
    setBusy(true);
    try {
      const code = provider === 'line' ? await startLineLogin() : await startGoogleLogin();
      const response = await apiRequest<
        | (SessionResponse & { onboardingRequired: false })
        | {
            ok: true;
            onboardingRequired: true;
            onboardingToken: string;
            profile: { fullName?: string | null; email?: string | null };
          }
      >(`/api/sccrm/auth/${provider}-callback`, {
        method: 'POST',
        body: {
          code,
          deviceLabel: `expo-${provider}`,
        },
      });

      if ('onboardingRequired' in response && response.onboardingRequired) {
        setCustomerOnboardingToken(response.onboardingToken);
        setCustomerName(response.profile.fullName || '');
        setCustomerEmail(response.profile.email || '');
        setCustomerView('social-complete');
        setMode('customer');
        setMessage('Finish your profile to complete signup.');
        return;
      }

      await persistCustomerSession(response);
      await hydrateCustomerFromToken(response.accessToken);
      setMessage('Logged in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Social login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function completeSocialSignup() {
    if (!customerOnboardingToken) return;
    setBusy(true);
    try {
      const session = await apiRequest<SessionResponse>('/api/sccrm/auth/register', {
        method: 'POST',
        body: {
          step: 'complete-social-signup',
          onboardingToken: customerOnboardingToken,
          phone: customerPhone,
          fullName: customerName,
          email: customerEmail,
          password: customerPassword,
          deviceLabel: 'expo-social',
        },
      });
      await persistCustomerSession(session);
      setCustomerOnboardingToken(null);
      await hydrateCustomerFromToken(session.accessToken);
      setMessage('Signup completed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to complete social signup.');
    } finally {
      setBusy(false);
    }
  }

  async function saveCustomerProfile() {
    if (!customer || !customerAccessToken) return;
    setBusy(true);
    try {
      if (!appConfig.apiBaseUrl && customer.id === 'demo-customer') {
        setCustomer({
          ...customer,
          full_name: customerName || customer.full_name,
          email: customerEmail || customer.email,
        });
        setMessage('Profile updated locally in demo mode.');
        return;
      }

      const response = await apiRequest<{ ok: true; customer: Customer }>(
        `/api/sccrm/customers/${customer.id}`,
        {
          method: 'PATCH',
          token: customerAccessToken,
          body: {
            fullName: customerName,
            email: customerEmail,
          },
        }
      );
      setCustomer(response.customer);
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  }

  async function logoutStaff() {
    await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
    setStaffToken(null);
    setSelectedCustomer(null);
    setStaffView('auth');
    setMode('gateway');
  }

  async function logoutCustomer() {
    await SecureStore.deleteItemAsync(CUSTOMER_REFRESH_TOKEN_KEY);
    setCustomerAccessToken(null);
    setCustomer(null);
    setCustomerHistory([]);
    setCustomerBalance(0);
    setCustomerLifetimeEarned(0);
    setCustomerView('auth');
    setMode('customer');
    setMessage('');
  }

  const progress = Math.min(
    1,
    customer?.tier === 'bronze'
      ? customerLifetimeEarned / 1000
      : customer?.tier === 'silver'
        ? (customerLifetimeEarned - 1000) / 4000
        : 1
  );

  if (busy) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#0e5f56" />
        <Text style={styles.loadingText}>Preparing SCCRM...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>SCCRM</Text>
        <Text style={styles.brandSubtitle}>Pharmacy CRM MVP for staff speed and customer self-service.</Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {mode === 'staff' && staffView === 'auth' && (
          <Section title="Staff Device Access" subtitle="Authenticate this device with the shared staff PIN.">
            <Field label="Device Name" value={staffDeviceName} onChangeText={setStaffDeviceName} />
            <Field label="Staff PIN" value={staffPin} onChangeText={setStaffPin} secureTextEntry keyboardType="numeric" />
            <ActionButton label="Unlock Staff Mode" onPress={bootstrapStaffDevice} />
          </Section>
        )}

        {mode === 'staff' && staffView === 'home' && (
          <Section title="Staff Home" subtitle="Search a customer by phone in one step.">
            <Field
              label="Phone Number"
              value={staffSearchPhone}
              onChangeText={setStaffSearchPhone}
              keyboardType="phone-pad"
              placeholder="0812345678"
            />
            <ActionButton label="Search Customer" onPress={searchCustomer} />
            <ActionButton label="Register New Customer" onPress={() => setStaffView('register')} variant="secondary" />
            <ActionButton label="Exit Staff Mode" onPress={logoutStaff} variant="ghost" />
          </Section>
        )}

        {mode === 'staff' && staffView === 'register' && (
          <Section title="Register Customer" subtitle="Minimum fields only.">
            <Field label="Full Name" value={staffRegisterName} onChangeText={setStaffRegisterName} />
            <Field label="Phone" value={staffRegisterPhone} onChangeText={setStaffRegisterPhone} keyboardType="phone-pad" />
            <Field label="Email (optional)" value={staffRegisterEmail} onChangeText={setStaffRegisterEmail} keyboardType="email-address" />
            <ActionButton label="Create Customer" onPress={registerStaffCustomer} />
            <ActionButton label="Back to Staff Home" onPress={() => setStaffView('home')} variant="ghost" />
          </Section>
        )}

        {mode === 'staff' && staffView === 'profile' && selectedCustomer && (
          <Section title="Customer Profile" subtitle="Three taps or fewer to complete common staff actions.">
            <Text style={styles.metricTitle}>{selectedCustomer.full_name || 'Unnamed Customer'}</Text>
            <Text style={styles.metricRow}>Phone: {selectedCustomer.phone}</Text>
            <Text style={styles.metricRow}>Tier: {selectedCustomer.tier}</Text>
            <Text style={styles.metricRow}>Current Points: {selectedCustomer.balance ?? 0}</Text>
            <Text style={styles.metricRow}>Recent Transactions: {selectedCustomer.recentTransactions?.length ?? 0}</Text>
            <ActionButton label="Add Points" onPress={() => setStaffView('earn')} />
            <ActionButton label="Redeem Points" onPress={() => setStaffView('redeem')} variant="secondary" />
            <ActionButton label="Back to Search" onPress={() => setStaffView('home')} variant="ghost" />
          </Section>
        )}

        {mode === 'staff' && staffView === 'earn' && selectedCustomer && (
          <Section title="Add Points" subtitle={`1 point per 10 THB. Customer: ${selectedCustomer.full_name || selectedCustomer.phone}`}>
            <Field label="Purchase Amount (THB)" value={staffAmount} onChangeText={setStaffAmount} keyboardType="numeric" />
            <Text style={styles.metricRow}>Estimated points: {Math.floor(Number(staffAmount || 0) / 10)}</Text>
            <ActionButton label="Confirm Add Points" onPress={earnPoints} />
            <ActionButton label="Back to Profile" onPress={() => setStaffView('profile')} variant="ghost" />
          </Section>
        )}

        {mode === 'staff' && staffView === 'redeem' && selectedCustomer && (
          <Section title="Redeem Points" subtitle={`Available balance: ${selectedCustomer.balance ?? 0}`}>
            <Field label="Points to Redeem" value={staffRedeemPoints} onChangeText={setStaffRedeemPoints} keyboardType="numeric" />
            <Field label="Reward Name" value={staffRewardName} onChangeText={setStaffRewardName} placeholder="Coupon or reward" />
            <ActionButton label="Confirm Redemption" onPress={redeemPoints} />
            <ActionButton label="Back to Profile" onPress={() => setStaffView('profile')} variant="ghost" />
          </Section>
        )}

        {mode === 'customer' && customerView === 'auth' && (
          <Section title="Customer Login" subtitle="Use email first. Social login stays available below.">
            <Field label="Email" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
            <Field label="Password" value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
            <ActionButton label="Log In with Email" onPress={loginWithEmail} />
            <ActionButton label="Continue with LINE" onPress={() => handleProviderLogin('line')} variant="secondary" />
            <ActionButton label="Continue with Google" onPress={() => handleProviderLogin('google')} variant="secondary" />
            {!appConfig.apiBaseUrl ? (
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
        )}

        {mode === 'customer' && customerView === 'social-complete' && (
          <Section title="Complete Social Signup" subtitle="Phone is mandatory before customer creation completes.">
            <Field label="Full Name" value={customerName} onChangeText={setCustomerName} />
            <Field label="Email" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" />
            <Field label="Phone" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
            <Field label="Set Password" value={customerPassword} onChangeText={setCustomerPassword} secureTextEntry />
            <ActionButton label="Finish Signup" onPress={completeSocialSignup} />
            <ActionButton label="Back to Login" onPress={() => setCustomerView('auth')} variant="ghost" />
          </Section>
        )}

        {mode === 'customer' && customer && customerView !== 'auth' && customerView !== 'social-complete' && (
          <>
            <Section title="Customer Navigation">
              <View style={styles.tabRow}>
                <ActionButton label="My Points" onPress={() => setCustomerView('points')} variant={customerView === 'points' ? 'primary' : 'ghost'} />
                <ActionButton label="History" onPress={() => setCustomerView('history')} variant={customerView === 'history' ? 'primary' : 'ghost'} />
                <ActionButton label="Profile" onPress={() => setCustomerView('profile')} variant={customerView === 'profile' ? 'primary' : 'ghost'} />
              </View>
              <ActionButton label="Log Out" onPress={logoutCustomer} variant="secondary" />
            </Section>

            {customerView === 'points' && (
              <Section title="My Points" subtitle="Current balance plus tier progress.">
                <Text style={styles.pointsValue}>{customerBalance}</Text>
                <Text style={styles.metricRow}>Tier: {customer.tier}</Text>
                <Text style={styles.metricRow}>Lifetime earned: {customerLifetimeEarned}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.helper}>
                  Redeem is coming soon. The app is already structured to support it later.
                </Text>
              </Section>
            )}

            {customerView === 'history' && (
              <Section title="Transaction History" subtitle="Newest earn and spend events first.">
                {customerHistory.length === 0 ? (
                  <Text style={styles.helper}>No point history yet.</Text>
                ) : (
                  customerHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyAmount}>{item.amount > 0 ? `+${item.amount}` : item.amount}</Text>
                      <View style={styles.historyMeta}>
                        <Text style={styles.historyNote}>{item.note || item.type}</Text>
                        <Text style={styles.historyTime}>{new Date(item.created_at).toLocaleString()}</Text>
                      </View>
                    </View>
                  ))
                )}
                <ActionButton label="Redeem (Coming Soon)" onPress={() => {}} disabled />
              </Section>
            )}

            {customerView === 'profile' && (
              <Section title="Profile" subtitle="Update the basics only for MVP.">
                <Field label="Full Name" value={customerName || customer.full_name || ''} onChangeText={setCustomerName} />
                <Field
                  label="Email"
                  value={customerEmail || customer.email || ''}
                  onChangeText={setCustomerEmail}
                  keyboardType="email-address"
                />
                <Field label="Phone" value={customer.phone} onChangeText={() => {}} keyboardType="phone-pad" />
                <ActionButton label="Save Profile" onPress={saveCustomerProfile} />
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3efe5',
  },
  container: {
    padding: 20,
    gap: 18,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3efe5',
  },
  loadingText: {
    marginTop: 12,
    color: '#204742',
    fontSize: 16,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#123c36',
  },
  brandSubtitle: {
    color: '#4d6561',
    fontSize: 15,
    lineHeight: 22,
  },
  message: {
    backgroundColor: '#d8ebe5',
    color: '#0e5f56',
    padding: 12,
    borderRadius: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fffef8',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d7d1c2',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#173933',
  },
  sectionSubtitle: {
    color: '#5c726e',
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#5b6a66',
  },
  input: {
    backgroundColor: '#f7f4ea',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8d0be',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    color: '#122f2b',
  },
  button: {
    backgroundColor: '#0e5f56',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#d7ebe7',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#bfd0cb',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fffef8',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: '#0e5f56',
  },
  buttonTextGhost: {
    color: '#315752',
  },
  metricTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#173933',
  },
  metricRow: {
    color: '#314a45',
    fontSize: 15,
  },
  pointsValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#0e5f56',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#e2ddd0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0e5f56',
    borderRadius: 999,
  },
  helper: {
    color: '#687d79',
    lineHeight: 20,
  },
  signupBlock: {
    gap: 12,
    paddingTop: 6,
  },
  tabRow: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ece5d6',
  },
  historyAmount: {
    width: 70,
    fontSize: 20,
    fontWeight: '800',
    color: '#0e5f56',
  },
  historyMeta: {
    flex: 1,
    gap: 4,
  },
  historyNote: {
    fontSize: 15,
    fontWeight: '600',
    color: '#213f3a',
  },
  historyTime: {
    color: '#657975',
    fontSize: 13,
  },
});
