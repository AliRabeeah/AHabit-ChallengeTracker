import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
} from '../utils/biometricAuth';

import CollaboratorAvatars from '../components/notes/CollaboratorAvatars';
import NoteBlockRenderer from '../components/notes/NoteBlockRenderer';
import ActionSheet from '../components/ActionSheet';

const AUTOSAVE_DELAY_MS = 500;

export default function AddEditNoteScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    toggleNoteLock,
    toggleNoteFavorite,
    verifyPIN,
    setPIN,
    pinSet,
    biometricsEnabled,
    addChecklistItem,
    removeChecklistItem,
    toggleChecklistItem,
    updateChecklistItemText,
  } = useNotes();
  const insets = useSafeAreaInsets();

  const routeNoteId = route.params?.noteId;
  const existing = useMemo(() => notes.find((n) => n.id === routeNoteId), [notes, routeNoteId]);

  // A brand-new note is created as a draft immediately (matching iOS
  // Notes — there's no explicit "New Note" form, tapping compose just
  // opens a blank note that autosaves as you type). If it's abandoned
  // empty, it's cleaned up on the way out.
  const [draftId, setDraftId] = useState(routeNoteId || null);
  const note = useMemo(() => notes.find((n) => n.id === draftId), [notes, draftId]);

  const [title, setTitle] = useState(existing?.title || '');
  const [blocks, setBlocks] = useState(
    existing?.blocks && existing.blocks.length
      ? existing.blocks
      : [{ type: 'paragraph', text: existing?.content || '' }]
  );
  const [bodyEditing, setBodyEditing] = useState(false);
  const [bodyDraft, setBodyDraft] = useState('');

  const [moreVisible, setMoreVisible] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMode, setPinMode] = useState('set');
  const [biometricsModalVisible, setBiometricsModalVisible] = useState(false);

  const saveTimer = useRef(null);
  const hasCreatedDraft = useRef(!!routeNoteId);
  const skipNextAutosave = useRef(!!existing);

  // Create the draft note on first mount if this is a brand-new note.
  useEffect(() => {
    if (!hasCreatedDraft.current) {
      hasCreatedDraft.current = true;
      (async () => {
        const created = await addNote({
          title: '',
          content: '',
          blocks: [{ type: 'paragraph', text: '' }],
        });
        setDraftId(created.id);
      })();
    }
  }, []);

  useEffect(() => {
    (async () => setBiometricsAvailable(await isBiometricAvailable()))();
  }, []);

  // Debounced autosave whenever title or blocks change.
  useEffect(() => {
    if (!draftId) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const plainText = blocks
        .filter((b) => b.type === 'paragraph' || b.type === 'heading')
        .map((b) => b.text)
        .join('\n');
      updateNote(draftId, { title, blocks, content: plainText });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
  }, [title, blocks, draftId]);

  // Clean up an abandoned, still-empty draft note when leaving the screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (!draftId) return;
      const isEmpty =
        !title.trim() &&
        blocks.every((b) => !(b.text || '').trim()) &&
        !(note?.checklistItems || []).length;
      if (isEmpty && !existing) {
        deleteNote(draftId);
      }
    });
    return unsubscribe;
  }, [navigation, draftId, title, blocks, note, existing]);

  const beginBodyEdit = () => {
    const merged = blocks
      .filter((b) => b.type === 'paragraph' || b.type === 'heading')
      .map((b) => b.text)
      .join('\n\n');
    setBodyDraft(merged);
    setBodyEditing(true);
  };

  const commitBodyEdit = () => {
    const nonText = blocks.filter((b) => b.type !== 'paragraph' && b.type !== 'heading');
    setBlocks([{ type: 'paragraph', text: bodyDraft }, ...nonText]);
    setBodyEditing(false);
  };

  const handleAddChecklistGroup = () => {
    const groupId = `group-${Date.now()}`;
    setBlocks((prev) => [...prev, { type: 'checklist', groupId }]);
  };

  const handleAttach = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      if (file.mimeType?.startsWith('image/')) {
        setBlocks((prev) => [...prev, { type: 'image', uri: file.uri }]);
      } else {
        setBlocks((prev) => [
          ...prev,
          { type: 'document', title: file.name, snippetBody: 'Tap to open' },
        ]);
      }
    } catch (err) {
      Alert.alert('Attach failed', 'Could not attach that file.');
    }
  };

  const handleMarkup = () => {
    Alert.alert(
      'Markup not wired up yet',
      'Freehand drawing needs a canvas library (e.g. react-native-skia) that isn\u2019t installed in this project yet.'
    );
  };

  const handleRecordAudio = () => {
    Alert.alert(
      'Audio recording not wired up yet',
      'Voice memos need expo-av installed and wired to the recorder API \u2014 this project only has the visual playback card built.'
    );
  };

  const handleShare = async () => {
    const plainText = blocks
      .filter((b) => b.type === 'paragraph' || b.type === 'heading')
      .map((b) => b.text)
      .join('\n');
    try {
      await Share.share({ message: `${title || 'Note'}\n\n${plainText}` });
    } catch (err) {
      // user cancelled or share sheet failed silently
    }
  };

  const handleMoveToFolder = () => {
    Alert.alert('Move Note', 'Folder organization isn\u2019t wired up in this build yet.');
  };

  const handleToggleLock = async () => {
    if (!note || !draftId) return;
    if (!note.isLocked) {
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
      } else {
        toggleNoteLock(draftId);
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
    toggleNoteLock(draftId);
  };

  const handleVerifyPIN = async () => {
    const isValid = await verifyPIN(pinInput);
    if (isValid) {
      setPinInput('');
      setPinModalVisible(false);
      toggleNoteLock(draftId);
    } else {
      Alert.alert('Error', 'Incorrect PIN');
      setPinInput('');
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setBiometricsModalVisible(false);
      toggleNoteLock(draftId);
    } else {
      Alert.alert('Authentication Failed', 'Please try again or use PIN');
    }
  };

  const handleDelete = () => {
    if (!draftId) return;
    Alert.alert('Delete Note', `Delete "${title || 'New Note'}"?`, [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      {
        text: t('delete') || 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(draftId);
          navigation.goBack();
        },
      },
    ]);
  };

  const moreActions = [
    {
      icon: note?.isFavorite ? 'pin' : 'pin-outline',
      label: note?.isFavorite ? 'Unpin Note' : 'Pin Note',
      onPress: () => draftId && toggleNoteFavorite(draftId),
    },
    {
      icon: note?.isLocked ? 'lock-open-outline' : 'lock-closed-outline',
      label: note?.isLocked ? 'Unlock Note' : 'Lock Note',
      onPress: handleToggleLock,
    },
    { icon: 'folder-outline', label: 'Move Note', onPress: handleMoveToFolder },
    { icon: 'trash-outline', label: t('delete') || 'Delete Note', onPress: handleDelete, destructive: true },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <CollaboratorAvatars collaborators={note?.collaborators || []} />
          <TouchableOpacity onPress={handleMoveToFolder} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="arrow-undo-outline" size={21} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="share-outline" size={21} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMoreVisible(true)} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.textSecondary}
          style={[styles.titleInput, { color: colors.text }]}
          multiline
        />

        {note?.isLocked ? (
          <View style={styles.lockedState}>
            <Ionicons name="lock-closed" size={32} color={colors.textSecondary} />
            <Text style={[styles.lockedText, { color: colors.textSecondary }]}>This note is locked</Text>
          </View>
        ) : bodyEditing ? (
          <TextInput
            value={bodyDraft}
            onChangeText={setBodyDraft}
            onBlur={commitBodyEdit}
            autoFocus
            multiline
            style={[styles.bodyInput, { color: colors.text }]}
          />
        ) : (
          <TouchableOpacity activeOpacity={1} onPress={beginBodyEdit}>
            <NoteBlockRenderer
              blocks={blocks}
              checklistItems={note?.checklistItems || []}
              editable
              onToggleItem={(itemId) => draftId && toggleChecklistItem(draftId, itemId)}
              onChangeItemText={(itemId, text) => draftId && updateChecklistItemText(draftId, itemId, text)}
              onRemoveItem={(itemId) => draftId && removeChecklistItem(draftId, itemId)}
              onAddItem={(groupId, text) => draftId && addChecklistItem(draftId, text, groupId)}
              onOpenDocument={(block) =>
                Alert.alert(block.title || 'Document', 'Opening embedded documents isn\u2019t wired up in this build yet.')
              }
              onOpenLink={(block) =>
                Alert.alert(block.label || 'Link', 'Linking notes together isn\u2019t wired up in this build yet.')
              }
            />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom formatting toolbar */}
      <View style={[styles.toolbar, { borderTopColor: colors.border, paddingBottom: insets.bottom || 10 }]}>
        <TouchableOpacity onPress={handleAddChecklistGroup} style={styles.toolbarBtn} hitSlop={8}>
          <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAttach} style={styles.toolbarBtn} hitSlop={8}>
          <Ionicons name="attach-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMarkup} style={styles.toolbarBtn} hitSlop={8}>
          <Ionicons name="brush-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRecordAudio} style={styles.toolbarBtn} hitSlop={8}>
          <Ionicons name="mic-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => navigation.push ? navigation.push('AddEditNote') : navigation.navigate('AddEditNote')}
          style={styles.toolbarBtn}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ActionSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        title={title || 'Note'}
        actions={moreActions}
      />

      {/* PIN Modal */}
      <Modal visible={pinModalVisible} animationType="slide" transparent onRequestClose={() => setPinModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setPinModalVisible(false)} style={styles.modalCloseBtn}>
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
              style={[styles.pinInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
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
      <Modal visible={biometricsModalVisible} animationType="slide" transparent onRequestClose={() => setBiometricsModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setBiometricsModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Authenticate</Text>
            <View style={styles.biometricPrompt}>
              <Ionicons name="finger-print" size={64} color={colors.primary} />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                Use your fingerprint or face to authenticate
              </Text>
            </View>
            <TouchableOpacity onPress={handleBiometricAuth} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>Authenticate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerBtn: { padding: 4, marginLeft: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },
  titleInput: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    padding: 0,
  },
  bodyInput: {
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  lockedState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  lockedText: {
    marginTop: 12,
    fontSize: 14,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 22,
  },
  toolbarBtn: { padding: 2 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  pinInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center', marginBottom: 16 },
  biometricPrompt: { alignItems: 'center', marginVertical: 24 },
  biometricText: { fontSize: 14, marginTop: 12, textAlign: 'center' },
  modalBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  modalBtnText: { fontWeight: '600', fontSize: 14 },
});
