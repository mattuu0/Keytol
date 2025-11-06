"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Eye, EyeOff, Pencil, Copy, Trash2, ExternalLink } from "lucide-react"
import type { ApiKey } from "./api-key-manager"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface ApiKeyCardProps {
    apiKey: ApiKey
    onEdit: (id: string) => void
    onDelete: (id: string) => void
}

export function ApiKeyCard({ apiKey, onEdit, onDelete }: ApiKeyCardProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [copied, setCopied] = useState(false)

    const maskKey = (key: string) => {
        if (isVisible) return key
        return "•".repeat(40)
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(apiKey.key)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="group relative overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-balance text-sm font-semibold text-card-foreground truncate">{apiKey.name}</h3>
                        <p className="text-[11px] text-muted-foreground">作成日: {apiKey.createdAt}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                                <span className="sr-only">メニューを開く</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(apiKey.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編集
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopy}>
                                <Copy className="mr-2 h-4 w-4" />
                                {copied ? "コピーしました" : "キーをコピー"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(apiKey.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* API Key */}
                <div className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5">
                    <code className="text-[11px] font-mono text-foreground break-all">{maskKey(apiKey.key)}</code>
                </div>

                {/* URL */}
                <a
                    href={apiKey.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
                >
                    <span className="flex-1 truncate font-mono">{apiKey.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground transition-colors group-hover/link:text-foreground" />
                </a>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 relative group/btn"
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        <span className="sr-only">{isVisible ? "非表示" : "表示"}</span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                            {isVisible ? "非表示" : "表示"}
                        </span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 relative group/btn" onClick={() => onEdit(apiKey.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">編集</span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                            編集
                        </span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 relative group/btn" onClick={handleCopy}>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">{copied ? "コピーしました" : "コピー"}</span>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                            {copied ? "コピーしました" : "コピー"}
                        </span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
