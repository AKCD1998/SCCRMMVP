import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { appConfig } from '../config';
import { apiRequest, decodeJwtPayload } from '../lib/api';
import { startGoogleLogin, startLineLogin } from '../lib/auth';
import type { Customer, PointHistoryItem, SessionResponse } from '../types';
import type { CustomerView, Mode } from '../types/app';
import { CUSTOMER_REFRESH_TOKEN_KEY, DEMO_EMAIL, DEMO_PASSWORD } from '../constants/keys';
import {
  validateEmailLogin,
  validateEmailSignup,
  validateOtpRequest,
  validateProfileUpdate,
  validateSocialSignup,
} from '../utils/validation';

// ─── Shape ────────────────────────────────────────────────────────────────────

interface CustomerSessionContextValue {
  // Post-login data
  customer: Customer | null;
  customerAccessToken: string | null;
  customerBalance: number;
  customerLifetimeEarned: number;
  customerHistory: PointHistoryItem[];
  tierProgress: number;

  // Navigation
  customerView: CustomerView;
  setCustomerView: (v: CustomerView) => void;

  // Auth / signup form fields
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  customerPassword: string;
  setCustomerPassword: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerOtp: string;
  setCustomerOtp: (v: string) => void;
  signupExpanded: boolean;
  setSignupExpanded: (v: boolean) => void;

  // Actions
  loginWithEmail: () => Promise<void>;
  handleProviderLogin: (provider: 'line' | 'google') => Promise<void>;
  startEmailOtpSignup: () => Promise<void>;
  completeEmailSignup: () => Promise<void>;
  completeSocialSignup: () => Promise<void>;
  saveCustomerProfile: () => Promise<void>;
  logoutCustomer: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface CustomerSessionProviderProps {
  children: React.ReactNode;
  setBusy: (v: boolean) => void;
  setMessage: (v: string) => void;
  setMode: (v: Mode) => void;
}

export function CustomerSessionProvider({
  children,
  setBusy,
  setMessage,
  setMode,
}: CustomerSessionProviderProps) {
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
    void restoreCustomerSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Internal helpers ───────────────────────────────────────────────────────

  async function restoreCustomerSession() {
    try {
      const refreshToken = await SecureStore.getItemAsync(CUSTOMER_REFRESH_TOKEN_KEY);
      if (refreshToken && appConfig.apiBaseUrl) {
        const refresh = await apiRequest<{ ok: true; accessToken: string; refreshToken: string }>(
          '/api/sccrm/auth/refresh',
          { method: 'POST', body: { refreshToken } }
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

    const detail = await apiRequest<{ ok: true; customer: Customer }>(
      `/api/sccrm/customers/${customerId}`,
      { token: accessToken }
    );
    const balance = await apiRequest<{ ok: true; balance: number; lifetimeEarned: number }>(
      `/api/sccrm/points/${customerId}/balance`,
      { token: accessToken }
    );
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

  // ─── Exported actions ───────────────────────────────────────────────────────

  async function loginWithEmail() {
    const err = validateEmailLogin(customerEmail, customerPassword);
    if (err) { setMessage(err); return; }
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
        body: { email: customerEmail, password: customerPassword, deviceLabel: 'expo-customer' },
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
      // Backend redirect flow: provider → backend GET /callback → sccrm://oauth?params
      // auth.ts opens the browser; backend does code exchange and redirects to deep link.
      const params = provider === 'line' ? await startLineLogin() : await startGoogleLogin();

      if (params.get('onboardingRequired') === 'true') {
        setCustomerOnboardingToken(params.get('onboardingToken') || '');
        setCustomerName(params.get('fullName') || '');
        setCustomerEmail(params.get('email') || '');
        setCustomerView('social-complete');
        setMode('customer');
        setMessage('Finish your profile to complete signup.');
        return;
      }

      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      if (!accessToken || !refreshToken) {
        throw new Error('Login failed — no tokens returned.');
      }
      await persistCustomerSession({ accessToken, refreshToken, customer: null });
      await hydrateCustomerFromToken(accessToken);
      setMessage('Logged in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Social login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function startEmailOtpSignup() {
    const err = validateOtpRequest(customerEmail);
    if (err) { setMessage(err); return; }
    setBusy(true);
    try {
      await apiRequest('/api/sccrm/auth/register', {
        method: 'POST',
        body: { step: 'send-otp', email: customerEmail },
      });
      setMessage('Verification code sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send verification code.');
    } finally {
      setBusy(false);
    }
  }

  async function completeEmailSignup() {
    const err = validateEmailSignup(customerEmail, customerOtp, customerPhone, customerName, customerPassword);
    if (err) { setMessage(err); return; }
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

  async function completeSocialSignup() {
    if (!customerOnboardingToken) return;
    const err = validateSocialSignup(customerPhone, customerName, customerEmail, customerPassword);
    if (err) { setMessage(err); return; }
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
    const err = validateProfileUpdate(customerName, customerEmail);
    if (err) { setMessage(err); return; }
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
          body: { fullName: customerName, email: customerEmail },
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

  // ─── Computed ───────────────────────────────────────────────────────────────

  const tierProgress = Math.min(
    1,
    customer?.tier === 'bronze'
      ? customerLifetimeEarned / 1000
      : customer?.tier === 'silver'
        ? (customerLifetimeEarned - 1000) / 4000
        : 1
  );

  // ─── Context value ──────────────────────────────────────────────────────────

  const value: CustomerSessionContextValue = {
    customer,
    customerAccessToken,
    customerBalance,
    customerLifetimeEarned,
    customerHistory,
    tierProgress,
    customerView,
    setCustomerView,
    customerEmail,
    setCustomerEmail,
    customerPassword,
    setCustomerPassword,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerOtp,
    setCustomerOtp,
    signupExpanded,
    setSignupExpanded,
    loginWithEmail,
    handleProviderLogin,
    startEmailOtpSignup,
    completeEmailSignup,
    completeSocialSignup,
    saveCustomerProfile,
    logoutCustomer,
  };

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCustomerSession(): CustomerSessionContextValue {
  const ctx = useContext(CustomerSessionContext);
  if (!ctx) throw new Error('useCustomerSession must be used inside CustomerSessionProvider');
  return ctx;
}
