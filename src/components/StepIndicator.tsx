import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

interface Props {
  total: number;
  current: number; // 1-based
}

export function StepIndicator({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n, idx) => {
        const done   = current > n;
        const active = current === n;
        return (
          <React.Fragment key={n}>
            {idx > 0 && <View style={[styles.line, done && styles.lineBlue]} />}
            <View style={[styles.circle, (active || done) && styles.circleBlue]}>
              {done ? (
                <Text style={styles.symbol}>✓</Text>
              ) : (
                <Text style={[styles.symbol, !active && styles.symbolMuted]}>{n}</Text>
              )}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBlue: {
    backgroundColor: theme.colors.brand,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  lineBlue: {
    backgroundColor: theme.colors.brand,
  },
  symbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  symbolMuted: {
    color: theme.colors.textMuted,
  },
});
