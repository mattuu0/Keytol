// APIキー管理のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockApiKeys, mockHistory } from "./mock-data"
import type { ApiKey, CreateApiKeyData, UpdateApiKeyData, ApiKeyHistory } from "./types"

export type { ApiKey, CreateApiKeyData, UpdateApiKeyData, ApiKeyHistory }

export const apiKeyService = {
  async getAll(): Promise<ApiKey[]> {
    console.log("apiKeyService.getAll")

    if (USE_MOCK_DATA) {
      return [...mockApiKeys]
    }

    return await fetchApi<ApiKey[]>("/api-keys")
  },

  async getById(id: string): Promise<ApiKey> {
    if (USE_MOCK_DATA) {
      const key = mockApiKeys.find((k) => k.id === id)
      if (!key) throw new Error("APIキーが見つかりません")
      return key
    }

    return await fetchApi<ApiKey>(`/api-keys/${id}`)
  },

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    console.log("apiKeyService.create")

    if (USE_MOCK_DATA) {
      const newKey: ApiKey = {
        id: `mock-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockApiKeys.push(newKey)
      return newKey
    }

    return await fetchApi<ApiKey>("/api-keys", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
    console.log("apiKeyService.update")

    if (USE_MOCK_DATA) {
      const index = mockApiKeys.findIndex((k) => k.id === id)
      if (index === -1) throw new Error("APIキーが見つかりません")

      mockApiKeys[index] = {
        ...mockApiKeys[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return mockApiKeys[index]
    }

    return await fetchApi<ApiKey>(`/api-keys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    console.log("apiKeyService.delete")

    if (USE_MOCK_DATA) {
      const index = mockApiKeys.findIndex((k) => k.id === id)
      if (index !== -1) {
        mockApiKeys.splice(index, 1)
      }
      return
    }

    await fetchApi<void>(`/api-keys/${id}`, {
      method: "DELETE",
    })
  },

  async getHistory(id: string): Promise<ApiKeyHistory[]> {
    console.log("apiKeyService.getHistory")

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
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return
    }

    await fetchApi("/api-keys/reencrypt", {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    })
  },
}
