// APIキー管理のサービス
import { fetchApi } from "./api"
import { authService } from "./auth.service"
import type { CreateApiKeyData, UpdateApiKeyData } from "./types"
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

export const apiKeyService = {
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

        // リモートに保存（現在のストア状態を送信）
        await this.syncToRemote([]);
        
        return newKey
    },

    async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.update", id, data)

        const apiKey = await ApiKey.load(id);
        if (!apiKey) throw new Error("APIキーが見つかりません")

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

        // リモートに保存（現在のストア状態を送信）
        await this.syncToRemote([]);

        return apiKey
    },

    async delete(id: string): Promise<void> {
        console.log("apiKeyService.delete", id)

        const apiKey = await ApiKey.load(id);
        if (apiKey) {
            apiKey.delete();
        }

        // リモートに保存（現在のストア状態を送信）
        await this.syncToRemote([]);
    },
}