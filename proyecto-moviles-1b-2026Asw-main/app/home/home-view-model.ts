import { Observable, Http, Utils } from '@nativescript/core';

declare const com: any; // Allow TypeScript to access native package namespaces dynamically

export class HomeViewModel extends Observable {
    // Tab State
    private _activeTab: string = 'rest';

    // REST API State
    private _postId: string = '';
    private _postTitle: string = '';
    private _postBody: string = '';
    private _isLoading: boolean = false;
    private _hasPost: boolean = false;
    private _responseMsg: string = '';
    private _isSuccessMsg: boolean = true;

    // Secure Storage State
    private _secretKey: string = '';
    private _secretValue: string = '';
    private _compartment: string = 'shared';
    private _secretResultMsg: string = '';
    private _isSecretSuccess: boolean = true;

    // JSONPlaceholder default, with optional local backend fallback
    private _useLocalBackend: boolean = true;
    private _backendUrl: string = 'https://b181-186-69-122-21.ngrok-free.app';

    constructor() {
        super();
    }

    // --- Dynamic CSS Class Getters ---
    get tabRestClass(): string {
        return this._activeTab === 'rest' ? 'seg-btn seg-btn-active' : 'seg-btn seg-btn-inactive';
    }

    get tabSecretsClass(): string {
        return this._activeTab === 'secrets' ? 'seg-btn seg-btn-active' : 'seg-btn seg-btn-inactive';
    }

    get selectorSharedClass(): string {
        return this._compartment === 'shared' ? 'pill pill-active' : 'pill';
    }

    get selectorDataStoreClass(): string {
        return this._compartment === 'datastore' ? 'pill pill-active' : 'pill';
    }

    get selectorEncryptedClass(): string {
        return this._compartment === 'encrypted' ? 'pill pill-active' : 'pill';
    }

    get selectorLocalClass(): string {
        return this._useLocalBackend ? 'pill pill-active' : 'pill';
    }

    get selectorPlaceholderClass(): string {
        return !this._useLocalBackend ? 'pill pill-active' : 'pill';
    }

    get currentServerUrl(): string {
        return this._useLocalBackend 
            ? `URL: ${this._backendUrl}` 
            : 'URL: https://jsonplaceholder.typicode.com';
    }

    // --- Getters & Setters ---
    get activeTab(): string { return this._activeTab; }
    set activeTab(val: string) {
        if (this._activeTab !== val) {
            this._activeTab = val;
            this.notifyPropertyChange('activeTab', val);
            this.notifyPropertyChange('tabRestClass', this.tabRestClass);
            this.notifyPropertyChange('tabSecretsClass', this.tabSecretsClass);
        }
    }

    get postId(): string { return this._postId; }
    set postId(val: string) {
        if (this._postId !== val) {
            this._postId = val;
            this.notifyPropertyChange('postId', val);
        }
    }

    get postTitle(): string { return this._postTitle; }
    set postTitle(val: string) {
        if (this._postTitle !== val) {
            this._postTitle = val;
            this.notifyPropertyChange('postTitle', val);
        }
    }

    get postBody(): string { return this._postBody; }
    set postBody(val: string) {
        if (this._postBody !== val) {
            this._postBody = val;
            this.notifyPropertyChange('postBody', val);
        }
    }

    get isLoading(): boolean { return this._isLoading; }
    set isLoading(val: boolean) {
        if (this._isLoading !== val) {
            this._isLoading = val;
            this.notifyPropertyChange('isLoading', val);
        }
    }

    get hasPost(): boolean { return this._hasPost; }
    set hasPost(val: boolean) {
        if (this._hasPost !== val) {
            this._hasPost = val;
            this.notifyPropertyChange('hasPost', val);
        }
    }

    get responseMsg(): string { return this._responseMsg; }
    set responseMsg(val: string) {
        if (this._responseMsg !== val) {
            this._responseMsg = val;
            this.notifyPropertyChange('responseMsg', val);
            this.notifyPropertyChange('isSuccessMsg', this._isSuccessMsg);
        }
    }

    get isSuccessMsg(): boolean { return this._isSuccessMsg; }
    set isSuccessMsg(val: boolean) {
        if (this._isSuccessMsg !== val) {
            this._isSuccessMsg = val;
            this.notifyPropertyChange('isSuccessMsg', val);
        }
    }

    get secretKey(): string { return this._secretKey; }
    set secretKey(val: string) {
        if (this._secretKey !== val) {
            this._secretKey = val;
            this.notifyPropertyChange('secretKey', val);
        }
    }

    get secretValue(): string { return this._secretValue; }
    set secretValue(val: string) {
        if (this._secretValue !== val) {
            this._secretValue = val;
            this.notifyPropertyChange('secretValue', val);
        }
    }

