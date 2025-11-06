"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { EditApiKeyDialog } from "./edit-api-key-dialog"
import { AddApiKeyDialog } from "./add-api-key-dialog"
import { Button } from "./ui/button"
import { Plus, History, Settings } from "lucide-react"
import { apiKeyService, type ApiKey } from "../lib/api-key.service"

export type { ApiKey }

export function ApiKeyManager() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        loadApiKeys()
    }, [])

    const loadApiKeys = async () => {
        try {
            const data = await apiKeyService.getAll()
            setApiKeys(data)
        } catch (err) {
            setError("APIキーの取得に失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (id: string) => {
        const key = apiKeys.find((k) => k.id === id)
        if (key) {
            setEditingKey(key)
            setIsEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async (updatedKey: ApiKey) => {
        try {
            await apiKeyService.update(updatedKey.id, {
                name: updatedKey.name,
                key: updatedKey.key,
                url: updatedKey.url,
            })
            setApiKeys(apiKeys.map((key) => (key.id === updatedKey.id ? updatedKey : key)))
            setIsEditDialogOpen(false)
            setEditingKey(null)
        } catch (err) {
            setError("APIキーの更新に失敗しました")
        }
    }

    const handleAdd = async (newKey: Omit<ApiKey, "id" | "createdAt" | "updatedAt">) => {
        try {
            const created = await apiKeyService.create(newKey)
            setApiKeys([created, ...apiKeys])
            setIsAddDialogOpen(false)
        } catch (err) {
            setError("APIキーの追加に失敗しました")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await apiKeyService.delete(id)
            setApiKeys(apiKeys.filter((key) => key.id !== id))
        } catch (err) {
            setError("APIキーの削除に失敗しました")
        }
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">APIキー</h1>
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

            {editingKey && (
                <EditApiKeyDialog
                    apiKey={editingKey}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onSave={handleSaveEdit}
                />
            )}

            <AddApiKeyDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAdd} />
        </div>
    )
}
