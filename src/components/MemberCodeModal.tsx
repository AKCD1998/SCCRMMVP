/**
 * MemberCodeModal — digital membership card bottom sheet.
 *
 * Architecture: pure presentation component.
 * - Receives a MemberCardViewModel from memberService (via CustomerPointsScreen).
 * - Contains no business logic, no API calls, no context reads.
 *
 * Future-ready hooks (props to add when backend features land):
 *   isRefreshing?: boolean        — show spinner while QR rotates
 *   onRefresh?: () => void        — trigger a new QR token fetch
 *   expiresAt?: Date              — show countdown / expiry warning
 *   isOfflineCached?: boolean     — show stale-data badge
 *   onScannerMode?: () => void    — flip to staff-facing scan view
 */

import QRCodeLib from 'qrcode';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../constants/theme';
import type { MemberCardViewModel } from '../types/memberTypes';

// ─── CODE128B encoder ──────────────────────────────────────────────────────────
// Encodes any ASCII 32-126 string to a CODE128 subset-B bar pattern.
// Returns an array of strips: { units: number; dark: boolean }
// which are rendered as proportional View children in a flex row.

// Full CODE128 pattern table (indices 0-106).
// Each entry: [bar,space,bar,space,bar,space] widths (6 values, each 1-4).
// Index 106 (STOP) has 7 values: trailing terminator bar included.
const C128: number[][] = [
  [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2], // 0-4
  [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3], // 5-9
  [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1], // 10-14
  [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2], // 15-19
  [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2], // 20-24
  [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1], // 25-29
  [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3], // 30-34
  [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3], // 35-39
  [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1], // 40-44
  [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1], // 45-49
  [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3], // 50-54
  [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1], // 55-59
  [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2], // 60-64
  [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4], // 65-69
  [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1], // 70-74
  [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1], // 75-79
  [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2], // 80-84
  [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1], // 85-89
  [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1], // 90-94
  [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1], // 95-99
  [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],                               // 100-102
  [2,1,1,4,1,2],[2,1,1,2,1,4],[2,1,1,2,3,2],                               // 103=StartA, 104=StartB, 105=StartC
  [2,3,3,1,1,1,2],                                                          // 106=Stop (7 elements)
];

const START_B = 104;
const STOP    = 106;

type Strip = { units: number; dark: boolean };

function encodeCode128B(text: string): Strip[] {
  const codeValues: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    // CODE128B covers ASCII 32-126 only; skip anything outside
    if (cp < 32 || cp > 126) continue;
    const val = cp - 32;
    codeValues.push(val);
    checksum += val * (i + 1);
  }
  codeValues.push(checksum % 103); // checksum symbol
  codeValues.push(STOP);

  const strips: Strip[] = [];
  // 10-unit quiet zone (white) on each side
  strips.push({ units: 10, dark: false });
  for (const cv of codeValues) {
    const pattern = C128[cv];
    if (!pattern) continue;
    pattern.forEach((units, idx) => {
      strips.push({ units, dark: idx % 2 === 0 }); // even index = bar (dark)
    });
  }
  strips.push({ units: 10, dark: false });
  return strips;
}

// ─── Code128Barcode component ──────────────────────────────────────────────────

