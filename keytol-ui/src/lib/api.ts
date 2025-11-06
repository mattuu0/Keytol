// API通信の基本設定とヘルパー関数
import { USE_MOCK_DATA } from "./config"

const API_BASE_URL =  "/api"

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
  if (USE_MOCK_DATA) {
    throw new ApiError("モックモードが有効です", 0)
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data: ApiResponse<T> = await response.json()

    if (!response.ok) {
      throw new ApiError(data.error || data.message || "リクエストに失敗しました", response.status, data)
    }

    return data.data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError("ネットワークエラーが発生しました")
  }
}

export { fetchApi, ApiError, type ApiResponse }
