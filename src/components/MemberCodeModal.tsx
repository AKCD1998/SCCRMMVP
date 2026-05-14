import QRCodeLib from 'qrcode';
import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

// TODO: Replace with real member code fetched from backend.
// Suggested endpoint: GET /api/sccrm/customers/:id/member-code
// Or derive from customer.id returned at login and stored in CustomerSessionContext.
// Backend service: https://dashboard.render.com/web/srv-d58idfm3jp1c73bhgv40
// Database:        https://dashboard.render.com/d/dpg-d5c8t695pdvs73c4qffg-a
export const MOCK_MEMBER_CODE = 'SCM-POINT-v1-A1B2C3D4';

// Pure-View QR code: uses `qrcode` (pure JS, no native modules) to get the
// module matrix, then renders each dark/light cell as a tiny View.
function QRCodeView({ value, cellSize = 5 }: { value: string; cellSize?: number }) {
  const matrix = useMemo<boolean[][]>(() => {
    try {
      const qr = QRCodeLib.create(value, { errorCorrectionLevel: 'M' });
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
  }, [value]);

  if (matrix.length === 0) return <View style={{ width: cellSize * 33, height: cellSize * 33 }} />;

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
                backgroundColor: dark ? theme.colors.textHeading : '#FFFFFF',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// Deterministic stripe pattern from any string — purely visual, not encoded.
// TODO: When connecting to backend, swap for a real Code128 barcode renderer
//       once the real memberCode is available from the backend.
function MockBarcode({ value, width = 272, height = 72 }: { value: string; width?: number; height?: number }) {
  type Stripe = { flex: number; dark: boolean };
  const stripes: Stripe[] = [];

  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    stripes.push({ flex: 2 + (c % 5), dark: true });
    stripes.push({ flex: 1 + ((c >> 2) % 4), dark: false });
  }

  return (
    <View style={{ width, height, flexDirection: 'row', overflow: 'hidden' }}>
      {stripes.map((s, i) => (
        <View
          key={i}
          style={{ flex: s.flex, height, backgroundColor: s.dark ? theme.colors.textHeading : '#FFFFFF' }}
        />
      ))}
    </View>
  );
}

interface MemberCodeModalProps {
  visible: boolean;
  onClose: () => void;
  // TODO: When backend is ready, pass the real member code from CustomerSessionContext
  //       e.g. memberCode={customer?.memberCode ?? MOCK_MEMBER_CODE}
  memberCode?: string;
}

export function MemberCodeModal({ visible, onClose, memberCode = MOCK_MEMBER_CODE }: MemberCodeModalProps) {
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>Member Code</Text>
            <Text style={styles.subtitle}>Show this to staff to scan</Text>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>BARCODE</Text>
              <View style={styles.barcodeArea}>
                <MockBarcode value={memberCode} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>QR CODE</Text>
              <View style={styles.qrArea}>
                <QRCodeView value={memberCode} cellSize={5} />
              </View>
            </View>

            <View style={styles.codeTextContainer}>
              <Text style={styles.codeLabel}>MEMBER CODE</Text>
              <Text style={styles.codeText} selectable>{memberCode}</Text>
              <Text style={styles.codeHint}>Staff can type this manually if scanning fails</Text>
            </View>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

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
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textHeading,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  qrArea: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  codeTextContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.textMuted,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.brand,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  codeHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  closeButton: {
    marginHorizontal: theme.spacing.md,
    marginTop: 8,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
