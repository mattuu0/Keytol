// 認証関連のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockUser, mockAuthToken } from "./mock-data"
import type { LoginCredentials, RegisterData, AuthResponse } from "./types"
import { deriveKeys } from "../utils/auth-crypto"

export type { LoginCredentials, RegisterData, AuthResponse }

// メモリ上とLocalStorageの両方で管理
let currentEncryptionKey: Uint8Array | null = null;
const ENCRYPTION_KEY_STORAGE_KEY = "encryptionKey";

// Uint8ArrayをBase64文字列に変換
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Base64文字列をUint8Arrayに変換
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("authService.login with E2EE")

    // ユーザー名（またはメールアドレス入力欄から取得）とパスワードから鍵を導出
    const username = credentials.username || credentials.email;
    const { encryptionKey, authKey } = await deriveKeys(credentials.password, username);
    
    currentEncryptionKey = encryptionKey;
    // LocalStorageに保存（ご要望通り）
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(encryptionKey));

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
        username: username,
        password: authKey,
      }),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log("authService.register with E2EE")

    const username = data.username || data.email;
    const { encryptionKey, authKey } = await deriveKeys(data.password, username);
    
    currentEncryptionKey = encryptionKey;
    // LocalStorageに保存
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(encryptionKey));

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
        username: username,
        password: authKey,
      }),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  // 暗号化鍵を取得
  getEncryptionKey(): Uint8Array | null {
    if (currentEncryptionKey) return currentEncryptionKey;
    
    const savedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
    if (savedKey) {
      currentEncryptionKey = base64ToArrayBuffer(savedKey);
      return currentEncryptionKey;
    }
    
    return null;
  },

  // ログアウト時に鍵も破棄
  async logout(): Promise<void> {
    console.log("authService.logout")
    currentEncryptionKey = null;
    localStorage.removeItem("authToken")
    localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY)

    if (USE_MOCK_DATA) {
      return
    }

    try {
      await fetchApi("/auth/logout", {
        method: "POST",
      })
    } finally {
      // ネットワークエラーが起きてもローカルのトークンは消す
    }
  },

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
