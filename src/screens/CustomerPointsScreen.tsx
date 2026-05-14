import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MemberCodeModal } from '../components/MemberCodeModal';
import { Section } from '../components/Section';
import { ScanButtonV1 } from '../components/ScanButton';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';
import { EarnSuccessScreen } from './EarnSuccessScreen';
import { fetchMemberCard, fetchScanToken, pollRecentEarn } from '../services/memberService';
import type { EarnResult, MemberCardViewModel } from '../types/memberTypes';

const POLL_INTERVAL_MS = 3000;

export function CustomerPointsScreen() {
  const {
    customer,
    customerAccessToken,
    customerBalance,
    customerLifetimeEarned,
    tierProgress,
  } = useCustomerSession();

  const [showMemberCode, setShowMemberCode]   = useState(false);
  const [memberCard, setMemberCard]           = useState<MemberCardViewModel | null>(null);
  const [scanToken, setScanToken]             = useState<string | null>(null);
  const [scanTokenExpiresAt, setScanTokenExpiresAt] = useState<Date | null>(null);
  const [earnResult, setEarnResult]           = useState<EarnResult | null>(null);
  const [showSuccess, setShowSuccess]         = useState(false);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const openedAtRef = useRef<Date | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current != null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadScanToken = useCallback(async () => {
    if (!customerAccessToken) return;
    try {
      const result = await fetchScanToken(customerAccessToken);
      setScanToken(result.token);
      setScanTokenExpiresAt(result.expiresAt);
    } catch {
      // fail silently — barcode stays in placeholder state
    }
  }, [customerAccessToken]);

  const startPolling = useCallback(() => {
    if (!customer || !customerAccessToken || pollRef.current != null) return;
    openedAtRef.current = new Date();

    pollRef.current = setInterval(async () => {
      if (!openedAtRef.current) return;
      try {
        const result = await pollRecentEarn(
          customer.id,
          customerAccessToken,
          openedAtRef.current,
          customer.full_name ?? customer.email ?? '',
        );
        if (result) {
          stopPolling();
          setShowMemberCode(false);
          setEarnResult(result);
          setShowSuccess(true);
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [customer, customerAccessToken, stopPolling]);

  // Stop polling whenever the QR modal closes
  useEffect(() => {
    if (!showMemberCode) stopPolling();
  }, [showMemberCode, stopPolling]);

  // Clean up on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleOpenMemberCard = useCallback(async () => {
    setShowMemberCode(true);
    startPolling();

    // Fetch member card data and scan token in parallel (lazy — only first time)
    const fetchCard = memberCard
      ? Promise.resolve(memberCard)
      : (customer && customerAccessToken
          ? fetchMemberCard(customer.id, customerAccessToken).then((card) => {
              setMemberCard(card);
              return card;
            })
          : Promise.resolve(null));

    await Promise.all([fetchCard, loadScanToken()]);
  }, [memberCard, customer, customerAccessToken, startPolling, loadScanToken]);

  const handleCloseMemberCard = useCallback(() => {
    setShowMemberCode(false);
  }, []);

  const handleRefreshToken = useCallback(async () => {
    setScanToken(null);
    setScanTokenExpiresAt(null);
    await loadScanToken();
  }, [loadScanToken]);

  const handleDismissSuccess = useCallback(() => {
    setShowSuccess(false);
    setEarnResult(null);
  }, []);

  if (!customer) return null;

  return (
    <>
      <Section
        title="My Points"
        subtitle="Current balance plus tier progress."
        headerRight={<ScanButtonV1 onPress={handleOpenMemberCard} />}
      >
        <Text style={styles.pointsValue}>{customerBalance}</Text>
        <Text style={styles.metricRow}>Tier: {customer.tier}</Text>
        <Text style={styles.metricRow}>Lifetime earned: {customerLifetimeEarned}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
        </View>
        <Text style={styles.helper}>
          Redeem is coming soon. The app is already structured to support it later.
        </Text>
      </Section>

      <MemberCodeModal
        visible={showMemberCode}
        onClose={handleCloseMemberCard}
        memberCard={memberCard}
        scanToken={scanToken}
        scanTokenExpiresAt={scanTokenExpiresAt}
        onRefreshToken={handleRefreshToken}
      />

      {/* ── Earn success full-screen modal ── */}
      <Modal
        visible={showSuccess}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleDismissSuccess}
      >
        <View style={styles.successModal}>
          {earnResult ? (
            <EarnSuccessScreen earnResult={earnResult} onBack={handleDismissSuccess} />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pointsValue: {
    fontSize: 56,
    fontWeight: '900',
    color: theme.colors.brand,
  },
  metricRow: {
    color: theme.colors.textBody,
    fontSize: 15,
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.progressTrack,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.full,
  },
  helper: {
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  successModal: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
});
