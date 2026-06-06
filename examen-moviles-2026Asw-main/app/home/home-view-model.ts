import { Observable } from '@nativescript/core';
import { JsonNotesRepository } from '../persistence/json-repository';
import { SqliteNotesRepository } from '../persistence/sqlite-repository';
import { logError, logInfo } from '../persistence/logger';
import { Note, NoteInput, NotesRepository, StorageMode } from '../persistence/types';

export class HomeViewModel extends Observable {
    // Dual Persistence State
    private _storageMode: StorageMode = 'sql';
    private _notes: Note[] = [];
    private _noteTitle: string = '';
    private _noteBody: string = '';
    private _selectedNoteId: number | null = null;
    private _persistMsg: string = '';
    private _isPersistSuccess: boolean = true;
    private _isPersistLoading: boolean = false;
    private _testResultMsg: string = '';
    private _isTestSuccess: boolean = true;

    private readonly sqlRepository = new SqliteNotesRepository();
    private readonly nosqlRepository = new JsonNotesRepository();

    constructor() {
        super();
        this.initializePersistence();
    }

    // --- Dynamic CSS Class Getters ---
    get storageChipText(): string {
        return this._storageMode === 'sql' ? 'SQL (SQLite)' : 'NoSQL (JSON)';
    }

    get storageChipClass(): string {
        return this._storageMode === 'sql' ? 'chip chip-sql' : 'chip chip-nosql';
    }

    get isSqlMode(): boolean {
        return this._storageMode === 'sql';
    }

    // --- Getters & Setters ---
    get notes(): Note[] { return this._notes; }
    set notes(val: Note[]) {
        this._notes = val;
        this.notifyPropertyChange('notes', val);
    }

    get noteTitle(): string { return this._noteTitle; }
    set noteTitle(val: string) {
        if (this._noteTitle !== val) {
            this._noteTitle = val;
            this.notifyPropertyChange('noteTitle', val);
        }
    }

    get noteBody(): string { return this._noteBody; }
    set noteBody(val: string) {
        if (this._noteBody !== val) {
            this._noteBody = val;
            this.notifyPropertyChange('noteBody', val);
        }
    }

    get selectedNoteId(): number | null { return this._selectedNoteId; }
    set selectedNoteId(val: number | null) {
        if (this._selectedNoteId !== val) {
            this._selectedNoteId = val;
            this.notifyPropertyChange('selectedNoteId', val);
            this.notifyPropertyChange('saveButtonText', this.saveButtonText);
        }
    }

    get saveButtonText(): string {
        return this._selectedNoteId ? '💾 Actualizar' : '💾 Guardar';
    }

    get persistMsg(): string { return this._persistMsg; }
    set persistMsg(val: string) {
        if (this._persistMsg !== val) {
            this._persistMsg = val;
            this.notifyPropertyChange('persistMsg', val);
            this.notifyPropertyChange('isPersistSuccess', this._isPersistSuccess);
        }
    }

    get isPersistSuccess(): boolean { return this._isPersistSuccess; }
    set isPersistSuccess(val: boolean) {
        if (this._isPersistSuccess !== val) {
            this._isPersistSuccess = val;
            this.notifyPropertyChange('isPersistSuccess', val);
        }
    }

    get isPersistLoading(): boolean { return this._isPersistLoading; }
    set isPersistLoading(val: boolean) {
        if (this._isPersistLoading !== val) {
            this._isPersistLoading = val;
            this.notifyPropertyChange('isPersistLoading', val);
        }
    }

    get testResultMsg(): string { return this._testResultMsg; }
    set testResultMsg(val: string) {
        if (this._testResultMsg !== val) {
            this._testResultMsg = val;
            this.notifyPropertyChange('testResultMsg', val);
            this.notifyPropertyChange('isTestSuccess', this._isTestSuccess);
        }
    }

    get isTestSuccess(): boolean { return this._isTestSuccess; }
    set isTestSuccess(val: boolean) {
        if (this._isTestSuccess !== val) {
            this._isTestSuccess = val;
            this.notifyPropertyChange('isTestSuccess', val);
        }
    }

    // --- Dual Persistence Operations ---
    toggleStorageMode(args: any) {
        const isChecked = typeof args.value === 'boolean' ? args.value : !!args.object.checked;
        const nextMode: StorageMode = isChecked ? 'sql' : 'nosql';
        this.setStorageMode(nextMode);
    }

    private async initializePersistence() {
        try {
            await this.sqlRepository.init();
            await this.nosqlRepository.init();
            await this.loadNotes();
        } catch (error) {
            logError('Persistence init failed', { error: String(error) });
            this.isPersistSuccess = false;
            this.persistMsg = 'No se pudo iniciar la persistencia local.';
        }
    }

    private get activeRepository(): NotesRepository {
        return this._storageMode === 'sql' ? this.sqlRepository : this.nosqlRepository;
    }

