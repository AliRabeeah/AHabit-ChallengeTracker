import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';
import NoteCard from '../components/NoteCard';
import SideDrawer from '../components/SideDrawer';

export default function NotesScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    notes,
    deleteNote,
    toggleNoteLock,
    toggleNoteFavorite,
  } = useNotes();
  const insets = useSafeAreaInsets();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Sort notes: favorites first, then by last edited
  const sortedNotes = useMemo(() => {
    let filtered = filterFavorites ? notes.filter((n) => n.isFavorite) : notes;
    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
      return new Date(b.lastEdited) - new Date(a.lastEdited);
    });
  }, [notes, filterFavorites]);

  const handleDeleteNote = (note) => {
    Alert.alert(
      t('deleteConfirmTitle'),
      `Delete "${note.title || 'Untitled Note'}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => deleteNote(note.id),
        },
      ]
    );
  };

  const handleAddNote = () => {
    navigation.navigate('AddEditNote');
  };

  const handleNotePress = (note) => {
    navigation.navigate('AddEditNote', { noteId: note.id });
  };

  const renderEmptyState = () => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Notes Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Create your first note to get started
      </Text>
      <TouchableOpacity
        onPress={handleAddNote}
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.emptyBtnText, { color: colors.onPrimary }]}>
          Create Note
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
        </View>
        {notes.length > 0 && (
          <TouchableOpacity
            onPress={() => setFilterFavorites(!filterFavorites)}
            style={[styles.filterBtn, filterFavorites && { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={filterFavorites ? 'star' : 'star-outline'}
              size={20}
              color={filterFavorites ? colors.onPrimary : colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      {sortedNotes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <NoteCard
              note={item}
              index={index}
              onPress={() => handleNotePress(item)}
              onToggleLock={() => toggleNoteLock(item.id)}
              onToggleFavorite={() => toggleNoteFavorite(item.id)}
              onDelete={() => handleDeleteNote(item)}
              onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={handleAddNote}
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuBtn: { padding: 4 },
  title: { fontSize: 26, fontWeight: '800' },
  filterBtn: {
    padding: 8,
    borderRadius: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
