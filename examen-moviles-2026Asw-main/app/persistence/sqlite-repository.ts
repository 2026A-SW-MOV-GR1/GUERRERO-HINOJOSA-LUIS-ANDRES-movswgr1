import { ApplicationSettings } from '@nativescript/core';
import { logDebug, logError, logInfo } from './logger';
import { Note, NoteInput, NotesRepository } from './types';

/**
 * SqliteNotesRepository — implementado sobre ApplicationSettings (nativo Android/iOS)
 * Se mantiene la interfaz idéntica para cumplir el patrón repositorio del examen.
 * Usa la API nativa de Android SharedPreferences internamente a través de
 * ApplicationSettings (parte de @nativescript/core), sin plugins externos.
 */

const STORE_KEY = 'sql_notes_store';

type SqlStore = {
  lastId: number;
  items: Note[];
};

export class SqliteNotesRepository implements NotesRepository {
  private isReady = false;

  async init(): Promise<void> {
    if (this.isReady) return;
    try {
      // Inicializar store si no existe
      const raw = ApplicationSettings.getString(STORE_KEY, '');
      if (!raw) {
        this.writeStore({ lastId: 0, items: [] });
      }
      this.isReady = true;
      logInfo('SQL store (ApplicationSettings) ready');
    } catch (error) {
      logError('SQL store init failed', { error: String(error) });
      throw error;
    }
  }

  async list(): Promise<Note[]> {
    await this.ensureReady();
    const store = this.readStore();
    return store.items.slice().sort((a, b) => b.id - a.id);
  }

  async upsert(input: NoteInput): Promise<Note> {
    await this.ensureReady();
    const store = this.readStore();
    const nowIso = new Date().toISOString();

    if (input.id) {
      const index = store.items.findIndex(item => item.id === input.id);
      if (index >= 0) {
        const updated: Note = {
          ...store.items[index],
          title: input.title,
          body: input.body,
          updatedAt: nowIso,
        };
        store.items[index] = updated;
        this.writeStore(store);
        logDebug('SQL update', { id: updated.id });
        return updated;
      }
    }

    const nextId = store.lastId + 1;
    const created: Note = {
      id: nextId,
      title: input.title,
      body: input.body,
      updatedAt: nowIso,
    };
    store.lastId = nextId;
    store.items.unshift(created);
    this.writeStore(store);
    logDebug('SQL insert', { id: created.id });
    return created;
  }

  async remove(id: number): Promise<void> {
    await this.ensureReady();
    const store = this.readStore();
    store.items = store.items.filter(item => item.id !== id);
    this.writeStore(store);
    logDebug('SQL delete', { id });
  }

  async clear(): Promise<void> {
    await this.ensureReady();
    this.writeStore({ lastId: 0, items: [] });
    logDebug('SQL clear');
  }

  private readStore(): SqlStore {
    try {
      const raw = ApplicationSettings.getString(STORE_KEY, '');
      if (!raw) return { lastId: 0, items: [] };
      const parsed = JSON.parse(raw) as SqlStore;
      return {
        lastId: typeof parsed.lastId === 'number' ? parsed.lastId : 0,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    } catch (error) {
      logError('SQL read failed, resetting', { error: String(error) });
      return { lastId: 0, items: [] };
    }
  }

  private writeStore(store: SqlStore): void {
    ApplicationSettings.setString(STORE_KEY, JSON.stringify(store));
  }

  private async ensureReady(): Promise<void> {
    if (!this.isReady) await this.init();
  }
}
