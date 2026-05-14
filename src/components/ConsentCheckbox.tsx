import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../constants/theme';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: boolean;
}

type PolicyType = 'privacy' | 'terms';

export function ConsentCheckbox({ checked, onChange, error }: Props) {
  const { t } = useTranslation();
  const [modal, setModal] = useState<PolicyType | null>(null);

  const policyContent: Record<PolicyType, { title: string; body: string }> = {
    privacy: { title: t('consent.privacyTitle'), body: t('consent.privacyBody') },
    terms: { title: t('consent.termsTitle'), body: t('consent.termsBody') },
  };

  return (
    <>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(!checked)}
          style={[styles.box, checked && styles.boxChecked, error && !checked && styles.boxError]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          {checked && <Text style={styles.tick}>✓</Text>}
        </Pressable>

        <Text style={styles.label}>
          <Text>{t('consent.checkboxLabel')} </Text>
          <Text style={styles.link} onPress={() => setModal('privacy')}>
            {t('consent.privacyLink')}
          </Text>
          <Text> {t('consent.and')} </Text>
          <Text style={styles.link} onPress={() => setModal('terms')}>
            {t('consent.termsLink')}
          </Text>
        </Text>
      </View>

      {error && !checked && (
        <Text style={styles.errorText}>{t('consent.required')}</Text>
      )}

      <Modal
        visible={modal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModal(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {modal ? policyContent[modal].title : ''}
            </Text>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetBody}>
                {modal ? policyContent[modal].body : ''}
              </Text>
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setModal(null)}>
              <Text style={styles.closeBtnText}>{t('consent.modalClose')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  boxChecked: {
    backgroundColor: theme.colors.brand,
    borderColor: theme.colors.brand,
  },
  boxError: {
    borderColor: theme.colors.error,
  },
  tick: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textBody,
    lineHeight: 20,
  },
  link: {
    color: theme.colors.brand,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginLeft: 32,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '75%',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textHeading,
    marginBottom: 16,
  },
  sheetScroll: {
    marginBottom: 20,
  },
  sheetBody: {
    fontSize: 14,
    color: theme.colors.textBody,
    lineHeight: 24,
  },
  closeBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
