import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../constants/theme';
import { useCustomerSession } from '../context/CustomerSessionContext';

const DRAWER_WIDTH = 280;

interface CustomerDrawerProps {
  visible: boolean;
  onClose: () => void;
}

type NavView = 'points' | 'history' | 'profile';

const NAV_ITEMS: { label: string; view: NavView }[] = [
  { label: 'My Points', view: 'points' },
  { label: 'History',   view: 'history' },
  { label: 'Profile',   view: 'profile' },
];

export function CustomerDrawer({ visible, onClose }: CustomerDrawerProps) {
  const { customer, customerView, setCustomerView, logoutCustomer } = useCustomerSession();

  // Mount state is separate from visible so we can animate out before unmounting
  const [isMounted, setIsMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const hasOpened = useRef(false);

  useEffect(() => {
    if (visible) {
      hasOpened.current = true;
      setIsMounted(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else if (hasOpened.current) {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleNav(view: NavView) {
    setCustomerView(view);
    onClose();
  }

  function confirmLogout() {
    Alert.alert(
      'ออกจากระบบ',
      'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: () => {
            onClose();
            void logoutCustomer();
          },
        },
      ],
      { cancelable: true }
    );
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop — tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sliding panel */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>

          {/* ── Header ── */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerBrand}>SCCRM</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* ── User info ── */}
          {customer ? (
            <View style={styles.userBlock}>
              <Text style={styles.userName} numberOfLines={1}>
                {customer.full_name || customer.email || customer.phone}
              </Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{customer.tier}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sectionDivider} />

          {/* ── Navigation ── */}
          <View style={styles.navList}>
            {NAV_ITEMS.map((item) => {
              const active = customerView === item.view;
              return (
                <Pressable
                  key={item.view}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handleNav(item.view)}
                >
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {active ? <View style={styles.activeBar} /> : null}
                </Pressable>
              );
            })}
          </View>

          {/* ── Spacer pushes logout to the bottom ── */}
          <View style={styles.spacer} />

          {/* ── Logout ── */}
          <View style={styles.logoutSection}>
            <View style={styles.logoutDivider} />
            <Pressable style={styles.logoutButton} onPress={confirmLogout}>
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: theme.colors.cardBackground,
    paddingTop: 48,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },

  // Header
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  drawerBrand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: theme.colors.brand,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },

  // User info
  userBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textHeading,
  },
  tierBadge: {
    backgroundColor: theme.colors.brandYellow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandYellowText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Dividers
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
    marginBottom: 8,
  },

  // Nav items
  navList: {
    paddingTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  navItemActive: {
    backgroundColor: theme.colors.secondaryBg,
  },
  navLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textBody,
  },
  navLabelActive: {
    color: theme.colors.brand,
    fontWeight: '700',
  },
  activeBar: {
    width: 4,
    height: 18,
    backgroundColor: theme.colors.brand,
    borderRadius: 2,
  },

  // Spacer
  spacer: {
    flex: 1,
  },

  // Logout
  logoutSection: {
    paddingBottom: 36,
  },
  logoutDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  logoutButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.logoutBg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.logoutText,
  },
});