    get compartment(): string { return this._compartment; }
    set compartment(val: string) {
        if (this._compartment !== val) {
            this._compartment = val;
            this.notifyPropertyChange('compartment', val);
            this.notifyPropertyChange('selectorSharedClass', this.selectorSharedClass);
            this.notifyPropertyChange('selectorDataStoreClass', this.selectorDataStoreClass);
            this.notifyPropertyChange('selectorEncryptedClass', this.selectorEncryptedClass);
        }
    }

    get secretResultMsg(): string { return this._secretResultMsg; }
    set secretResultMsg(val: string) {
        if (this._secretResultMsg !== val) {
            this._secretResultMsg = val;
            this.notifyPropertyChange('secretResultMsg', val);
            this.notifyPropertyChange('isSecretSuccess', this._isSecretSuccess);
        }
    }

    get isSecretSuccess(): boolean { return this._isSecretSuccess; }
    set isSecretSuccess(val: boolean) {
        if (this._isSecretSuccess !== val) {
            this._isSecretSuccess = val;
            this.notifyPropertyChange('isSecretSuccess', val);
        }
    }

    get useLocalBackend(): boolean { return this._useLocalBackend; }
    set useLocalBackend(val: boolean) {
        if (this._useLocalBackend !== val) {
            this._useLocalBackend = val;
            this.notifyPropertyChange('useLocalBackend', val);
            this.notifyPropertyChange('selectorLocalClass', this.selectorLocalClass);
            this.notifyPropertyChange('selectorPlaceholderClass', this.selectorPlaceholderClass);
            this.notifyPropertyChange('currentServerUrl', this.currentServerUrl);
        }
    }

    // --- Tab Navigation Handlers ---
    selectRestTab() { this.activeTab = 'rest'; }
    selectSecretsTab() { this.activeTab = 'secrets'; }

    // --- Server Selection Handlers ---
    selectLocalBackend() { this.useLocalBackend = true; }
    selectPlaceholderBackend() { this.useLocalBackend = false; }

    // --- REST API Operations (GET & PUT) ---
    private getBaseUrl(): string {
        return this._useLocalBackend ? this._backendUrl : 'https://jsonplaceholder.typicode.com';
    }

    private getRequestHeaders(): { [key: string]: string } {
        const headers: { [key: string]: string } = {};
        if (this._useLocalBackend && this._backendUrl.includes('ngrok-free.app')) {
            headers['ngrok-skip-browser-warning'] = 'true';
        }
        return headers;
    }

    async fetchPost() {
        const id = this.postId.trim();
        if (!id || isNaN(Number(id))) {
            this.isSuccessMsg = false;
            this.responseMsg = "Por favor, ingresa un ID numérico válido.";
            return;
        }

        this.isLoading = true;
        this.isSuccessMsg = true;
        this.responseMsg = "Consultando...";
        this.hasPost = false;

        const url = `${this.getBaseUrl()}/posts/${id}`;
        console.log(`[REST GET] Fetching post from: ${url}`);

        try {
            const response = await Http.request({
                url: url,
                method: 'GET',
                headers: this.getRequestHeaders()
            });

            if (response.statusCode === 200) {
                const data = response.content.toJSON();
                this.postTitle = data.title || "";
                this.postBody = data.body || "";
                this.hasPost = true;
                this.isSuccessMsg = true;
                this.responseMsg = `Post #${id} cargado exitosamente. (Código: 200 OK)`;
            } else {
                this.isSuccessMsg = false;
                this.responseMsg = `Error al cargar el post. Código de estado: ${response.statusCode}`;
            }
        } catch (error) {
            console.error("[REST GET ERROR]", error);
            this.isSuccessMsg = false;
            if (this._useLocalBackend) {
                this.responseMsg = `Error de red: No se pudo conectar a NestJS en ${this._backendUrl}. Asegúrate de que el backend esté corriendo en la misma red Wi-Fi. (Error: ${error.message || error})`;
            } else {
                this.responseMsg = `Error de red al conectar a JSONPlaceholder: ${error.message || error}`;
            }
        } finally {
            this.isLoading = false;
        }
    }

