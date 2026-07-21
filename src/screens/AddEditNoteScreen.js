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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
} from '../utils/biometricAuth';

const FORMATTING_OPTIONS = [
  { icon: 'list', label: 'Bullet', action: 'bullet' },
  { icon: 'checkmark-done', label: 'Checklist', action: 'checklist' },
  { icon: 'link', label: 'Link', action: 'link' },
];

export default function AddEditNoteScreen({ route, navigation }) {
  const { colors } = useTheme();
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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState('set'); // 'set' or 'verify'
  const [biometricsModalVisible, setBiometricsModalVisible] = useState(false);

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
      Alert.alert('Error', 'Please enter a note title');
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
      // Enabling lock - need to set PIN or use biometrics
      if (!pinSet && !biometricsEnabled) {
        // First time locking - prompt to set PIN
        setPinMode('set');
        setPinModalVisible(true);
      } else if (biometricsEnabled && biometricsAvailable) {
        // Use biometrics
        setBiometricsModalVisible(true);
      } else {
        // Use PIN
        setPinMode('verify');
        setPinModalVisible(true);
      }
    } else {
      // Disabling lock - verify authentication
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
      Alert.alert('Error', 'PIN must be at least 4 digits');
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
      Alert.alert('Error', 'Incorrect PIN');
      setPinInput('');
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setBiometricsModalVisible(false);
      setIsLocked(!isLocked);
    } else {
      Alert.alert('Authentication Failed', 'Please try again or use PIN');
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={[styles.scrollView, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {existing ? 'Edit Note' : 'New Note'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Ionicons name="checkmark" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note Title"
          placeholderTextColor={colors.textSecondary}
          style={[styles.titleInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        />

        {/* Lock Toggle */}
        <View style={styles.lockToggleContainer}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              SECURITY
            </Text>
            <Text style={[styles.lockStatus, { color: colors.text }]}>
              {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
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
              size={20}
              color={colors.onPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Content Input */}
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
          CONTENT
        </Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write your note here..."
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[
            styles.contentInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        {/* Formatting Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {FORMATTING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.action}
              style={styles.toolbarBtn}
              onPress={() => {
                if (option.action === 'checklist') {
                  // Focus on checklist input
                }
              }}
            >
              <Ionicons name={option.icon} size={20} color={colors.primary} />
              <Text style={[styles.toolbarLabel, { color: colors.textSecondary }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Checklist Section */}
        {checklistItems.length > 0 && (
          <View style={styles.checklistSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              CHECKLIST
            </Text>
            {checklistItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.checklistItem,
                  { backgroundColor: colors.surface, borderColor: colors.border },
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
            placeholder="Add checklist item..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.checklistInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {pinMode === 'set' ? 'Set PIN' : 'Enter PIN'}
            </Text>

            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Enter 4+ digit PIN"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              secureTextEntry
              style={[
                styles.pinInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
              ]}
            />

            <TouchableOpacity
              onPress={pinMode === 'set' ? handleSetPIN : handleVerifyPIN}
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>
                {pinMode === 'set' ? 'Set PIN' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              onPress={() => setBiometricsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Authenticate
            </Text>

            <div style={styles.biometricPrompt}>
              <Ionicons name="finger-print" size={64} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                Use your fingerprint or face to authenticate
              </Text>
            </div>

            <TouchableOpacity
              onPress={handleBiometricAuth}
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>
                Authenticate
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  saveBtn: { padding: 4 },
  titleInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  lockToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lockStatus: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  lockToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  toolbar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  toolbarBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toolbarLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  checklistSection: { marginBottom: 16 },
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  pinInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  biometricPrompt: {
    alignItems: 'center',
    marginVertical: 24,
  },
  biometricText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalBtnText: { fontWeight: '600', fontSize: 14 },
});
