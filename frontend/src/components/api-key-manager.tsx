"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { EditApiKeyDialog } from "./edit-api-key-dialog"
import { AddApiKeyDialog } from "./add-api-key-dialog"
import { SyncDialog } from "./sync-dialog"
import { Button } from "./ui/button"
import { Plus, History, Settings, AlertCircle, Loader2 } from "lucide-react"
import { apiKeyService, ApiKey } from "../lib/api-key.service"
import { ApiKeyCard } from "./api-key-card"

// ApiKeyはクラスなのでexport typeしない
export { ApiKey }

export function ApiKeyManager() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
    const [syncData, setSyncData] = useState<{
        localData: ApiKey[]
        remoteData: ApiKey[]
        localTimestamp: number
        remoteTimestamp: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        initializeData()
    }, [])

    const initializeData = async () => {
        try {
            // 同期チェック
            const syncResult = await apiKeyService.checkSync()

            if (syncResult.needsSync) {
                // 同期が必要な場合はダイアログを表示
                setSyncData({
                    localData: syncResult.localData,
                    remoteData: syncResult.remoteData,
                    localTimestamp: syncResult.localTimestamp,
                    remoteTimestamp: syncResult.remoteTimestamp,
                })
                setIsSyncDialogOpen(true)

                // とりあえずローカルデータを表示
                setApiKeys(syncResult.localData)
            } else {
                // 同期が不要な場合はローカルデータをロード
                await loadApiKeys()
            }
        } catch (err: any) {
            console.error("初期化エラー:", err)

            if (err.statusCode === 401) {
                // 認証エラーの場合はログインへ
                setError("セッションが切れました。再ログインしてください。")
                return
            }

            if (err.name === "OperationError" || (err instanceof Error && err.message.includes("復号化"))) {
                setError("データの復号に失敗しました。パスワードが変更されたか、データが破損している可能性があります。")
            } else {
                setError("データの初期化に失敗しました: " + (err.message || "不明なエラー"))
            }

            // エラーの場合も、可能な限りローカルデータを表示（復号エラーでなければ）
            try {
                const localKeys = await ApiKey.loadAll()
                setApiKeys(localKeys)
            } catch (localErr) {
                console.error("ローカルデータの読み込みにも失敗:", localErr)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const loadApiKeys = async () => {
        try {
            const data = await apiKeyService.getAll()
            console.log("all api keys", data)
            setApiKeys(data)
        } catch (err) {
            console.error("APIキーの取得エラー:", err)
            setError("APIキーの取得に失敗しました")
        }
    }

    const handleUseLocal = async () => {
        if (!syncData) return

        try {
            await apiKeyService.syncToRemote(syncData.localData)
            setApiKeys(syncData.localData)
            setIsSyncDialogOpen(false)
            setSyncData(null)
        } catch (err) {
            console.error("ローカルデータの同期エラー:", err)
            setError("ローカルデータの同期に失敗しました")
        }
    }

    const handleUseRemote = async () => {
        if (!syncData) return

        try {
            await apiKeyService.syncToLocal(syncData.remoteData)
            setApiKeys(syncData.remoteData)
            setIsSyncDialogOpen(false)
            setSyncData(null)
        } catch (err) {
            console.error("リモートデータの同期エラー:", err)
            setError("リモートデータの同期に失敗しました")
        }
    }

    const handleEdit = async (id: string) => {
        const key = await apiKeyService.getAll().then(keys => keys.find(k => k.getId === id))
        if (key) {
            setEditingKey(key)
            setIsEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async (id: string, updates: { name: string; key: string; url: string }) => {
        try {
            await apiKeyService.update(id, updates)
            await loadApiKeys()
            setIsEditDialogOpen(false)
            setEditingKey(null)
        } catch (err) {
            console.error("APIキーの更新エラー:", err)
            setError("APIキーの更新に失敗しました")
        }
    }

    const handleAdd = async (newKey: Omit<ApiKey, "id" | "createdAt" | "updatedAt">) => {
        try {
            await apiKeyService.create(newKey)
            await loadApiKeys()
            setIsAddDialogOpen(false)
        } catch (err) {
            console.error("APIキーの追加エラー:", err)
            setError("APIキーの追加に失敗しました")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await apiKeyService.delete(id)
            await loadApiKeys()
        } catch (err) {
            console.error("APIキーの削除エラー:", err)
            setError("APIキーの削除に失敗しました")
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Keytol</h1>
                    <p className="mt-2 text-pretty text-sm text-muted-foreground leading-relaxed">
                        すべてのAPIキーを安全に一箇所で管理
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/history">
                            <History className="h-4 w-4" />
                            <span className="sr-only">変更履歴</span>
                        </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/settings">
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">設定</span>
                        </Link>
                    </Button>
                    <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        新規追加
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
                    <p className="text-muted-foreground">APIキーがありません</p>
                    <Button className="mt-4 gap-2" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        最初のAPIキーを追加
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {apiKeys.map((apiKey) => (
                        <ApiKeyCard key={apiKey.getId} apiKey={apiKey} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {editingKey && (
                <EditApiKeyDialog
                    apiKey={editingKey}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSave={handleSaveEdit}
                />
            )}

            <AddApiKeyDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAdd} />

            {syncData && (
                <SyncDialog
                    open={isSyncDialogOpen}
                    localData={syncData.localData}
                    remoteData={syncData.remoteData}
                    localTimestamp={syncData.localTimestamp}
                    remoteTimestamp={syncData.remoteTimestamp}
                    onUseLocal={handleUseLocal}
                    onUseRemote={handleUseRemote}
                />
            )}
        </div>
    )
}