    private async setStorageMode(mode: StorageMode) {
        if (this._storageMode === mode) {
            return;
        }

        this._storageMode = mode;
        this.notifyPropertyChange('storageChipText', this.storageChipText);
        this.notifyPropertyChange('storageChipClass', this.storageChipClass);
        this.notifyPropertyChange('isSqlMode', this.isSqlMode);
        logInfo('Storage mode switched', { mode });
        await this.loadNotes();
        this.clearNoteForm();
    }

    async loadNotes() {
        this.isPersistLoading = true;
        try {
            await this.activeRepository.init();
            const items = await this.activeRepository.list();
            this.notes = items;
            this.isPersistSuccess = true;
            this.persistMsg = `Modo activo: ${this.storageChipText}. ${items.length} registro(s).`;
        } catch (error) {
            logError('Load notes failed', { error: String(error) });
            this.isPersistSuccess = false;
            this.persistMsg = 'Error al cargar la lista local.';
        } finally {
            this.isPersistLoading = false;
        }
    }

    async saveNote() {
        const title = this.noteTitle.trim();
        const body = this.noteBody.trim();

        if (!title || !body) {
            this.isPersistSuccess = false;
            this.persistMsg = 'Completa titulo y descripcion.';
            return;
        }

        this.isPersistLoading = true;
        try {
            await this.activeRepository.init();
            const input: NoteInput = {
                id: this._selectedNoteId ?? undefined,
                title,
                body,
            };
            const result = await this.activeRepository.upsert(input);
            logInfo('Note saved', { mode: this._storageMode, id: result.id });
            this.isPersistSuccess = true;
            this.persistMsg = `Registro ${result.id} guardado en ${this.storageChipText}.`;
            this.clearNoteForm();
            await this.loadNotes();
        } catch (error) {
            logError('Save note failed', { error: String(error) });
            this.isPersistSuccess = false;
            this.persistMsg = 'No se pudo guardar el registro.';
        } finally {
            this.isPersistLoading = false;
        }
    }

    editNote = (args: any) => {
        const note = args.object.bindingContext as Note;
        if (!note) {
            return;
        }
        this.selectedNoteId = note.id;
        this.noteTitle = note.title;
        this.noteBody = note.body;
        this.persistMsg = `Editando registro ${note.id} (${this.storageChipText}).`;
        this.isPersistSuccess = true;
    }

    deleteNote = async (args: any) => {
        const note = args.object.bindingContext as Note;
        if (!note) {
            return;
        }
        this.isPersistLoading = true;
        try {
            await this.activeRepository.init();
            await this.activeRepository.remove(note.id);
            logInfo('Note deleted', { mode: this._storageMode, id: note.id });
            this.isPersistSuccess = true;
            this.persistMsg = `Registro ${note.id} eliminado.`;
            if (this._selectedNoteId === note.id) {
                this.clearNoteForm();
            }
            await this.loadNotes();
        } catch (error) {
            logError('Delete note failed', { error: String(error) });
            this.isPersistSuccess = false;
            this.persistMsg = 'No se pudo eliminar el registro.';
        } finally {
            this.isPersistLoading = false;
        }
    }

    clearNoteForm() {
        this.selectedNoteId = null;
        this.noteTitle = '';
        this.noteBody = '';
    }

    async runLocalTests() {
        this.isTestSuccess = true;
        this.testResultMsg = 'Ejecutando pruebas locales...';

        try {
            await this.sqlRepository.init();
            await this.nosqlRepository.init();
            await this.sqlRepository.clear();
            await this.nosqlRepository.clear();

            const sqlNote = await this.sqlRepository.upsert({ title: 'SQL test', body: 'fila 1' });
            const sqlList = await this.sqlRepository.list();
            this.assertCondition(sqlList.length === 1, 'SQL write failed');
            this.assertCondition(sqlList[0].id === sqlNote.id, 'SQL read mismatch');

            const nosqlEmpty = await this.nosqlRepository.list();
            this.assertCondition(nosqlEmpty.length === 0, 'NoSQL should be empty');

            await this.nosqlRepository.upsert({ title: 'NoSQL test', body: 'doc 1' });
            const nosqlList = await this.nosqlRepository.list();
            this.assertCondition(nosqlList.length === 1, 'NoSQL write failed');

            const sqlListAfter = await this.sqlRepository.list();
            this.assertCondition(sqlListAfter.length === 1, 'SQL data changed after NoSQL write');

            this.isTestSuccess = true;
            this.testResultMsg = 'Pruebas OK: escritura y conmutacion validada.';
        } catch (error) {
            logError('Local tests failed', { error: String(error) });
            this.isTestSuccess = false;
            this.testResultMsg = `Pruebas fallaron: ${error.message || error}`;
        }
    }

    private assertCondition(condition: boolean, message: string) {
        if (!condition) {
            throw new Error(message);
        }
    }
}