function Code128Barcode({ payload, height = 72 }: { payload: string; height?: number }) {
  const strips = useMemo(() => encodeCode128B(payload), [payload]);
  const totalUnits = strips.reduce((s, b) => s + b.units, 0);

  return (
    <View style={{ width: '100%', height, backgroundColor: '#FFFFFF' }}>
      {/* flex row: each strip's flex = its unit width, proportional to totalUnits */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {strips.map((strip, i) => (
          <View
            key={i}
            style={{
              flex: strip.units / totalUnits,
              height: '100%',
              backgroundColor: strip.dark ? '#000000' : '#FFFFFF',
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─── QRCodeView component ──────────────────────────────────────────────────────
// Uses qrcode (pure JS) to build the module matrix, renders each cell as a View.
// Receives the full structured QR payload string (JSON), not just memberCode.

function QRCodeView({ payload, cellSize = 5 }: { payload: string; cellSize?: number }) {
  const matrix = useMemo<boolean[][]>(() => {
    try {
      const qr = QRCodeLib.create(payload, { errorCorrectionLevel: 'M' });
      const { data, size } = qr.modules;
      const rows: boolean[][] = [];
      for (let r = 0; r < size; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < size; c++) {
          row.push(Boolean(data[r * size + c]));
        }
        rows.push(row);
      }
      return rows;
    } catch {
      return [];
    }
  }, [payload]);

  if (matrix.length === 0) {
    return <View style={{ width: cellSize * 33, height: cellSize * 33 }} />;
  }

  const dim = matrix.length * cellSize;
  return (
    <View style={{ width: dim, height: dim, backgroundColor: '#FFFFFF' }}>
      {matrix.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: dark ? '#000000' : '#FFFFFF',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ─── MemberCodeModal ───────────────────────────────────────────────────────────

const BARCODE_PREFIX = 'SCM-POINT-v1-';

interface MemberCodeModalProps {
  visible: boolean;
  onClose: () => void;
  memberCard: MemberCardViewModel | null;
  scanToken?: string | null;
  scanTokenExpiresAt?: Date | null;
  onRefreshToken?: () => void;
}

export function MemberCodeModal({
  visible,
  onClose,
  memberCard,
  scanToken,
  scanTokenExpiresAt,
  onRefreshToken,
}: MemberCodeModalProps) {
  const barcodePayload = scanToken ? `${BARCODE_PREFIX}${scanToken}` : null;

  const tokenExpired =
    scanTokenExpiresAt != null && scanTokenExpiresAt.getTime() < Date.now();
  const tokenMinutesLeft = scanTokenExpiresAt
    ? Math.max(0, Math.ceil((scanTokenExpiresAt.getTime() - Date.now()) / 60000))
    : null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>

          {/* ── Drag handle ─────────────────────────────────────────────── */}
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Header ──────────────────────────────────────────────── */}
            <Text style={styles.title}>Member Card</Text>
            {memberCard ? (
              <Text style={styles.subtitle}>
                {memberCard.tierLabel}
                {'  ·  '}
                {memberCard.pointsBalance.toLocaleString()} pts
              </Text>
            ) : (
              <Text style={styles.subtitle}>Loading…</Text>
            )}

            {/* ── Barcode card ─────────────────────────────────────────── */}
            <View style={styles.card}>
              <SectionLabel text="BARCODE  ·  CODE128  ·  สแกนสะสมแต้ม" />
              <View style={styles.barcodeArea}>
                {barcodePayload ? (
                  <Code128Barcode payload={barcodePayload} height={68} />
                ) : (
                  <View style={styles.placeholder} />
                )}
              </View>
              {tokenExpired ? (
                <Pressable style={styles.refreshHint} onPress={onRefreshToken}>
                  <Text style={styles.refreshHintText}>Token หมดอายุ — แตะเพื่อรีเฟรช</Text>
                </Pressable>
              ) : tokenMinutesLeft !== null && tokenMinutesLeft <= 3 ? (
                <Text style={styles.expiryHint}>หมดอายุใน {tokenMinutesLeft} นาที</Text>
              ) : null}
            </View>

            {/* ── QR card ──────────────────────────────────────────────── */}
            <View style={styles.card}>
              <SectionLabel text="QR CODE  ·  สแกนสะสมแต้ม" />
              <View style={styles.qrArea}>
                {barcodePayload ? (
                  <QRCodeView payload={barcodePayload} cellSize={5} />
                ) : memberCard ? (
                  <QRCodeView payload={memberCard.qrPayload} cellSize={5} />
                ) : (
                  <View style={[styles.placeholder, { height: 165, width: 165 }]} />
                )}
              </View>
            </View>

            {/* ── Member code text ─────────────────────────────────────── */}
            <View style={styles.codeBlock}>
              <Text style={styles.codeLabel}>MEMBER CODE</Text>
              <Text style={styles.codeText} selectable>
                {memberCard?.memberCode ?? '—'}
              </Text>
              <Text style={styles.codeHint}>
                Staff can type this manually if scanning fails
              </Text>
            </View>
          </ScrollView>

          {/* ── Close button ────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            onPress={onClose}
            accessibilityLabel="Close member card"
            accessibilityRole="button"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.pageBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginTop: 10,
    marginBottom: 4,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textHeading,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  barcodeArea: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  qrArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
  },
  placeholder: {
    height: 68,
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 6,
  },
  loadingBarcode: {
    opacity: 0.4,
  },
  refreshHint: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.sm,
    alignSelf: 'center',
  },
  refreshHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expiryHint: {
    marginTop: 6,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  codeBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.textMuted,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.brand,
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  codeHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  closeButton: {
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
