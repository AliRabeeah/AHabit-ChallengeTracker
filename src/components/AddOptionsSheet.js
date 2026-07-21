import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Themed bottom sheet shown from any "+" button, offering to create a
 * Habit, a Recurring Task, or a (single) Task — each with an icon,
 * title, short description, and a chevron, matching the reference
 * design. Fully theme-aware: dark surface in dark mode, light surface
 * in light mode, like every other overlay in the app.
 */
export default function AddOptionsSheet({ visible, onClose, onSelectHabit, onSelectRecurringTask, onSelectTask }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const options = [
    {
      key: 'habit',
      icon: 'trophy-outline',
      title: t('addMenuHabitTitle'),
      desc: t('addMenuHabitDesc'),
      onPress: onSelectHabit,
    },
    {
      key: 'recurringTask',
      icon: 'repeat-outline',
      title: t('addMenuRecurringTitle'),
      desc: t('addMenuRecurringDesc'),
      onPress: onSelectRecurringTask,
    },
    {
      key: 'task',
      icon: 'checkmark-outline',
      title: t('addMenuTaskTitle'),
      desc: t('addMenuTaskDesc'),
      onPress: onSelectTask,
    },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheetWrap, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  onClose();
                  opt.onPress && opt.onPress();
                }}
                style={[
                  styles.row,
                  idx < options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}22` }]}>
                  <Ionicons name={opt.icon} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{opt.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheetWrap: { paddingHorizontal: 16 },
  sheet: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
