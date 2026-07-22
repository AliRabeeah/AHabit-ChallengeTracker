import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useTokens } from '../theme/tokens';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotes } from '../context/NoteContext';
import NoteCard from '../components/NoteCard';
import SideDrawer from '../components/SideDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function NotesScreen({ navigation }) {
  const { colors, mode } = useTheme();
  const tokens = useTokens();
  const { t } = useLanguage();
  const {
    notes,
    deleteNote,
    toggleNoteLock,
    toggleNoteFavorite,
  } = useNotes();
  const insets = useSafeAreaInsets();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const isDark = mode === 'dark';

  // Sort notes: pinned (favorites) first, then by last edited
  const sortedNotes = useMemo(() => {
    let filtered = filterFavorites ? notes.filter((n) => n.isFavorite) : notes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
      return new Date(b.lastEdited) - new Date(a.lastEdited);
    });
  }, [notes, filterFavorites, searchQuery]);

  const pinnedNotes = useMemo(
    () => sortedNotes.filter((n) => n.isFavorite),
    [sortedNotes]
  );
  const regularNotes = useMemo(
    () => sortedNotes.filter((n) => !n.isFavorite),
    [sortedNotes]
  );

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

  const renderPinnedSection = () => {
    if (pinnedNotes.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="pin" size={12} color={colors.primary} />
          </View>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            PINNED
          </Text>
          <View style={[styles.sectionBadge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
            <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
              {pinnedNotes.length}
            </Text>
          </View>
        </View>
        {pinnedNotes.map((item, index) => (
          <NoteCard
            key={item.id}
            note={item}
            index={index}
            onPress={() => handleNotePress(item)}
            onToggleLock={() => toggleNoteLock(item.id)}
            onToggleFavorite={() => toggleNoteFavorite(item.id)}
            onDelete={() => handleDeleteNote(item)}
            onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
          />
        ))}
      </View>
    );
  };

  const renderRegularSection = () => {
    if (regularNotes.length === 0) return null;
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ALL NOTES
          </Text>
          <View style={[styles.sectionBadge, { backgroundColor: isDark ? withAlpha('#FFFFFF', 0.06) : withAlpha('#000000', 0.04) }]}>
            <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>
              {regularNotes.length}
            </Text>
          </View>
        </View>
        {regularNotes.map((item, index) => (
          <NoteCard
            key={item.id}
            note={item}
            index={pinnedNotes.length + index}
            onPress={() => handleNotePress(item)}
            onToggleLock={() => toggleNoteLock(item.id)}
            onToggleFavorite={() => toggleNoteFavorite(item.id)}
            onDelete={() => handleDeleteNote(item)}
            onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
          />
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.empty}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? t('noMatches') : t('noNotesYet')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? t('tryDifferentSearch')
          : t('createFirstNote')}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          onPress={handleAddNote}
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.emptyBtnText, { color: colors.onPrimary }]}>
            {t('createNote')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item, index }) => (
    <NoteCard
      note={item}
      index={index}
      onPress={() => handleNotePress(item)}
      onToggleLock={() => toggleNoteLock(item.id)}
      onToggleFavorite={() => toggleNoteFavorite(item.id)}
      onDelete={() => handleDeleteNote(item)}
      onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          <BlurView tint={isDark ? 'dark' : 'light'} intensity={80} style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchNotes')}
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </BlurView>
        </View>
      )}

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            style={styles.headerIconBtn}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setFilterFavorites(!filterFavorites)}
            style={[styles.filterBtn, filterFavorites && { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={filterFavorites ? 'star' : 'star-outline'}
              size={18}
              color={filterFavorites ? colors.onPrimary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSearchVisible(!searchVisible)}
            style={styles.headerIconBtn}
          >
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Note List */}
      {sortedNotes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              {pinnedNotes.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIcon}>
                      <Ionicons name="pin" size={12} color={colors.primary} />
                    </View>
                    <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                      {t('pinnedNotes')}
                    </Text>
                    <View style={[styles.sectionBadge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                      <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
                        {pinnedNotes.length}
                      </Text>
                    </View>
                  </View>
                  {pinnedNotes.map((item, index) => (
                    <NoteCard
                      key={item.id}
                      note={item}
                      index={index}
                      onPress={() => handleNotePress(item)}
                      onToggleLock={() => toggleNoteLock(item.id)}
                      onToggleFavorite={() => toggleNoteFavorite(item.id)}
                      onDelete={() => handleDeleteNote(item)}
                      onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
                    />
                  ))}
                  {/* Orange divider between pinned and regular */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.divider, { backgroundColor: withAlpha(colors.primary, isDark ? 0.3 : 0.2) }]} />
                  </View>
                </View>
              )}
              {regularNotes.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                      {t('allNotes')}
                    </Text>
                    <View style={[styles.sectionBadge, { backgroundColor: isDark ? withAlpha('#FFFFFF', 0.06) : withAlpha('#000000', 0.04) }]}>
                      <Text style={[styles.sectionBadgeText, { color: colors.textSecondary }]}>
                        {regularNotes.length}
                      </Text>
                    </View>
                  </View>
                  {regularNotes.map((item, index) => (
                    <NoteCard
                      key={item.id}
                      note={item}
                      index={pinnedNotes.length + index}
                      onPress={() => handleNotePress(item)}
                      onToggleLock={() => toggleNoteLock(item.id)}
                      onToggleFavorite={() => toggleNoteFavorite(item.id)}
                      onDelete={() => handleDeleteNote(item)}
                      onSetReminder={() => navigation.navigate('AddEditNote', { noteId: item.id, setReminder: true })}
                    />
                  ))}
                </View>
              )}
            </>
          }
        />
      )}

      {/* Bottom toolbar */}
      <BlurView tint={isDark ? 'dark' : 'light'} intensity={60} style={[styles.bottomBar, { borderTopColor: isDark ? withAlpha('#FFFFFF', 0.06) : withAlpha('#000000', 0.06), paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomLeft} />
        <View style={styles.bottomRight}>
          <Text style={[styles.noteCount, { color: colors.textSecondary }]}>
            {t('noteCount')(notes.length)}
          </Text>
          <TouchableOpacity
            onPress={handleAddNote}
            style={[styles.fab, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} navigation={navigation} />
    </View>
  );
}

// Helper: convert hex + alpha to 8-digit hex
function withAlpha(hex, alpha) {
  if (!hex || hex[0] !== '#') return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: { padding: 6 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  filterBtn: {
    padding: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search
  searchContainer: { marginBottom: 10, paddingHorizontal: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 38,
    overflow: 'hidden',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  // Sections
  sectionContainer: { marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A0026',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dividerContainer: {
    marginVertical: 14,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    borderRadius: 0.5,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  bottomLeft: { flex: 1 },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteCount: { fontSize: 13, fontWeight: '600' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF8A00',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
    paddingHorizontal: 32,
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
});
