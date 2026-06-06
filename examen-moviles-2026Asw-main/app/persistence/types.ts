export type StorageMode = 'sql' | 'nosql';

export interface Note {
  id: number;
  title: string;
  body: string;
  updatedAt: string;
}

export interface NoteInput {
  id?: number;
  title: string;
  body: string;
}

export interface NotesRepository {
  init(): Promise<void>;
  list(): Promise<Note[]>;
  upsert(note: NoteInput): Promise<Note>;
  remove(id: number): Promise<void>;
  clear(): Promise<void>;
}
