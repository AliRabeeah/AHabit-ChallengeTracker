import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { scheduleReminder, cancelReminder } from '../utils/notifications';

const STORAGE_KEY = 'ahabit_notes_v1';
const PIN_STORAGE_KEY = 'ahabit_note_pin';
const BIOMETRICS_ENABLED_KEY = 'ahabit_biometrics_enabled';

const NoteContext = createContext(null);

export function NoteProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [pinSet, setPinSet] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load notes and security settings from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const [notesData, pinExists, biometricsStatus] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          SecureStore.getItemAsync(PIN_STORAGE_KEY),
          AsyncStorage.getItem(BIOMETRICS_ENABLED_KEY),
        ]);
        if (notesData) setNotes(JSON.parse(notesData));
        setPinSet(!!pinExists);
        setBiometricsEnabled(biometricsStatus === 'true');
      } catch (error) {
        console.error('Error loading notes:', error);
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback(async (nextNotes) => {
    setNotes(nextNotes);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
  }, []);

  /**
   * Creates a new note.
   */
  const addNote = useCallback(
    async (noteData) => {
      let reminderId = null;
      if (noteData.reminderTime) {
        reminderId = await scheduleReminder({
          ...noteData,
          isNote: true,
        });
      }

      const newNote = {
        id: Date.now().toString(),
        isLocked: false,
        isFavorite: false,
        checklistItems: [],
        reminderId,
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        ...noteData,
      };

      await persist([...notes, newNote]);
      return newNote;
    },
    [notes, persist]
  );

  /**
   * Updates an existing note.
   */
  const updateNote = useCallback(
    async (id, updates) => {
      const existing = notes.find((n) => n.id === id);
      if (!existing) return;

      let reminderId = existing.reminderId;
      if (updates.reminderTime !== undefined && updates.reminderTime !== existing.reminderTime) {
        if (existing.reminderId) await cancelReminder(existing.reminderId);
        reminderId = updates.reminderTime
          ? await scheduleReminder({
              ...existing,
              ...updates,
              isNote: true,
            })
          : null;
      }

      const next = notes.map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              reminderId,
              lastEdited: new Date().toISOString(),
            }
          : n
      );
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Deletes a note.
   */
  const deleteNote = useCallback(
    async (id) => {
      const existing = notes.find((n) => n.id === id);
      if (existing?.reminderId) await cancelReminder(existing.reminderId);
      await persist(notes.filter((n) => n.id !== id));
    },
    [notes, persist]
  );

  /**
   * Toggles the locked status of a note.
   */
  const toggleNoteLock = useCallback(
    async (id) => {
      const next = notes.map((n) =>
        n.id === id ? { ...n, isLocked: !n.isLocked } : n
      );
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Toggles the favorite status of a note.
   */
  const toggleNoteFavorite = useCallback(
    async (id) => {
      const next = notes.map((n) =>
        n.id === id ? { ...n, isFavorite: !n.isFavorite } : n
      );
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Toggles a checklist item within a note.
   */
  const toggleChecklistItem = useCallback(
    async (noteId, itemId) => {
      const next = notes.map((n) => {
        if (n.id !== noteId) return n;
        const updatedItems = (n.checklistItems || []).map((item) =>
          item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
        );
        return { ...n, checklistItems: updatedItems, lastEdited: new Date().toISOString() };
      });
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Adds a checklist item to a note.
   */
  const addChecklistItem = useCallback(
    async (noteId, itemText) => {
      const next = notes.map((n) => {
        if (n.id !== noteId) return n;
        const newItem = {
          id: Date.now().toString(),
          text: itemText,
          isChecked: false,
        };
        return {
          ...n,
          checklistItems: [...(n.checklistItems || []), newItem],
          lastEdited: new Date().toISOString(),
        };
      });
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Removes a checklist item from a note.
   */
  const removeChecklistItem = useCallback(
    async (noteId, itemId) => {
      const next = notes.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          checklistItems: (n.checklistItems || []).filter((item) => item.id !== itemId),
          lastEdited: new Date().toISOString(),
        };
      });
      await persist(next);
    },
    [notes, persist]
  );

  /**
   * Sets a PIN for note security.
   */
  const setPIN = useCallback(async (pin) => {
    try {
      await SecureStore.setItemAsync(PIN_STORAGE_KEY, pin);
      setPinSet(true);
    } catch (error) {
      console.error('Error setting PIN:', error);
    }
  }, []);

  /**
   * Verifies a PIN.
   */
  const verifyPIN = useCallback(async (pin) => {
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_STORAGE_KEY);
      return storedPin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }, []);

  /**
   * Enables or disables biometric authentication.
   */
  const setBiometricsEnabled = useCallback(async (enabled) => {
    try {
      await AsyncStorage.setItem(BIOMETRICS_ENABLED_KEY, enabled.toString());
      setBiometricsEnabled(enabled);
    } catch (error) {
      console.error('Error setting biometrics:', error);
    }
  }, []);

  return (
    <NoteContext.Provider
      value={{
        notes,
        loaded,
        pinSet,
        biometricsEnabled,
        addNote,
        updateNote,
        deleteNote,
        toggleNoteLock,
        toggleNoteFavorite,
        toggleChecklistItem,
        addChecklistItem,
        removeChecklistItem,
        setPIN,
        verifyPIN,
        setBiometricsEnabled,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NoteContext);
  if (!ctx) throw new Error('useNotes must be used within NoteProvider');
  return ctx;
}
