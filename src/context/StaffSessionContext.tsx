import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { apiRequest } from '../lib/api';
import type { Customer } from '../types';
import type { Mode, StaffView } from '../types/app';
import { STAFF_DEVICE_ID_KEY, STAFF_TOKEN_KEY } from '../constants/keys';
import {
  validateEarnPoints,
  validatePhoneSearch,
  validateRedeemPoints,
  validateStaffDeviceAuth,
  validateStaffRegister,
} from '../utils/validation';

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Shape ────────────────────────────────────────────────────────────────────

interface StaffSessionContextValue {
  staffToken: string | null;
  staffView: StaffView;
  setStaffView: (v: StaffView) => void;
  staffDeviceName: string;
  setStaffDeviceName: (v: string) => void;
  staffPin: string;
  setStaffPin: (v: string) => void;
  staffSearchPhone: string;
  setStaffSearchPhone: (v: string) => void;
  selectedCustomer: Customer | null;
  staffAmount: string;
  setStaffAmount: (v: string) => void;
  staffRedeemPoints: string;
  setStaffRedeemPoints: (v: string) => void;
  staffRewardName: string;
  setStaffRewardName: (v: string) => void;
  staffRegisterName: string;
  setStaffRegisterName: (v: string) => void;
  staffRegisterPhone: string;
  setStaffRegisterPhone: (v: string) => void;
  staffRegisterEmail: string;
  setStaffRegisterEmail: (v: string) => void;

  // Actions
  bootstrapStaffDevice: () => Promise<void>;
  searchCustomer: () => Promise<void>;
  registerStaffCustomer: () => Promise<void>;
  earnPoints: () => Promise<void>;
  redeemPoints: () => Promise<void>;
  logoutStaff: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StaffSessionContext = createContext<StaffSessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface StaffSessionProviderProps {
  children: React.ReactNode;
  setBusy: (v: boolean) => void;
  setMessage: (v: string) => void;
  setMode: (v: Mode) => void;
}

export function StaffSessionProvider({
  children,
  setBusy,
  setMessage,
  setMode,
}: StaffSessionProviderProps) {
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

  useEffect(() => {
    void restoreStaffSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Internal helpers ───────────────────────────────────────────────────────

  async function restoreStaffSession() {
    try {
      const storedStaffToken = await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
      if (storedStaffToken) {
        setStaffToken(storedStaffToken);
        setStaffView('home');
        // Note: original code does not call setMode('staff') during restoration
      }
    } catch {
      // Staff session restoration is best-effort; user will just re-authenticate
    }
  }

  async function ensureStaffDeviceId() {
    const existing = await SecureStore.getItemAsync(STAFF_DEVICE_ID_KEY);
    if (existing) return existing;
    const next = createLocalId('staff-device');
    await SecureStore.setItemAsync(STAFF_DEVICE_ID_KEY, next);
    return next;
  }

  async function loadStaffCustomer(customerId: string) {
    if (!staffToken) return;
    const response = await apiRequest<{ ok: true; customer: Customer }>(
      `/api/sccrm/customers/${customerId}`,
      { token: staffToken }
    );
    setSelectedCustomer(response.customer);
  }

  // ─── Exported actions ───────────────────────────────────────────────────────

  async function bootstrapStaffDevice() {
    const err = validateStaffDeviceAuth(staffDeviceName, staffPin);
    if (err) { setMessage(err); return; }
    setBusy(true);
    try {
      const deviceId = await ensureStaffDeviceId();
      const response = await apiRequest<{ ok: true; staffToken: string }>(
        '/api/sccrm/auth/staff-device',
        {
          method: 'POST',
          body: { deviceId, deviceName: staffDeviceName, pin: staffPin },
        }
      );
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
    const err = validatePhoneSearch(staffSearchPhone);
    if (err) { setMessage(err); return; }
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

  async function registerStaffCustomer() {
    if (!staffToken) return;
    const err = validateStaffRegister(staffRegisterName, staffRegisterPhone, staffRegisterEmail);
    if (err) { setMessage(err); return; }
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
    const err = validateEarnPoints(staffAmount);
    if (err) { setMessage(err); return; }
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
    const err = validateRedeemPoints(staffRedeemPoints, staffRewardName);
    if (err) { setMessage(err); return; }
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

  async function logoutStaff() {
    await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
    setStaffToken(null);
    setSelectedCustomer(null);
    setStaffView('auth');
    setMode('gateway');
  }

  // ─── Context value ──────────────────────────────────────────────────────────

  const value: StaffSessionContextValue = {
    staffToken,
    staffView,
    setStaffView,
    staffDeviceName,
    setStaffDeviceName,
    staffPin,
    setStaffPin,
    staffSearchPhone,
    setStaffSearchPhone,
    selectedCustomer,
    staffAmount,
    setStaffAmount,
    staffRedeemPoints,
    setStaffRedeemPoints,
    staffRewardName,
    setStaffRewardName,
    staffRegisterName,
    setStaffRegisterName,
    staffRegisterPhone,
    setStaffRegisterPhone,
    staffRegisterEmail,
    setStaffRegisterEmail,
    bootstrapStaffDevice,
    searchCustomer,
    registerStaffCustomer,
    earnPoints,
    redeemPoints,
    logoutStaff,
  };

  return (
    <StaffSessionContext.Provider value={value}>
      {children}
    </StaffSessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStaffSession(): StaffSessionContextValue {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error('useStaffSession must be used inside StaffSessionProvider');
  return ctx;
}
