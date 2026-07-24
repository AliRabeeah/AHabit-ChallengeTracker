import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';

import NotesHeader from '../components/notes/NotesHeader';
import NoteRow from '../components/notes/NoteRow';
import SwipeableNoteRow from '../components/notes/SwipeableNoteRow';
import NotesBottomBar from '../components/notes/NotesBottomBar';
import ActionSheet from '../components/ActionSheet';

// Buckets notes the way iOS Notes does: Today / Yesterday / Previous 7
// Days / Previous 30 Days, then by month (and month+year once it's not
// this year anymore).
function getSectionLabel(isoString, now = new Date()) {
  const date = new Date(isoString);
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  if (diffDays <= 30) return 'Previous 30 Days';

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], { month: 'long', year: sameYear ? undefined : 'numeric' });
}

const FIXED_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days'];

export default function NotesScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    notes,
    deleteNote,
    toggleNoteFavorite, // repurposed as "pinned" for this iOS-style layout
  } = useNotes();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [moreVisible, setMoreVisible] = useState(false);
  const [pinnedCollapsed, setPinnedCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState('edited');

  const handleAddNote = useCallback(() => {
    navigation.navigate('AddEditNote');
  }, [navigation]);

  const handleNotePress = useCallback(
    (note) => {
      navigation.navigate('AddEditNote', { noteId: note.id });
    },
    [navigation]
  );

  const handleDeleteNote = useCallback(
    (note) => {
      Alert.alert(
        t('deleteConfirmTitle') || 'Delete Note',
        `Delete "${note.title || 'New Note'}"?`,
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          { text: t('delete') || 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
        ]
      );
    },
    [deleteNote, t]
  );

  // Filter by search, split into Pinned + date-bucketed sections.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? notes.filter(
          (n) =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.content || '').toLowerCase().includes(q)
        )
      : notes;

    const orderNotes = (a, b) => {
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(b.lastEdited) - new Date(a.lastEdited);
    };

    const pinned = filtered.filter((n) => n.isFavorite).sort(orderNotes);
    const rest = filtered.filter((n) => !n.isFavorite).sort(orderNotes);

    const buckets = new Map();
    rest.forEach((note) => {
      const label = getSectionLabel(note.lastEdited);
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(note);
    });

    const labels = Array.from(buckets.keys()).sort((a, b) => {
      const ai = FIXED_ORDER.indexOf(a);
      const bi = FIXED_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      // both are month-style labels: newest bucket first
      return new Date(buckets.get(b)[0].lastEdited) - new Date(buckets.get(a)[0].lastEdited);
    });

    const result = [];
    if (pinned.length) {
      result.push({ title: 'Pinned', data: pinnedCollapsed ? [] : pinned, isPinnedSection: true, count: pinned.length });
    }
    labels.forEach((label) => result.push({ title: label, data: buckets.get(label) }));
    return result;
  }, [notes, query, pinnedCollapsed, sortBy]);

  const renderEmptyState = () => (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {query ? 'No Results' : 'No Notes Yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {query ? 'Try a different search term' : 'Tap the compose button to create your first note'}
      </Text>
    </View>
  );

  const moreActions = [
    {
      icon: sortBy === 'edited' ? 'checkmark-circle' : 'time-outline',
      label: 'Sort by last edited',
      onPress: () => setSortBy('edited'),
    },
    {
      icon: sortBy === 'created' ? 'checkmark-circle' : 'calendar-outline',
      label: 'Sort by date created',
      onPress: () => setSortBy('created'),
    },
    {
      icon: sortBy === 'title' ? 'checkmark-circle' : 'text-outline',
      label: 'Sort by title',
      onPress: () => setSortBy('title'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <NotesHeader
        showBack={navigation.canGoBack ? navigation.canGoBack() : false}
        onBackPress={() => navigation.goBack()}
        noteCount={notes.length}
        onMorePress={() => setMoreVisible(true)}
      />

      {sections.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 110 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) =>
            section.isPinnedSection ? (
              <TouchableOpacity
                style={styles.pinnedHeaderRow}
                activeOpacity={0.6}
                onPress={() => setPinnedCollapsed((v) => !v)}
              >
                <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
                  {section.title}
                </Text>
                <Ionicons
                  name={pinnedCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={14}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{section.title}</Text>
            )
          }
          renderItem={({ item, index, section }) => (
            <SwipeableNoteRow
              isPinned={item.isFavorite}
              onPin={() => toggleNoteFavorite(item.id)}
              onDelete={() => handleDeleteNote(item)}
            >
              <NoteRow
                note={item}
                onPress={() => handleNotePress(item)}
                showDivider={index < section.data.length - 1}
              />
            </SwipeableNoteRow>
          )}
        />
      )}

      <NotesBottomBar
        value={query}
        onChangeText={setQuery}
        onMicPress={() =>
          Alert.alert(
            'Voice search not wired up yet',
            'Dictation needs a speech-to-text library (e.g. expo-speech-recognition) that isn\u2019t installed in this project yet.'
          )
        }
        onNewNote={handleAddNote}
      />

      <ActionSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        title="Notes Options"
        actions={moreActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinnedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});
