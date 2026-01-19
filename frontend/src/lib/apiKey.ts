import { EncryptedKeyValueStore, IEncryptedKeyValueStore } from '@/utils/store';
import { AESGCMCipher } from '@/utils/aescrypt';

// ローカルストレージのキー
const LOCAL_STORAGE_KEY = 'EncryptedKeyValueStore';

// グローバルストアインスタンス（ローカル用）
let globalLocalStore: IEncryptedKeyValueStore | null = null;
let encryptionKey: Uint8Array | null = null;

/**
 * 暗号化鍵を設定
 * @param key - 暗号化鍵 (32バイト推奨)
 */
export function setEncryptionKey(key: Uint8Array): void {
    encryptionKey = key;
}

/**
 * 暗号化鍵を取得
 */
export function getEncryptionKey(): Uint8Array {
    if (!encryptionKey) {
        throw new Error('暗号化鍵が設定されていません。先にsetEncryptionKey()を呼び出してください。');
    }
    return encryptionKey;
}

/**
 * グローバルローカルストアを初期化
 * @param key - 暗号化鍵 (32バイト推奨)
 */
export function initializeStore(key: Uint8Array): void {
    setEncryptionKey(key);
    
    // AESGCMCipherクラスのインスタンスを作成
    const cipher = new AESGCMCipher(key);

    // EncryptedKeyValueStoreのインスタンスを作成
    globalLocalStore = new EncryptedKeyValueStore(cipher);

    // ストアをローカルストレージから読み込み
    const savedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        globalLocalStore.ImportFromJSON(savedData);
    }
}

/**
 * グローバルローカルストアを取得
 */
export function getGlobalLocalStore(): IEncryptedKeyValueStore {
    if (!globalLocalStore) {
        // ストアが初期化されていない場合は、空の鍵で暫定初期化するかエラーを投げる
        // ログイン前はストアにアクセスできないのが正解
        throw new Error('ストアが初期化されていません。ログインしてください。');
    }
    return globalLocalStore;
}

/**
 * 新しいリモートストアを作成
 * @param encryptedData - 暗号化されたストアデータ（JSON文字列）
 */
export function createRemoteStore(encryptedData: string): IEncryptedKeyValueStore {
    const key = getEncryptionKey();
    const cipher = new AESGCMCipher(key);
    const remoteStore = new EncryptedKeyValueStore(cipher);
    
    if (encryptedData) {
        remoteStore.ImportFromJSON(encryptedData);
    }
    
    return remoteStore;
}

/**
 * ApiKeyクラス
 */
export class ApiKey {
    private id: string = "";
    private name: string = "";
    private key: string = "";
    private url: string = "";
    private createdAt: number = 0;
    private updatedAt: number = 0;

    /**
     * コンストラクタ
     */
    constructor(id: string, name: string, key: string, url: string) {
        this.id = id;
        this.name = name;
        this.url = url;

        const now = Date.now();
        this.createdAt = now;
        this.updatedAt = now;

        this.setKey = key
    }

    // Getter
    get getId(): string {
        return this.id;
    }

    get getName(): string {
        return this.name;
    }

    get getKey(): string {
        console.debug("ApiKey.getKey", this.key);

        return this.key;
    }

    get getUrl(): string {
        return this.url;
    }

    get getCreatedAt(): number {
        return this.createdAt;
    }

    get getUpdatedAt(): number {
        return this.updatedAt;
    }

    // Setter
    set setName(name: string) {
        this.name = name;
        this.updatedAt = Date.now();
    }

    // カギを更新する
    set setKey(key: string) {
        console.debug("ApiKey.setKey", key);

        this.key = key;
        this.updatedAt = Date.now();
    }

    set setUrl(url: string) {
        this.url = url;
        this.updatedAt = Date.now();
    }

    set setCreatedAt(createdAt: number) {
        this.createdAt = createdAt;
    }

    set setUpdatedAt(updatedAt: number) {
        this.updatedAt = updatedAt;
    }

    /**
     * ストアにApiKeyを保存
     */
    async save(): Promise<void> {
        console.debug("ApiKey.save", this.id);

        const store = getGlobalLocalStore();

        const data = {
            id: this.id,
            name: this.name,
            key: this.key,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };

        // ストアに保存
        await store.set(`apikey-${this.id}`, data);

        console.debug("ApiKey.save", this.id);

        // ストアをローカルストレージに保存
        this.saveToLocalStorage();
    }

    /**
     * ストアからApiKeyを削除
     */
    delete(): boolean {
        const store = getGlobalLocalStore();

        // ストアから削除
        const result = store.delete(`apikey-${this.id}`);

        if (!result) {
            return false;
        }

        // ストアを保存
        this.saveToLocalStorage();

        return true;
    }

    /**
     * ストアをローカルストレージに保存する
     */
    saveToLocalStorage(): void {
        const store = getGlobalLocalStore();

        // ストアをJsonに変換
        const StoreJson = store.ExportToJSON();

        // ローカルストレージに保存
        window.localStorage.setItem(LOCAL_STORAGE_KEY, StoreJson);
    }

    /**
     * ストアからApiKeyを読み込む
     * @param id - ApiKeyのID
     * @param store - 読み込むストア（指定しない場合はローカルストア）
     */
    static async load(id: string, store?: IEncryptedKeyValueStore): Promise<ApiKey | null> {
        const targetStore = store || getGlobalLocalStore();

        console.debug("ApiKey.load", id);

        const data = await targetStore.get<{
            id: string;
            name: string;
            key: string;
            url: string;
            createdAt: number;
            updatedAt: number;
        }>(`apikey-${id}`);

        if (!data) {
            return null;
        }

        const apiKey = new ApiKey(data.id, data.name, data.key, data.url);
        apiKey.setCreatedAt = data.createdAt;
        apiKey.setUpdatedAt = data.updatedAt;

        return apiKey;
    }

    /**
     * 全てのApiKeyのIDをリスト取得
     * @param store - 読み込むストア（指定しない場合はローカルストア）
     */
    static listIds(store?: IEncryptedKeyValueStore): string[] {
        const targetStore = store || getGlobalLocalStore();

        // "apikey-"で始まるキーを全て取得
        const keys = (targetStore as any).keys() as string[];
        return keys
            .filter(key => key.startsWith('apikey-'))
            .map(key => key.replace('apikey-', ''));
    }

    /**
     * 全てのApiKeyを読み込む
     * @param store - 読み込むストア（指定しない場合はローカルストア）
     */
    static async loadAll(store?: IEncryptedKeyValueStore): Promise<ApiKey[]> {
        const targetStore = store || getGlobalLocalStore();
        const ids = ApiKey.listIds(targetStore);
        const apiKeys: ApiKey[] = [];

        for (const id of ids) {
            const apiKey = await ApiKey.load(id, targetStore);
            if (apiKey) {
                apiKeys.push(apiKey);
            }
        }

        return apiKeys;
    }

    /**
     * オブジェクトをJSON形式に変換
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            key: this.key,
            url: this.url,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}