"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "./ui/card"
import { apiKeyService, type ApiKeyHistory } from "../lib/api-key.service"
import { AlertCircle, Loader2, Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "./ui/badge"

const actionLabels: Record<ApiKeyHistory["action"], string> = {
    created: "作成",
    updated: "更新",
    deleted: "削除",
    viewed: "閲覧",
}

const actionIcons: Record<ApiKeyHistory["action"], React.ReactNode> = {
    created: <Plus className="h-4 w-4" />,
    updated: <Pencil className="h-4 w-4" />,
    deleted: <Trash2 className="h-4 w-4" />,
    viewed: <Eye className="h-4 w-4" />,
}

const actionColors: Record<ApiKeyHistory["action"], string> = {
    created: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    updated: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    deleted: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    viewed: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function HistoryContent() {
    const [history, setHistory] = useState<ApiKeyHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const data = await apiKeyService.getAllHistory()
            setHistory(data)
        } catch (err) {
            setError("履歴の取得に失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
            </div>
        )
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">変更履歴がありません</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-3">
            <div className="mb-8">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">変更履歴</h1>
                <p className="mt-2 text-pretty text-sm text-muted-foreground leading-relaxed">
                    APIキーの変更履歴を確認できます
                </p>
            </div>

            {history.map((item) => (
                <Card key={item.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            {/* アクションアイコン */}
                            <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${actionColors[item.action]}`}
                            >
                                {actionIcons[item.action]}
                            </div>

                            {/* 詳細 */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={actionColors[item.action]}>
                                        {actionLabels[item.action]}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.timestamp).toLocaleString("ja-JP", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>

                                <p className="text-sm text-foreground">
                                    APIキーID: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{item.apiKeyId}</code>
                                </p>

                                {/* 変更内容 */}
                                {item.changes && Object.keys(item.changes).length > 0 && (
                                    <div className="mt-3 space-y-2 rounded-md border border-border bg-muted/50 p-3">
                                        <p className="text-xs font-medium text-muted-foreground">変更内容:</p>
                                        {Object.entries(item.changes).map(([field, change]) => (
                                            <div key={field} className="space-y-1">
                                                <p className="text-xs font-medium text-foreground">{field}</p>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <code className="rounded bg-red-500/10 px-2 py-1 text-red-700 dark:text-red-400">
                                                        {change.old}
                                                    </code>
                                                    <span className="text-muted-foreground">→</span>
                                                    <code className="rounded bg-green-500/10 px-2 py-1 text-green-700 dark:text-green-400">
                                                        {change.new}
                                                    </code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
