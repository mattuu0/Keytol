// APIキー管理のサービス
import { fetchApi } from "./api"
import { authService } from "./auth.service"
import type { CreateApiKeyData, UpdateApiKeyData, ApiKeyHistory } from "./types"
import { ApiKey, getGlobalLocalStore, createRemoteStore, reinitializeStore } from "./apiKey"

// ApiKeyはクラスなので type として再エクスポートしない
export { ApiKey }
export type { CreateApiKeyData, UpdateApiKeyData }

interface SyncResult {
    needsSync: boolean
    localData: ApiKey[]
    remoteData: ApiKey[]
    localTimestamp: number
    remoteTimestamp: number
}

const HISTORY_STORAGE_KEY = "history-log";

export const apiKeyService = {
    /**
     * 履歴を取得する
     */
    async getHistory(): Promise<ApiKeyHistory[]> {
        console.log("apiKeyService.getHistory");
        try {
            const store = getGlobalLocalStore();
            const history = await store.get<ApiKeyHistory[]>(HISTORY_STORAGE_KEY);
            return history || [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    },

    /**
     * 履歴を追加する
     */
    async addHistory(record: Omit<ApiKeyHistory, "id" | "timestamp">): Promise<void> {
        console.log("apiKeyService.addHistory", record);
        const store = getGlobalLocalStore();
        const history = await this.getHistory();
        
        const newRecord: ApiKeyHistory = {
            ...record,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };

        history.unshift(newRecord); // 新しいものを先頭に
        
        // 直近100件程度に制限
        const limitedHistory = history.slice(0, 100);
        
        await store.set(HISTORY_STORAGE_KEY, limitedHistory);
        // 同期は呼び出し側で行うか、ここで行う
        await this.syncToRemote([]);
    },

    /**
     * 新しい鍵で全てのデータを再暗号化してリモートに同期する
     */
    async reencryptAllKeys(newEncryptionKey: Uint8Array): Promise<void> {
        console.log("apiKeyService.reencryptAllKeys");
        
        // 1. 新しい鍵でローカルストアを再初期化（内部で再暗号化して保存が行われる）
        await reinitializeStore(newEncryptionKey);
        
        // 2. 再暗号化されたローカルデータをリモートに同期
        const localKeys = await ApiKey.loadAll();
        await this.syncToRemote(localKeys);
        
        console.log("Re-encryption and remote sync complete");
    },

    /**
     * リモートから全てのAPIキーを取得
     */
    async getAll(): Promise<ApiKey[]> {
        console.log("apiKeyService.getAll")

        const response = await fetchApi<any>(`/data/get`);
        
        console.log("Response from backend:", response);
        
        // response自体がない、またはDataフィールドがない場合は空配列
        if (!response || !response.Data || response.Data === "") {
            console.log("No data in response");
            return [];
        }

        try {
            // リモート専用のストアを作成して復号化
            const remoteStore = createRemoteStore(response.Data);

            // リモートストアから全てのAPIキーを読み込む
            const apiKeys = await ApiKey.loadAll(remoteStore);
            console.log("Loaded API keys from remote:", apiKeys.length);
            return apiKeys;
        } catch (error) {
            console.error("リモートデータの復号化に失敗しました:", error);
            throw new Error("リモートデータの復号化に失敗しました。暗号化鍵が正しいか確認してください。");
        }
    },

    /**
     * ローカルとリモートのデータを同期チェック
     */
    async checkSync(): Promise<SyncResult> {
        console.log("apiKeyService.checkSync");

        // ローカルデータを取得
        const localKeys = await ApiKey.loadAll();
        const localTimestamp = localKeys.reduce((max, key) => 
            Math.max(max, key.getUpdatedAt), 0
        );

        try {
            // リモートデータを取得（別のストアで復号化される）
            const remoteKeys = await this.getAll();
            const remoteTimestamp = remoteKeys.reduce((max, key) => 
                Math.max(max, key.getUpdatedAt), 0
            );

            console.log("Local timestamp:", localTimestamp, "Remote timestamp:", remoteTimestamp);
            console.log("Local keys:", localKeys.length, "Remote keys:", remoteKeys.length);

            // 両方とも空の場合は同期不要
            if (localKeys.length === 0 && remoteKeys.length === 0) {
                console.log("Both local and remote are empty, no sync needed");
                return {
                    needsSync: false,
                    localData: localKeys,
                    remoteData: remoteKeys,
                    localTimestamp,
                    remoteTimestamp,
                };
            }

            // 片方が空でもう片方にデータがある場合は同期が必要
            if (localKeys.length === 0 && remoteKeys.length > 0) {
                console.log("Local is empty but remote has data, sync needed");
                return {
                    needsSync: true,
                    localData: localKeys,
                    remoteData: remoteKeys,
                    localTimestamp,
                    remoteTimestamp,
                };
            }

            if (localKeys.length > 0 && remoteKeys.length === 0) {
                console.log("Remote is empty but local has data, sync needed");
                return {
                    needsSync: true,
                    localData: localKeys,
                    remoteData: remoteKeys,
                    localTimestamp,
                    remoteTimestamp,
                };
            }

            // データが異なり、かつタイムスタンプが異なる場合は同期が必要
            const needsSync = localTimestamp !== remoteTimestamp;

            console.log("Sync needed:", needsSync);

            return {
                needsSync,
                localData: localKeys,
                remoteData: remoteKeys,
                localTimestamp,
                remoteTimestamp,
            };
        } catch (error) {
            console.error("同期チェックエラー:", error);
            
            // 復号化エラーの場合はローカルデータのみ返す
            if (error instanceof Error && error.message.includes("復号化")) {
                throw error;
            }

            // その他のエラーの場合はローカルデータを使用
            return {
                needsSync: false,
                localData: localKeys,
                remoteData: [],
                localTimestamp,
                remoteTimestamp: 0,
            };
        }
    },

    /**
     * ローカルデータをリモートに同期
     */
    async syncToRemote(localKeys: ApiKey[]): Promise<void> {
        console.log("apiKeyService.syncToRemote", "Keys count:", localKeys.length);
        
        // ローカルストアの現在の状態をそのままリモートに送信
        const localStore = getGlobalLocalStore();
        const encryptedData = localStore.ExportToJSON();

        await fetchApi(`/data/save`, {
            method: "POST",
            body: JSON.stringify({ data: encryptedData }),
        });
    },

    /**
     * リモートデータをローカルに同期
     */
    async syncToLocal(remoteKeys: ApiKey[]): Promise<void> {
        console.log("apiKeyService.syncToLocal", "Keys count:", remoteKeys.length);
        
        // ローカルストアをクリア
        const localStore = getGlobalLocalStore();
        const localIds = ApiKey.listIds(localStore);
        for (const id of localIds) {
            localStore.delete(`apikey-${id}`);
        }
        
        // リモートのキーをローカルストアに保存
        for (const key of remoteKeys) {
            await key.save();
        }
        
        console.log("Synced remote data to local");
    },

    async create(data: CreateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.create", data)

        // UUIDを生成
        const uid = crypto.randomUUID()

        // 新しいApiKeyインスタンスを作成
        const newKey = new ApiKey(
            uid,
            data.name,
            data.key,
            data.url
        )

        // ローカルに保存
        await newKey.save();

        // 履歴を追加
        await this.addHistory({
            apiKeyId: uid,
            action: "created",
            changes: {
                name: { old: "", new: data.name },
                url: { old: "", new: data.url }
            }
        });
        
        return newKey
    },

    async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.update", id, data)

        const apiKey = await ApiKey.load(id);
        if (!apiKey) throw new Error("APIキーが見つかりません")

        const oldData = { name: apiKey.getName, url: apiKey.getUrl, key: apiKey.getKey };

        // 名前更新の場合
        if (data.name !== undefined) {
            apiKey.setName = data.name;
        }

        // URL更新の場合
        if (data.url !== undefined) {
            apiKey.setUrl = data.url;
        }

        // キー更新の場合
        if (data.key !== undefined) {
            apiKey.setKey = data.key;
        }

        // ローカルに保存
        await apiKey.save();

        // 履歴を追加
        const changes: any = {};
        if (data.name !== undefined && data.name !== oldData.name) changes.name = { old: oldData.name, new: data.name };
        if (data.url !== undefined && data.url !== oldData.url) changes.url = { old: oldData.url, new: data.url };
        if (data.key !== undefined && data.key !== oldData.key) changes.key = { old: "********", new: "********" };

        if (Object.keys(changes).length > 0) {
            await this.addHistory({
                apiKeyId: id,
                action: "updated",
                changes: changes
            });
        } else {
            // 変更がなくても同期は必要かもしれないので念のため
            await this.syncToRemote([]);
        }

        return apiKey
    },

    async delete(id: string): Promise<void> {
        console.log("apiKeyService.delete", id)

        const apiKey = await ApiKey.load(id);
        if (apiKey) {
            const name = apiKey.getName;
            apiKey.delete();

            // 履歴を追加
            await this.addHistory({
                apiKeyId: id,
                action: "deleted",
                changes: { name: { old: name, new: "" } }
            });
        }
    },
}