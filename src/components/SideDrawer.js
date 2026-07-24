import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

export default function SideDrawer({ visible, onClose, navigation }) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const dateLabel = new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const go = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const MENU_ITEMS = [
    { key: 'Today', icon: 'checkmark-circle-outline', label: t('today') },
    { key: 'Habits', icon: 'list-outline', label: t('habitsTitle') },
    { key: 'Tasks', icon: 'clipboard-outline', label: t('tasksTitle') },
    { key: 'Challenges', icon: 'target', label: 'Challenges' },
    { key: 'Notes', icon: 'document-text-outline', label: 'Notes' },
    { key: 'Timer', icon: 'timer-outline', label: t('timerTitle') },
    { key: 'Stats', icon: 'bar-chart-outline', label: t('statsTitle') },
    { key: 'Archive', icon: 'archive-outline', label: t('archivedHabitsTitle') },
    { key: 'Settings', icon: 'settings-outline', label: t('settingsTitle') },
    { key: 'About', icon: 'information-circle-outline', label: t('aboutApp') },
  ];

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.surface,
              transform: [{ translateX: slideAnim }],
              [language === 'ar' ? 'right' : 'left']: 0,
            },
          ]}
        >
          <View style={styles.header}>
            {/* TODO: once you have your logo file, replace this placeholder
                square with: <Image source={require('../../assets/logo.png')}
                style={{ width: 56, height: 56, borderRadius: 14 }} /> */}
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.onPrimary, fontSize: 24, fontWeight: '800' }}>∞</Text>
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>AHabit</Text>
            <Text style={[styles.byLine, { color: colors.textSecondary }]}>by Ali Halim</Text>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>{dateLabel}</Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>YOUR SPACE</Text>

          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.key} onPress={() => go(item.key)} style={styles.menuRow}>
              <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={{ color: colors.text, marginLeft: 16, fontSize: 15 }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, paddingTop: 60, paddingHorizontal: 20 },
  header: { alignItems: 'flex-start', marginBottom: 16 },
  logoPlaceholder: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appName: { fontSize: 20, fontWeight: '800' },
  byLine: { fontSize: 12, marginTop: 2 },
  dateLabel: { fontSize: 12, marginTop: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: 8, marginBottom: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderRadius: 14, paddingHorizontal: 8, marginHorizontal: -8 },
});
