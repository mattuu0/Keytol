// APIキー管理のサービス
import { fetchApi } from "./api"
import { authService } from "./auth.service"
import type { CreateApiKeyData, UpdateApiKeyData } from "./types"
import { ApiKey } from "./apiKey"

export type { ApiKey, CreateApiKeyData, UpdateApiKeyData }

export const apiKeyService = {
    async getAll(): Promise<ApiKey[]> {
        console.log("apiKeyService.getAll")

        const response = await fetchApi<{ Data: string }>(`/data/get`);
        if (!response.Data) {
            return [];
        }

        const apiKeysData = JSON.parse(response.Data);
        return apiKeysData.map((data: any) => {
            const apiKey = new ApiKey(data.id, data.name, data.key, data.url);
            apiKey.setCreatedAt = data.createdAt;
            apiKey.setUpdatedAt = data.updatedAt;
            return apiKey;
        });
    },

    async saveAll(apiKeys: ApiKey[]): Promise<void> {
        console.log("apiKeyService.saveAll");

        const data = JSON.stringify(apiKeys.map(apiKey => apiKey.toJSON()));

        await fetchApi(`/data/save`, {
            method: "POST",
            body: JSON.stringify({ data: data }),
        });
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

        const allKeys = await this.getAll();
        allKeys.push(newKey);
        await this.saveAll(allKeys);

        return newKey
    },

    async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
        console.log("apiKeyService.update", id)

        const allKeys = await this.getAll();
        const apiKey = allKeys.find(key => key.getId === id);
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

        await this.saveAll(allKeys);

        return apiKey
    },

    async delete(id: string): Promise<void> {
        console.log("apiKeyService.delete", id)

        let allKeys = await this.getAll();
        allKeys = allKeys.filter(key => key.getId !== id);

        await this.saveAll(allKeys);
    },
}
