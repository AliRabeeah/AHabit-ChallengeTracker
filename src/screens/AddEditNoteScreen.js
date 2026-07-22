import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useTokens } from '../theme/tokens';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
} from '../utils/biometricAuth';

const FORMATTING_OPTIONS = [
  { icon: 'text', label: 'H1', action: 'heading1', active: false },
  { icon: 'text-outline', label: 'H2', action: 'heading2', active: false },
  { icon: 'bold', label: 'Bold', action: 'bold', active: false },
  { icon: 'remove-outline', label: 'Line', action: 'line', active: false },
  { icon: 'checkmark-done', label: 'Todo', action: 'checklist', active: false },
  { icon: 'list', label: 'List', action: 'bullet', active: false },
  { icon: 'attach', label: 'Attach', action: 'attach', active: false },
  { icon: 'undo', label: 'Undo', action: 'undo', active: false },
  { icon: 'redo', label: 'Redo', action: 'redo', active: false },
];

function withAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

export default function AddEditNoteScreen({ route, navigation }) {
  const { colors, mode } = useTheme();
  const tokens = useTokens();
  const { t } = useLanguage();
  const {
    notes,
    addNote,
    updateNote,
    toggleNoteLock,
    verifyPIN,
    setPIN,
    pinSet,
    biometricsEnabled,
    setBiometricsEnabled,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
  } = useNotes();
  const insets = useSafeAreaInsets();

  const noteId = route.params?.noteId;
  const setReminder = route.params?.setReminder;
  const existing = useMemo(
    () => notes.find((n) => n.id === noteId),
    [notes, noteId]
  );

  const isDark = mode === 'dark';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState('set');
  const [biometricsModalVisible, setBiometricsModalVisible] = useState(false);
  const [activeFormatting, setActiveFormatting] = useState(new Set(['bold']));

  // Initialize form with existing note data
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setIsLocked(existing.isLocked);
      setChecklistItems(existing.checklistItems || []);
    }
  }, [existing]);

  // Check biometric availability
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricsAvailable(available);
    })();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', t('enterNoteTitle'));
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      checklistItems,
    };

    if (existing) {
      await updateNote(noteId, noteData);
    } else {
      await addNote(noteData);
    }

    navigation.goBack();
  };

  const handleToggleLock = async () => {
    if (!isLocked) {
      if (!pinSet && !biometricsEnabled) {
        setPinMode('set');
        setPinModalVisible(true);
      } else if (biometricsEnabled && biometricsAvailable) {
        setBiometricsModalVisible(true);
      } else {
        setPinMode('verify');
        setPinModalVisible(true);
      }
    } else {
      if (biometricsEnabled && biometricsAvailable) {
        setBiometricsModalVisible(true);
      } else if (pinSet) {
        setPinMode('verify');
        setPinModalVisible(true);
      }
    }
  };

  const handleSetPIN = async () => {
    if (pinInput.length < 4) {
      Alert.alert(t('setPin'), t('pinError'));
      return;
    }
    await setPIN(pinInput);
    setPinInput('');
    setPinModalVisible(false);
    setIsLocked(!isLocked);
  };

  const handleVerifyPIN = async () => {
    const isValid = await verifyPIN(pinInput);
    if (isValid) {
      setPinInput('');
      setPinModalVisible(false);
      setIsLocked(!isLocked);
    } else {
      Alert.alert(t('enterPin'), t('pinIncorrect'));
      setPinInput('');
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setBiometricsModalVisible(false);
      setIsLocked(!isLocked);
    } else {
      Alert.alert(t('authFailed'), t('authRetry'));
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        isChecked: false,
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (itemId) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== itemId));
  };

  const handleToggleChecklistItem = (itemId) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const toggleFormat = (action) => {
    setActiveFormatting((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  const lastEditedText = existing
    ? `Last edited ${getTimeAgo(new Date(existing.lastEdited))}`
    : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        style={[styles.scrollView, { paddingTop: insets.top + 12, paddingHorizontal: 16 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {existing ? t('editNote') : t('newNote')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Last edited timestamp */}
        {lastEditedText && (
          <Text style={[styles.timestampLabel, { color: colors.textSecondary }]}>
            {lastEditedText}
          </Text>
        )}

        {/* Title Input */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('noteTitle')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.titleInput, { color: colors.text }]}
        />

        {/* Lock Toggle */}
        <View style={styles.lockToggleContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('security')}
            </Text>
            <Text style={[styles.lockStatus, { color: colors.text }]}>
              {isLocked ? t('locked') : t('unlocked')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleLock}
            style={[
              styles.lockToggleBtn,
              {
                backgroundColor: isLocked ? colors.danger : colors.primary,
              },
            ]}
          >
            <Ionicons
              name={isLocked ? 'lock-closed' : 'lock-open'}
              size={18}
              color={colors.onPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Content Input */}
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>
          {t('noteContent')}
        </Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={t('writeNote')}
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[
            styles.contentInput,
            {
              color: colors.text,
              borderColor: isDark ? withAlpha('#FFFFFF', 0.08) : withAlpha('#000000', 0.06),
              backgroundColor: isDark ? withAlpha('#FFFFFF', 0.04) : withAlpha('#FFFFFF', 0.6),
            },
          ]}
        />

        {/* Formatting Toolbar */}
        <BlurView tint={isDark ? 'dark' : 'light'} intensity={60} style={styles.toolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarContent}
          >
            {FORMATTING_OPTIONS.map((option) => {
              const isActive = activeFormatting.has(option.action);
              return (
                <TouchableOpacity
                  key={option.action}
                  style={[
                    styles.toolbarBtn,
                    isActive && { backgroundColor: withAlpha(colors.primary, 0.15) },
                  ]}
                  onPress={() => toggleFormat(option.action)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.toolbarLabel,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </BlurView>

        {/* Checklist Section */}
        {checklistItems.length > 0 && (
          <View style={styles.checklistSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('checklist')}
            </Text>
            {checklistItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.checklistItem,
                  {
                    backgroundColor: isDark ? withAlpha('#FFFFFF', 0.04) : withAlpha('#FFFFFF', 0.6),
                    borderColor: isDark ? withAlpha('#FFFFFF', 0.08) : withAlpha('#000000', 0.06),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleToggleChecklistItem(item.id)}
                  style={styles.checklistCheckbox}
                >
                  <Ionicons
                    name={item.isChecked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={item.isChecked ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.checklistText,
                    {
                      color: colors.text,
                      textDecorationLine: item.isChecked ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item.text}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveChecklistItem(item.id)}
                  style={styles.removeChecklistBtn}
                >
                  <Ionicons name="close" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add Checklist Item */}
        <View style={styles.addChecklistContainer}>
          <TextInput
            value={newChecklistItem}
            onChangeText={setNewChecklistItem}
            placeholder={t('addChecklistItem')}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.checklistInput,
              {
                color: colors.text,
                borderColor: isDark ? withAlpha('#FFFFFF', 0.08) : withAlpha('#000000', 0.06),
                backgroundColor: isDark ? withAlpha('#FFFFFF', 0.04) : withAlpha('#FFFFFF', 0.6),
              },
            ]}
          />
          <TouchableOpacity
            onPress={handleAddChecklistItem}
            style={[styles.addChecklistBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={80} style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {pinMode === 'set' ? t('setPin') : t('enterPin')}
            </Text>

            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder={t('enterPinHint')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              secureTextEntry
              style={[
                styles.pinInput,
                {
                  color: colors.text,
                  borderColor: isDark ? withAlpha('#FFFFFF', 0.1) : withAlpha('#000000', 0.1),
                  backgroundColor: isDark ? withAlpha('#FFFFFF', 0.06) : withAlpha('#FFFFFF', 0.8),
                },
              ]}
            />

            <TouchableOpacity
              onPress={pinMode === 'set' ? handleSetPIN : handleVerifyPIN}
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>
                {pinMode === 'set' ? t('setPin') : t('verify')}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      {/* Biometrics Modal */}
      <Modal
        visible={biometricsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBiometricsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={80} style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setBiometricsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('authenticate')}
            </Text>

            <View style={styles.biometricPrompt}>
              <Ionicons name="finger-print" size={64} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                {t('biometricPrompt')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleBiometricAuth}
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>
                {t('authenticate')}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { padding: 4 },
  timestampLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 14,
  },
  titleInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  lockToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lockStatus: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  lockToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  toolbar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    overflow: 'hidden',
    marginBottom: 14,
  },
  toolbarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  toolbarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toolbarLabel: { fontSize: 9, fontWeight: '600', marginTop: 3 },
  checklistSection: { marginBottom: 14 },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  checklistCheckbox: { padding: 4 },
  checklistText: { flex: 1, fontSize: 14 },
  removeChecklistBtn: { padding: 4 },
  addChecklistContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  checklistInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  addChecklistBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    overflow: 'hidden',
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  pinInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  biometricPrompt: {
    alignItems: 'center',
    marginVertical: 24,
  },
  biometricText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  modalBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalBtnText: { fontWeight: '700', fontSize: 15 },
});
