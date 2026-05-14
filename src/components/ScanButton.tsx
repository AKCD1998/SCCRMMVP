import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

const C = theme.colors.brand;

// Absolute-position shorthand
const a = (x: number, y: number, w: number, h: number): ViewStyle => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
  height: h,
});

const buttonStyle: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.secondaryBg,
  alignItems: 'center',
  justifyContent: 'center',
};

// ─── V1: QR Pattern ───────────────────────────────────────────────────────────
// Three finder squares (top-left, top-right, bottom-left) + data dots + scan line

function QrIcon() {
  const dots: [number, number][] = [
    // bottom-right data area
    [13, 13], [16, 13], [19, 13],
    [13, 16], [15, 16], [18, 16], [20, 16],
    [13, 19], [17, 19], [20, 19],
    // gap area dots
    [11, 2], [11, 5],
    [2, 11], [5, 11],
  ];
  return (
    <View style={s.canvas}>
      {/* Finder TL */}
      <View style={[a(0, 0, 9, 9), s.finder]} />
      <View style={[a(3, 3, 3, 3), { position: 'absolute', backgroundColor: C }]} />
      {/* Finder TR */}
      <View style={[a(13, 0, 9, 9), s.finder]} />
      <View style={[a(16, 3, 3, 3), { position: 'absolute', backgroundColor: C }]} />
      {/* Finder BL */}
      <View style={[a(0, 13, 9, 9), s.finder]} />
      <View style={[a(3, 16, 3, 3), { position: 'absolute', backgroundColor: C }]} />
      {/* Data dots */}
      {dots.map(([x, y], i) => (
        <View key={i} style={[a(x, y, 2, 2), { position: 'absolute', backgroundColor: C }]} />
      ))}
      {/* Scan line */}
      <View style={[a(0, 10, 22, 1), { position: 'absolute', backgroundColor: C, opacity: 0.30 }]} />
    </View>
  );
}

export function ScanButtonV1({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={buttonStyle} onPress={onPress}
      accessibilityLabel="Scan QR code" accessibilityRole="button">
      <QrIcon />
    </Pressable>
  );
}

// ─── V2: Barcode + corners ─────────────────────────────────────────────────────
// 7 vertical bars of varying width inside four corner L-brackets

