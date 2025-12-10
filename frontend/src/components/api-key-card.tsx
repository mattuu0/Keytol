"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Eye, EyeOff, Pencil, Copy, Trash2, ExternalLink } from "lucide-react"
import type { ApiKey } from "./api-key-manager"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog"

interface ApiKeyCardProps {
    apiKey: ApiKey
    onEdit: (id: string) => void
    onDelete: (id: string) => void
}

export function ApiKeyCard({ apiKey, onEdit, onDelete }: ApiKeyCardProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const maskKey = (key: string) => {
        if (isVisible) return key
        return "•".repeat(40)
    }

    const handleCopy = async () => {
        await navigator.clipboard.writeText(apiKey.getKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDeleteClick = () => {
        setShowDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        setIsDeleting(true)
        try {
            await onDelete(apiKey.getId)
            setShowDeleteDialog(false)
        } catch (error) {
            console.error("削除に失敗しました:", error)
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                <CardContent className="p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-balance text-sm font-semibold text-card-foreground truncate">{apiKey.name}</h3>
                            <p className="text-[11px] text-muted-foreground">作成日: {apiKey.createdAt}</p>
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5">
                        <code className="text-[11px] font-mono text-foreground break-all">{maskKey(apiKey.key)}</code>
                    </div>

                    {/* URL */}
                    <a
                        href={apiKey.getUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
                    >
                        <span className="flex-1 truncate font-mono">{apiKey.getUrl}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground transition-colors group-hover/link:text-foreground" />
                    </a>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-0.5 border-t border-border/50 pt-2">
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
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 relative group/btn" 
                            onClick={() => onEdit(apiKey.getId)}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">編集</span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                                編集
                            </span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 relative group/btn" 
                            onClick={handleCopy}
                        >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="sr-only">{copied ? "コピーしました" : "コピー"}</span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                                {copied ? "コピーしました" : "コピー"}
                            </span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 relative group/btn text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">削除</span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                                削除
                            </span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 削除確認ダイアログ */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>APIキーを削除しますか?</AlertDialogTitle>
                        <AlertDialogDescription>
                            「{apiKey.getName}」を削除します。この操作は取り消せません。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "削除中..." : "削除"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}