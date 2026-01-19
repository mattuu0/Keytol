// 認証関連のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockUser, mockAuthToken } from "./mock-data"
import type { LoginCredentials, RegisterData, AuthResponse } from "./types"
import { deriveKeys } from "../utils/auth-crypto"

export type { LoginCredentials, RegisterData, AuthResponse }

// メモリ上に暗号化鍵を保持（リロードで消える）
let currentEncryptionKey: Uint8Array | null = null;

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("authService.login with E2EE")

    // パスワードから鍵を導出
    const { encryptionKey, authKey } = await deriveKeys(credentials.password, credentials.email);
    currentEncryptionKey = encryptionKey;

    if (USE_MOCK_DATA) {
      const response: AuthResponse = {
        token: mockAuthToken,
        user: mockUser,
      }
      localStorage.setItem("authToken", response.token)
      return response
    }

    // パスワードの代わりに authKey を送信
    const response = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: authKey, // サーバーには導出されたキーを送る
      }),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log("authService.register with E2EE")

    // パスワードから鍵を導出
    const { encryptionKey, authKey } = await deriveKeys(data.password, data.email);
    currentEncryptionKey = encryptionKey;

    if (USE_MOCK_DATA) {
      const response: AuthResponse = {
        token: mockAuthToken,
        user: {
          ...mockUser,
          email: data.email,
          name: data.name,
        },
      }
      localStorage.setItem("authToken", response.token)
      return response
    }

    const response = await fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: authKey, // サーバーには導出されたキーを送る
      }),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  // 暗号化鍵を取得
  getEncryptionKey(): Uint8Array | null {
    return currentEncryptionKey;
  },

  // ログアウト時に鍵も破棄
  async logout(): Promise<void> {
    currentEncryptionKey = null;
    localStorage.removeItem("authToken")
    // ... rest of the code

  async getCurrentUser(): Promise<AuthResponse["user"]> {
    console.log("authService.getCurrentUser")

    if (USE_MOCK_DATA) {
      return mockUser
    }

    return await fetchApi<AuthResponse["user"]>("/auth/me")
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    console.log("authService.changePassword")

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return
    }

    await fetchApi("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken")
  },

  getToken(): string | null {
    return localStorage.getItem("authToken")
  },
}
