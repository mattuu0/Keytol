// 共通の型定義

export interface CreateApiKeyData {
  name: string
  key: string
  url: string
}

export interface UpdateApiKeyData {
  name?: string
  key?: string
  url?: string
}

export interface ApiKeyHistory {
  id: string
  apiKeyId: string
  action: "created" | "updated" | "deleted" | "viewed"
  changes?: Record<string, { old: string; new: string }>
  timestamp: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name?: string
  }
}
