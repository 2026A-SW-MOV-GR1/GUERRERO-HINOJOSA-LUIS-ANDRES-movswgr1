import { File, knownFolders } from '@nativescript/core';
import { logDebug, logError, logInfo } from './logger';
import { Note, NoteInput, NotesRepository } from './types';

type JsonStore = {
  lastId: number;
  items: Note[];
};

export class JsonNotesRepository implements NotesRepository {
  private file: File;

  constructor(fileName: string = 'epn_dual_store.json') {
    this.file = knownFolders.documents().getFile(fileName);
  }

  async init(): Promise<void> {
    const exists = File.exists(this.file.path);
    if (!exists) {
      await this.writeStore({ lastId: 0, items: [] });
    }
    logInfo('NoSQL JSON store ready', { file: this.file.path });
  }

  async list(): Promise<Note[]> {
    const store = await this.readStore();
    return store.items.slice().sort((a, b) => b.id - a.id);
  }

  async upsert(input: NoteInput): Promise<Note> {
    const store = await this.readStore();
    const nowIso = new Date().toISOString();

    if (input.id) {
      const index = store.items.findIndex((item) => item.id === input.id);
      if (index >= 0) {
        const updated: Note = {
          ...store.items[index],
          title: input.title,
          body: input.body,
          updatedAt: nowIso,
        };
        store.items[index] = updated;
        await this.writeStore(store);
        logDebug('NoSQL update', { id: updated.id });
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
    await this.writeStore(store);
    logDebug('NoSQL insert', { id: created.id });
    return created;
  }

  async remove(id: number): Promise<void> {
    const store = await this.readStore();
    store.items = store.items.filter((item) => item.id !== id);
    await this.writeStore(store);
    logDebug('NoSQL delete', { id });
  }

  async clear(): Promise<void> {
    await this.writeStore({ lastId: 0, items: [] });
    logDebug('NoSQL clear');
  }

  private async readStore(): Promise<JsonStore> {
    try {
      const text = await this.file.readText();
      if (!text) {
        return { lastId: 0, items: [] };
      }
      const parsed = JSON.parse(text) as JsonStore;
      return {
        lastId: typeof parsed.lastId === 'number' ? parsed.lastId : 0,
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    } catch (error) {
      logError('NoSQL read failed, resetting store', { error: String(error) });
      return { lastId: 0, items: [] };
    }
  }

  private async writeStore(store: JsonStore): Promise<void> {
    await this.file.writeText(JSON.stringify(store, null, 2));
  }
}
