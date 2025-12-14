// APIキー管理のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockHistory } from "./mock-data"
import type { CreateApiKeyData, UpdateApiKeyData, ApiKeyHistory } from "./types"
import { ApiKey } from "./apiKey"

export type { ApiKey, CreateApiKeyData, UpdateApiKeyData, ApiKeyHistory }

export const apiKeyService = {
    async getAll(): Promise<ApiKey[]> {
        console.log("apiKeyService.getAll")
        // グローバルストアから全てのApiKeyを取得
        return await ApiKey.loadAll()
    },

    async getById(id: string): Promise<ApiKey | null> {
        console.log("apiKeyService.getById", id)

        // カギを取得する
        const key = await ApiKey.load(id)

        return key;
    },

    async create(data: CreateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.create")

        // UUIDを生成
        const uid = crypto.randomUUID()

        // 新しいApiKeyインスタンスを作成
        const newKey = new ApiKey(
            uid,
            data.name,
            data.key,
            data.url
        )

        // グローバルストアに暗号化して保存
        await newKey.save()

        return newKey
    },

    async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.update", id)

        // グローバルストアから読み込み
        const apiKey = await ApiKey.load(id)
        if (!apiKey) throw new Error("APIキーが見つかりません")

        // 名前更新の場合
        if (data.name !== undefined) {
            // 名前を更新
            apiKey.setName = data.name;
        }

        // URL更新の場合
        if (data.url !== undefined) {
            // URLを更新
            apiKey.setUrl = data.url;
        }

        // キー更新の場合
        if (data.key !== undefined) {
            // キーを更新
            apiKey.setKey = data.key;
        }

        // ストアに保存
        await apiKey.save()

        return apiKey
    },

    async delete(id: string): Promise<void> {
        console.log("apiKeyService.delete", id)

        // グローバルストアから読み込み
        const apiKey = await ApiKey.load(id)
        if (apiKey) {
            // ストアから削除
            apiKey.delete()
        }
        return
    },

    async getHistory(id: string): Promise<ApiKeyHistory[]> {
        console.log("apiKeyService.getHistory", id)

        if (USE_MOCK_DATA) {
            return mockHistory.filter((h) => h.apiKeyId === id)
        }

        return await fetchApi<ApiKeyHistory[]>(`/api-keys/${id}/history`)
    },

    async getAllHistory(): Promise<ApiKeyHistory[]> {
        console.log("apiKeyService.getAllHistory")

        if (USE_MOCK_DATA) {
            return [...mockHistory]
        }

        return await fetchApi<ApiKeyHistory[]>("/api-keys/history")
    },

    async reencryptAllKeys(newPassword: string): Promise<void> {
        console.log("apiKeyService.reencryptAllKeys")

        if (USE_MOCK_DATA) {
            // 全てのAPIキーを読み込み
            const allKeys = await ApiKey.loadAll()

            // 新しいパスワードから暗号化鍵を生成する必要があるため、
            // ここでは再暗号化のシミュレーションとして再保存
            for (const apiKey of allKeys) {
                await apiKey.save()
            }

            // 処理時間をシミュレート
            await new Promise((resolve) => setTimeout(resolve, 2000))
            return
        }

        await fetchApi("/api-keys/reencrypt", {
            method: "POST",
            body: JSON.stringify({ newPassword }),
        })
    },

    /**
     * 名前で検索
     */
    async searchByName(name: string): Promise<ApiKey[]> {
        console.log("apiKeyService.searchByName", name)

        if (USE_MOCK_DATA) {
            return await ApiKey.findByName(name)
        }

        return await fetchApi<ApiKey[]>(`/api-keys/search?name=${encodeURIComponent(name)}`)
    },

    /**
     * URLで検索
     */
    async searchByUrl(url: string): Promise<ApiKey[]> {
        console.log("apiKeyService.searchByUrl", url)

        if (USE_MOCK_DATA) {
            return await ApiKey.findByUrl(url)
        }

        return await fetchApi<ApiKey[]>(`/api-keys/search?url=${encodeURIComponent(url)}`)
    },

    /**
     * APIキーの存在確認
     */
    exists(id: string): boolean {
        console.log("apiKeyService.exists", id)

        if (USE_MOCK_DATA) {
            return ApiKey.exists(id)
        }

        // 実装が必要な場合はAPIエンドポイントを呼び出す
        throw new Error("exists method is not implemented for non-mock mode")
    },

    /**
     * APIキーの検証
     */
    async validate(id: string): Promise<{ valid: boolean; errors: string[] }> {
        console.log("apiKeyService.validate", id)

        if (USE_MOCK_DATA) {
            const apiKey = await ApiKey.load(id)
            if (!apiKey) {
                return { valid: false, errors: ["APIキーが見つかりません"] }
            }
            return apiKey.validate()
        }

        return await fetchApi<{ valid: boolean; errors: string[] }>(`/api-keys/${id}/validate`)
    },
}
