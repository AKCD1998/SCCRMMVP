import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../constants/theme';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
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
});
