import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useTokens, withAlpha } from '../theme/tokens';

/**
 * A themed bottom-sheet action menu, used in place of the native
 * Alert.alert for long-press context menus. Alert.alert has two
 * problems for this use case: it only reliably supports up to 3
 * buttons on Android (a 4th silently gets dropped), and it always
 * renders as a plain white system dialog regardless of the app's
 * dark/light theme.
 *
 * `actions` is an array of { icon, label, onPress, destructive }.
 */
export default function ActionSheet({ visible, onClose, title, actions = [] }) {
  const { colors } = useTheme();
  const tokens = useTokens();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 16, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheetWrap, { paddingBottom: insets.bottom + 16 }]}>
          <Animated.View style={sheetStyle}>
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.sheet, { borderRadius: tokens.radius.sheet, borderColor: tokens.hairline }]}
            >
              <BlurView intensity={tokens.glass.blurIntensity} tint={tokens.glass.blurTint} style={StyleSheet.absoluteFillObject} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: tokens.glass.sheet.backgroundColor }]} />

              {title ? (
                <Text style={[styles.title, { color: colors.textSecondary, borderBottomColor: tokens.hairline }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}

              {actions.map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    action.onPress && action.onPress();
                  }}
                  style={[
                    styles.row,
                    idx < actions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tokens.hairline },
                  ]}
                >
                  {action.icon ? (
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={action.destructive ? colors.danger : colors.text}
                      style={{ marginRight: 14 }}
                    />
                  ) : null}
                  <Text style={{ color: action.destructive ? colors.danger : colors.text, fontSize: 16, fontWeight: '600' }}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelBtn, { borderRadius: tokens.radius.sheet, borderColor: tokens.hairline, overflow: 'hidden' }]}
            >
              <BlurView intensity={tokens.glass.blurIntensity} tint={tokens.glass.blurTint} style={StyleSheet.absoluteFillObject} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: withAlpha(colors.text, 0.03) }]} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{'\u2715'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheetWrap: { paddingHorizontal: 16 },
  sheet: { borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  title: { fontSize: 13, fontWeight: '700', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  cancelBtn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
});
