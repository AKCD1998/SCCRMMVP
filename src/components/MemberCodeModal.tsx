import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Rect } from 'react-native-svg';
import { theme } from '../constants/theme';

// TODO: Replace with real member code fetched from backend.
// Suggested endpoint: GET /api/sccrm/customers/:id/member-code
// Or derive from customer.id returned at login and stored in CustomerSessionContext.
// Backend service: https://dashboard.render.com/web/srv-d58idfm3jp1c73bhgv40
// Database:        https://dashboard.render.com/d/dpg-d5c8t695pdvs73c4qffg-a
export const MOCK_MEMBER_CODE = 'SCM-POINT-v1-A1B2C3D4';

// Generates a deterministic stripe pattern from any string — purely visual, not encoded.
// TODO: When connecting to backend, replace this with a real barcode (e.g. Code128) library
//       such as react-native-barcode-svg, passing the real memberCode value.
function MockBarcode({ value, width = 280, height = 72 }: { value: string; width?: number; height?: number }) {
  type Bar = { x: number; w: number; isBar: boolean };
  const bars: Bar[] = [];
  let cursor = 0;

  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    const barW = 2 + (c % 5);
    const gapW = 1 + ((c >> 2) % 4);
    bars.push({ x: cursor, w: barW, isBar: true });
    cursor += barW;
    bars.push({ x: cursor, w: gapW, isBar: false });
    cursor += gapW;
  }

  // Add quiet zone markers at start and end
  const scale = (width - 8) / cursor;
  const offsetX = 4;

  return (
    <Svg width={width} height={height}>
      {bars
        .filter(b => b.isBar)
        .map((bar, i) => (
          <Rect
            key={i}
            x={offsetX + bar.x * scale}
            y={0}
            width={Math.max(1, bar.w * scale)}
            height={height}
            fill={theme.colors.textHeading}
          />
        ))}
    </Svg>
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

            <View style={styles.barcodeCard}>
              <Text style={styles.sectionLabel}>BARCODE</Text>
              <View style={styles.barcodeArea}>
                <MockBarcode value={memberCode} width={272} height={72} />
              </View>
            </View>

            <View style={styles.qrCard}>
              <Text style={styles.sectionLabel}>QR CODE</Text>
              <View style={styles.qrArea}>
                {/* react-native-qrcode-svg generates a real scannable QR matrix */}
                <QRCode
                  value={memberCode}
                  size={180}
                  color={theme.colors.textHeading}
                  backgroundColor={theme.colors.cardBackground}
                />
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
  barcodeCard: {
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
  },
  qrCard: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  qrArea: {
    padding: 12,
    backgroundColor: theme.colors.cardBackground,
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