function BarcodeIcon() {
  // bars: [x, width]
  const bars: [number, number][] = [
    [4, 1.5], [6.5, 1], [8.5, 2], [11, 1], [13, 1.5], [15.5, 1], [17, 1.5],
  ];
  return (
    <View style={s.canvas}>
      {/* Corner TL */}
      <View style={[a(0, 0, 7, 2), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(0, 0, 2, 7), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner TR */}
      <View style={[a(15, 0, 7, 2), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(20, 0, 2, 7), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner BL */}
      <View style={[a(0, 20, 7, 2), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(0, 15, 2, 7), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner BR */}
      <View style={[a(15, 20, 7, 2), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(20, 15, 2, 7), { position: 'absolute', backgroundColor: C }]} />
      {/* Bars */}
      {bars.map(([x, w], i) => (
        <View key={i} style={[a(x, 4, w, 14), { position: 'absolute', backgroundColor: C }]} />
      ))}
    </View>
  );
}

export function ScanButtonV2({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={buttonStyle} onPress={onPress}
      accessibilityLabel="Scan barcode" accessibilityRole="button">
      <BarcodeIcon />
    </Pressable>
  );
}

// ─── V3: Camera lens ──────────────────────────────────────────────────────────
// Circle aperture + four corner L-brackets + animated-feel scan line

function CameraIcon() {
  return (
    <View style={s.canvas}>
      {/* Corner TL */}
      <View style={[a(0, 0, 8, 2.5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(0, 0, 2.5, 8), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner TR */}
      <View style={[a(13.5, 0, 8.5, 2.5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(19.5, 0, 2.5, 8), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner BL */}
      <View style={[a(0, 19.5, 8, 2.5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(0, 14, 2.5, 8), { position: 'absolute', backgroundColor: C }]} />
      {/* Corner BR */}
      <View style={[a(13.5, 19.5, 8.5, 2.5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(19.5, 14, 2.5, 8), { position: 'absolute', backgroundColor: C }]} />
      {/* Lens circle */}
      <View style={[a(4, 4, 14, 14), {
        position: 'absolute',
        borderRadius: 7,
        borderWidth: 2,
        borderColor: C,
        backgroundColor: 'transparent',
      }]} />
      {/* Centre dot */}
      <View style={[a(9.5, 9.5, 3, 3), { position: 'absolute', borderRadius: 1.5, backgroundColor: C, opacity: 0.5 }]} />
    </View>
  );
}

export function ScanButtonV3({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={buttonStyle} onPress={onPress}
      accessibilityLabel="Scan QR code" accessibilityRole="button">
      <CameraIcon />
    </Pressable>
  );
}

// ─── V4: Rounded wallet-app style (LINE Pay / PromptPay look) ─────────────────
// Thick selective-border corners with radius + 3×3 dot grid centre

function WalletIcon() {
  const gridDots: [number, number][] = [
    [7, 7], [10, 7], [13, 7],
    [7, 10], [10, 10], [13, 10],
    [7, 13], [10, 13], [13, 13],
  ];
  const cornerStyle = (top: number, left: number, borderTop: boolean, borderLeft: boolean): ViewStyle => ({
    position: 'absolute',
    top,
    left,
    width: 9,
    height: 9,
    borderTopWidth: borderTop ? 3 : 0,
    borderLeftWidth: borderLeft ? 3 : 0,
    borderRightWidth: !borderLeft ? 3 : 0,
    borderBottomWidth: !borderTop ? 3 : 0,
    borderColor: C,
    borderTopLeftRadius: borderTop && borderLeft ? 4 : 0,
    borderTopRightRadius: borderTop && !borderLeft ? 4 : 0,
    borderBottomLeftRadius: !borderTop && borderLeft ? 4 : 0,
    borderBottomRightRadius: !borderTop && !borderLeft ? 4 : 0,
    backgroundColor: 'transparent',
  });
  return (
    <View style={s.canvas}>
      <View style={cornerStyle(0, 0, true, true)} />
      <View style={cornerStyle(0, 13, true, false)} />
      <View style={cornerStyle(13, 0, false, true)} />
      <View style={cornerStyle(13, 13, false, false)} />
      {gridDots.map(([x, y], i) => (
        <View key={i} style={[a(x, y, 2, 2), { position: 'absolute', borderRadius: 0.5, backgroundColor: C }]} />
      ))}
    </View>
  );
}

export function ScanButtonV4({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={buttonStyle} onPress={onPress}
      accessibilityLabel="Scan QR code" accessibilityRole="button">
      <WalletIcon />
    </Pressable>
  );
}

// ─── V5: Enterprise / pharmacy grid ──────────────────────────────────────────
// Three finder squares (like V1) + fine 1px grid lines in the data zone for a
// technical / professional look

function EnterpriseIcon() {
  // Fine horizontal and vertical grid lines in the data zone (x:11–21, y:11–21)
  const hLines = [13, 15, 17, 19];
  const vLines = [13, 15, 17, 19];
  return (
    <View style={s.canvas}>
      {/* Finder TL */}
      <View style={[a(0, 0, 9, 9), s.finder]} />
      <View style={[a(2, 2, 5, 5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(3, 3, 3, 3), { position: 'absolute', backgroundColor: theme.colors.cardBackground }]} />
      {/* Finder TR */}
      <View style={[a(13, 0, 9, 9), s.finder]} />
      <View style={[a(15, 2, 5, 5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(16, 3, 3, 3), { position: 'absolute', backgroundColor: theme.colors.cardBackground }]} />
      {/* Finder BL */}
      <View style={[a(0, 13, 9, 9), s.finder]} />
      <View style={[a(2, 15, 5, 5), { position: 'absolute', backgroundColor: C }]} />
      <View style={[a(3, 16, 3, 3), { position: 'absolute', backgroundColor: theme.colors.cardBackground }]} />
      {/* Grid lines */}
      {hLines.map((y, i) => (
        <View key={`h${i}`} style={[a(11, y, 11, 1), { position: 'absolute', backgroundColor: C, opacity: 0.25 }]} />
      ))}
      {vLines.map((x, i) => (
        <View key={`v${i}`} style={[a(x, 11, 1, 11), { position: 'absolute', backgroundColor: C, opacity: 0.25 }]} />
      ))}
    </View>
  );
}

export function ScanButtonV5({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable style={buttonStyle} onPress={onPress}
      accessibilityLabel="Scan QR code" accessibilityRole="button">
      <EnterpriseIcon />
    </Pressable>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  canvas: {
    width: 22,
    height: 22,
    position: 'relative',
  },
  finder: {
    borderWidth: 2,
    borderColor: C,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
});
