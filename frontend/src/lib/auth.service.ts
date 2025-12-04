// 認証関連のサービス
import { fetchApi } from "./api"
import { USE_MOCK_DATA } from "./config"
import { mockUser, mockAuthToken } from "./mock-data"
import type { LoginCredentials, RegisterData, AuthResponse } from "./types"

export type { LoginCredentials, RegisterData, AuthResponse }

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("authService.login")

    if (USE_MOCK_DATA) {
      if (credentials.email && credentials.password) {
        const response: AuthResponse = {
          token: mockAuthToken,
          user: mockUser,
        }
        localStorage.setItem("authToken", response.token)
        return response
      }
      throw new Error("メールアドレスとパスワードを入力してください")
    }

    const response = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log("authService.register")

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
      body: JSON.stringify(data),
    })

    if (response.token) {
      localStorage.setItem("authToken", response.token)
    }

    return response
  },

  async logout(): Promise<void> {
    console.log("authService.logout")

    if (USE_MOCK_DATA) {
      localStorage.removeItem("authToken")
      return
    }

    try {
      await fetchApi("/auth/logout", {
        method: "POST",
      })
    } finally {
      localStorage.removeItem("authToken")
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