    async updatePost() {
        const id = this.postId.trim();
        this.isLoading = true;
        this.isSuccessMsg = true;
        this.responseMsg = "Enviando actualizacion...";

        const url = `${this.getBaseUrl()}/posts/${id}`;
        const postData = {
            id: Number(id),
            title: this.postTitle,
            body: this.postBody,
            userId: 1
        };

        console.log(`[REST PUT] Updating post at: ${url}`);

        try {
            const response = await Http.request({
                url: url,
                method: 'PUT',
                headers: { "Content-Type": "application/json", ...this.getRequestHeaders() },
                content: JSON.stringify(postData)
            });

            if (response.statusCode === 200 || response.statusCode === 201) {
                const data = response.content.toJSON();
                this.isSuccessMsg = true;
                this.responseMsg = `¡Post #${id} actualizado exitosamente! Código: ${response.statusCode} OK.`;
                
                // Show updated local contents
                this.postTitle = data.title;
                this.postBody = data.body;
            } else {
                this.isSuccessMsg = false;
                this.responseMsg = `Fallo en actualización. Código del Servidor: ${response.statusCode}`;
            }
        } catch (error) {
            console.error("[REST PUT ERROR]", error);
            this.isSuccessMsg = false;
            this.responseMsg = `Error al enviar actualización: ${error.message || error}`;
        } finally {
            this.isLoading = false;
        }
    }

    // --- Selector Compartimento Storage ---
    selectShared() { this.compartment = 'shared'; }
    selectDataStore() { this.compartment = 'datastore'; }
    selectEncrypted() { this.compartment = 'encrypted'; }

    // --- SECRETS OPERATIONS ---
    private isAndroid(): boolean {
        return !!(global as any).android;
    }

    saveSecret() {
        const key = this.secretKey.trim();
        const value = this.secretValue;

        if (!key) {
            this.isSecretSuccess = false;
            this.secretResultMsg = "La llave (Key) no puede estar vacía.";
            return;
        }

        if (!this.isAndroid()) {
            // Mock behavior for iOS/Simulators where Android SDK APIs aren't present
            console.log(`[MOCK SAVE] Key: ${key}, Value: ${value}, Compartment: ${this.compartment}`);
            this.isSecretSuccess = true;
            this.secretResultMsg = `[MOCK] Secreto guardado en ${this.compartment.toUpperCase()}.`;
            return;
        }

        try {
            const context = Utils.android.getApplicationContext();
            
            switch (this.compartment) {
                case 'shared':
                    com.epn.security.SecureStorageHelper.saveSharedPreferences(context, key, value);
                    this.isSecretSuccess = true;
                    this.secretResultMsg = `Secreto guardado exitosamente en SharedPreferences (Texto Plano).`;
                    break;
                case 'datastore':
                    com.epn.security.SecureStorageHelper.saveDataStore(context, key, value);
                    this.isSecretSuccess = true;
                    this.secretResultMsg = `Secreto guardado exitosamente en Jetpack Preferences DataStore (Asíncrono).`;
                    break;
                case 'encrypted':
                    com.epn.security.SecureStorageHelper.saveEncryptedPreferences(context, key, value);
                    this.isSecretSuccess = true;
                    this.secretResultMsg = `Secreto guardado exitosamente en EncryptedSharedPreferences (Cifrado AES).`;
                    break;
                default:
                    throw new Error("Compartimento no válido.");
            }
            
            // Clear inputs after successful save
            this.secretKey = "";
            this.secretValue = "";
        } catch (error) {
            console.error("[STORAGE SAVE ERROR]", error);
            this.isSecretSuccess = false;
            this.secretResultMsg = `Error al guardar secreto en Android nativo: ${error.message || error}`;
        }
    }

    retrieveSecret() {
        const key = this.secretKey.trim();

        if (!key) {
            this.isSecretSuccess = false;
            this.secretResultMsg = "La llave (Key) es obligatoria para recuperar el secreto.";
            return;
        }

        if (!this.isAndroid()) {
            // Mock behavior
            this.isSecretSuccess = false;
            this.secretResultMsg = "Secreto no encontrado (Entorno no Android nativo).";
            return;
        }

        try {
            const context = Utils.android.getApplicationContext();
            let retrievedValue: string | null = null;

            switch (this.compartment) {
                case 'shared':
                    retrievedValue = com.epn.security.SecureStorageHelper.getSharedPreferences(context, key);
                    break;
                case 'datastore':
                    retrievedValue = com.epn.security.SecureStorageHelper.getDataStore(context, key);
                    break;
                case 'encrypted':
                    retrievedValue = com.epn.security.SecureStorageHelper.getEncryptedPreferences(context, key);
                    break;
                default:
                    throw new Error("Compartimento no válido.");
            }

            if (retrievedValue !== null && retrievedValue !== undefined) {
                this.isSecretSuccess = true;
                this.secretResultMsg = `Secreto revelado: "${retrievedValue}" (Recuperado de ${this.compartment.toUpperCase()})`;
            } else {
                // Academic requirement: generic notification for non-existing secret
                this.isSecretSuccess = false;
                this.secretResultMsg = "Secreto no disponible";
            }
        } catch (error) {
            console.error("[STORAGE RETRIEVE ERROR]", error);
            this.isSecretSuccess = false;
            this.secretResultMsg = "Secreto no disponible"; // Generic safe error
        }
    }
}
