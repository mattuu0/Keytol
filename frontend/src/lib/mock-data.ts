import type { ApiKey, ApiKeyHistory, AuthResponse } from "./types"

// モックユーザーデータ
export const mockUser: AuthResponse["user"] = {
  id: "mock-user-123",
  email: "demo@keytol.com",
  name: "デモユーザー",
}

// モックAPIキーデータ
export const mockApiKeys: ApiKey[] = [
  {
    id: "1",
    name: "OpenAI API Key",
    key: "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz",
    url: "https://platform.openai.com",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    name: "Stripe API Key",
    key: "sk_test_abcdefghijklmnopqrstuvwxyz123456",
    url: "https://stripe.com/dashboard",
    createdAt: "2024-01-20T14:20:00Z",
    updatedAt: "2024-02-01T09:15:00Z",
  },
  {
    id: "3",
    name: "GitHub Personal Access Token",
    key: "ghp_1234567890abcdefghijklmnopqrstuvwxyz",
    url: "https://github.com/settings/tokens",
    createdAt: "2024-02-05T16:45:00Z",
    updatedAt: "2024-02-05T16:45:00Z",
  },
]

// モック変更履歴データ
export const mockHistory: ApiKeyHistory[] = [
  {
    id: "h1",
    apiKeyId: "1",
    action: "created",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: "h2",
    apiKeyId: "2",
    action: "created",
    timestamp: "2024-01-20T14:20:00Z",
  },
  {
    id: "h3",
    apiKeyId: "2",
    action: "updated",
    changes: {
      name: { old: "Stripe Test Key", new: "Stripe API Key" },
    },
    timestamp: "2024-02-01T09:15:00Z",
  },
  {
    id: "h4",
    apiKeyId: "3",
    action: "created",
    timestamp: "2024-02-05T16:45:00Z",
  },
  {
    id: "h5",
    apiKeyId: "1",
    action: "viewed",
    timestamp: "2024-02-10T11:20:00Z",
  },
]

// モック認証トークン
export const mockAuthToken = "mock-jwt-token-123456789"
