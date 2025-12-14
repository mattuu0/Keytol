// API通信の基本設定とヘルパー関数
import { USE_MOCK_DATA } from "./config"
import { authService } from "./auth.service"

const API_BASE_URL = "/api"

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const user = await authService.getCurrentUser();

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (user) {
    headers["X-User-ID"] = user.id;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // 204 No Content または 201 Created の場合は空のオブジェクトを返す
    if (response.status === 204 || response.status === 201) {
      return {} as T
    }

    // レスポンスがJSONでない場合のチェック
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      if (!response.ok) {
        throw new ApiError("リクエストに失敗しました", response.status)
      }
      return {} as T
    }

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.error || data.message || "リクエストに失敗しました", response.status, data)
    }

    // バックエンドのレスポンスをそのまま返す
    // data.data の自動展開は行わない
    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // ネットワークエラーやJSONパースエラーの詳細をログ出力
    console.error("fetchApi error:", error)
    throw new ApiError("ネットワークエラーが発生しました")
  }
}

export { fetchApi, ApiError, type ApiResponse }