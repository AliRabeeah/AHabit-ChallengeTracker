import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, SectionList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';

import NotesHeader from '../components/notes/NotesHeader';
import NotesSearchBar from '../components/notes/NotesSearchBar';
import NoteRow from '../components/notes/NoteRow';
import SwipeableNoteRow from '../components/notes/SwipeableNoteRow';
import NotesBottomBar from '../components/notes/NotesBottomBar';
import ActionSheet from '../components/ActionSheet';

export default function NotesScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    notes,
    deleteNote,
    toggleNoteLock,
    toggleNoteFavorite, // repurposed as "pinned" for this iOS-style layout
  } = useNotes();
  const insets = useSafeAreaInsets();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [moreVisible, setMoreVisible] = useState(false);

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
          {
            text: t('delete') || 'Delete',
            style: 'destructive',
            onPress: () => deleteNote(note.id),
          },
        ]
      );
    },
    [deleteNote, t]
  );

  // Filter by search query (title + content), then split into Pinned / Notes
  // sections and sort each by most-recently-edited — matching iOS Notes.
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? notes.filter(
          (n) =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.content || '').toLowerCase().includes(q)
        )
      : notes;

    const byRecency = (a, b) => new Date(b.lastEdited) - new Date(a.lastEdited);

    const pinned = filtered.filter((n) => n.isFavorite).sort(byRecency);
    const rest = filtered.filter((n) => !n.isFavorite).sort(byRecency);

    const result = [];
    if (pinned.length) result.push({ title: 'Pinned', data: pinned });
    if (rest.length) result.push({ title: 'Notes', data: rest });
    return result;
  }, [notes, query]);

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
      icon: 'checkmark-circle-outline',
      label: 'Select Notes',
      onPress: () => {},
    },
    {
      icon: 'swap-vertical-outline',
      label: 'Sort By',
      onPress: () => {},
    },
    {
      icon: 'grid-outline',
      label: 'View as Gallery',
      onPress: () => {},
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <NotesHeader
        folderName="All Notes"
        onFolderPress={() => setMoreVisible(true)}
        onMorePress={() => setMoreVisible(true)}
        onSearchPress={() => setSearchOpen((v) => !v)}
      />

      {searchOpen && (
        <NotesSearchBar
          value={query}
          onChangeText={setQuery}
          onCancel={() => {
            setSearchOpen(false);
            setQuery('');
          }}
        />
      )}

      {sections.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          )}
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

      <NotesBottomBar noteCount={notes.length} onNewNote={handleAddNote} />

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
  container: {
    flex: 1,
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
