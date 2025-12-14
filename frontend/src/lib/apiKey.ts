import { EncryptedKeyValueStore, IEncryptedKeyValueStore } from '@/utils/store';
import { AESGCMCipher } from '@/utils/aescrypt';

// ローカルストレージのキー
const LOCAL_STORAGE_KEY = 'EncryptedKeyValueStore';

// グローバルストアインスタンス
let globalStore: IEncryptedKeyValueStore | null = null;

/**
 * グローバルストアを初期化
 * @param encryptionKey - 暗号化鍵 (32バイト推奨)
 */
export function initializeStore(encryptionKey: Uint8Array): void {
    // AESGCMCipherクラスのインスタンスを作成
    const cipher = new AESGCMCipher(encryptionKey);

    // EncryptedKeyValueStoreのインスタンスを作成
    globalStore = new EncryptedKeyValueStore(cipher);

    // ストアをローカルストレージから読み込み
    globalStore.ImportFromJSON(window.localStorage.getItem(LOCAL_STORAGE_KEY) || globalStore.ExportToJSON());
}

/**
 * グローバルストアを取得
 */
function getGlobalStore(): IEncryptedKeyValueStore {
    if (!globalStore) {
        throw new Error('ストアが初期化されていません。先にinitializeStore()を呼び出してください。');
    }
    return globalStore;
}

// TODO: デバッグ用の初期化関数
function initializeDebugStore(): void {
    console.debug("initializeDebugStore");

    // テスト用のストアを作成
    initializeStore(new Uint8Array(32));
}

// TODO: デバッグ用の初期化を呼び出す
initializeDebugStore();

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

        const store = getGlobalStore();

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
        const store = getGlobalStore();

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
        const store = getGlobalStore();

        // ストアをJsonに変換
        const StoreJson = store.ExportToJSON();

        // ローカルストレージに保存
        window.localStorage.setItem(LOCAL_STORAGE_KEY, StoreJson);
    }

    /**
     * ストアからApiKeyを読み込む
     * @param id - ApiKeyのID
     */
    static async load(id: string): Promise<ApiKey | null> {
        const store = getGlobalStore();

        console.debug("ApiKey.load", id);

        const data = await store.get<{
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
     */
    static listIds(): string[] {
        const store = getGlobalStore();

        // "apikey-"で始まるキーを全て取得
        const keys = (store as any).keys() as string[];
        return keys
            .filter(key => key.startsWith('apikey-'))
            .map(key => key.replace('apikey-', ''));
    }

    /**
     * 全てのApiKeyを読み込む
     */
    static async loadAll(): Promise<ApiKey[]> {
        const ids = ApiKey.listIds();
        const apiKeys: ApiKey[] = [];

        for (const id of ids) {
            const apiKey = await ApiKey.load(id);
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
