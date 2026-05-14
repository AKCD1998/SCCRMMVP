import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../constants/theme';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
}

export function ActionButton({ label, onPress, disabled, variant = 'primary' }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'accent' && styles.buttonAccent,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'ghost' && styles.buttonTextGhost,
          variant === 'accent' && styles.buttonTextAccent,
          variant === 'danger' && styles.buttonTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: theme.colors.secondaryBg,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.ghostBorder,
  },
  buttonAccent: {
    backgroundColor: theme.colors.accentYellowBg,
    borderRadius: 14,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: theme.colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextSecondary: {
    color: theme.colors.secondaryText,
  },
  buttonTextGhost: {
    color: theme.colors.ghostText,
  },
  buttonTextAccent: {
    color: theme.colors.accentYellowText,
    fontWeight: '600',
  },
  buttonTextDanger: {
    color: theme.colors.error,
  },
});
