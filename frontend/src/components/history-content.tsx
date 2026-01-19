"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { ArrowLeft, Clock, Plus, Settings, History as HistoryIcon, Tag, Globe, Key } from "lucide-react"
import { apiKeyService } from "../lib/api-key.service"
import type { ApiKeyHistory } from "../lib/types"
import { Badge } from "./ui/badge"

export function HistoryContent() {
    const [history, setHistory] = useState<ApiKeyHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await apiKeyService.getHistory()
                setHistory(data)
            } catch (error) {
                console.error("Failed to load history", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadHistory()
    }, [])

    const getActionBadge = (action: string) => {
        switch (action) {
            case "created":
                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">作成</Badge>
            case "updated":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">更新</Badge>
            case "deleted":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">削除</Badge>
            default:
                return <Badge variant="outline">{action}</Badge>
        }
    }

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">戻る</span>
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">操作履歴</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/settings">
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        アクティビティログ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">履歴はありません</p>
                    ) : (
                        <div className="space-y-8">
                            {history.map((record) => (
                                <div key={record.id} className="relative flex gap-4">
                                    {/* タイムラインの線 */}
                                    <div className="absolute left-2.5 top-8 -bottom-12 w-0.5 bg-border last:hidden"></div>
                                    
                                    <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border">
                                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                {getActionBadge(record.action)}
                                                <span className="text-sm font-medium">
                                                    APIキー: {record.apiKeyId.slice(0, 8)}...
                                                </span>
                                            </div>
                                            <time className="text-xs text-muted-foreground">
                                                {formatTimestamp(record.timestamp)}
                                            </time>
                                        </div>

                                        {record.changes && (
                                            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2 border">
                                                {Object.entries(record.changes).map(([key, change]) => (
                                                    <div key={key} className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
                                                            {key === "name" && <Tag className="h-3 w-3" />}
                                                            {key === "url" && <Globe className="h-3 w-3" />}
                                                            {key === "key" && <Key className="h-3 w-3" />}
                                                            {key}
                                                        </span>
                                                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                                                            {change.old && (
                                                                <span className="line-through text-muted-foreground truncate">
                                                                    {change.old}
                                                                </span>
                                                            )}
                                                            {change.old && <span className="text-muted-foreground">→</span>}
                                                            <span className="font-medium text-foreground truncate">
                                                                {change.new}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}