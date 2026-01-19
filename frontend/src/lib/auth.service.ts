// 認証関連のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockUser, mockAuthToken } from "./mock-data"
import type { LoginCredentials, RegisterData, AuthResponse } from "./types"
import { deriveKeys } from "../utils/auth-crypto"
import { apiKeyService } from "./api-key.service"

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
    console.log("authService.login with E2EE (Argon2id)")

    const username = credentials.username || credentials.email;

    // 1. サーバーから固定ソルトを取得
    const { salt } = await fetchApi<{ salt: string }>(`/auth/salt?username=${encodeURIComponent(username)}`);

    // 2. パスワードとソルトから鍵を導出 (Argon2id)
    const { encryptionKey, authKey } = await deriveKeys(credentials.password, salt, username);
    
    currentEncryptionKey = encryptionKey;
    // LocalStorageに保存
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(encryptionKey));

    if (USE_MOCK_DATA) {
      const response: AuthResponse = {
        token: mockAuthToken,
        user: mockUser,
      }
      localStorage.setItem("authToken", response.token)
      return response
    }

    // 3. サーバーには Argon2id ハッシュをパスワードとして送信
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
    console.log("authService.register with E2EE (Argon2id)")

    const username = data.username || data.email;

    // 1. サーバーから新規ユーザー用の固定ソルトを取得
    const { salt } = await fetchApi<{ salt: string }>(`/auth/salt?username=${encodeURIComponent(username)}`);

    // 2. パスワードとソルトから鍵を導出 (Argon2id)
    const { encryptionKey, authKey } = await deriveKeys(data.password, salt, username);
    
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

    // 3. サーバーには登録情報と共に Argon2id ハッシュとソルトを送信
    const response = await fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        username: username,
        password: authKey,
        salt: salt,
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
    console.log("authService.changePassword with E2EE")

    const user = await this.getCurrentUser();
    if (!user) throw new Error("ログインが必要です");

    // 1. サーバーからソルトを取得
    const { salt } = await fetchApi<{ salt: string }>(`/auth/salt?username=${encodeURIComponent(user.username)}`);

    // 2. 現在のパスワードと新しいパスワードからそれぞれの AuthKey を導出
    const { authKey: currentAuthKey } = await deriveKeys(currentPassword, salt, user.username);
    const { encryptionKey: newEncryptionKey, authKey: newAuthKey } = await deriveKeys(newPassword, salt, user.username);

    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return
    }

    // 3. サーバーに送信
    await fetchApi("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ 
        currentPassword: currentAuthKey, 
        newPassword: newAuthKey 
      }),
    })

    // 4. 成功したら、新しい暗号化鍵で全てのデータを再暗号化してリモートへ同期
    await apiKeyService.reencryptAllKeys(newEncryptionKey);

    // 5. 新しい暗号化鍵を保存
    currentEncryptionKey = newEncryptionKey;
    localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(newEncryptionKey));
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken")
  },

  getToken(): string | null {
    return localStorage.getItem("authToken")
  },
}
