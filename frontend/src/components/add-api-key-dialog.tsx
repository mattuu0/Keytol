"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Loader2 } from "lucide-react"
import type { ApiKey } from "../lib/api-key.service"

interface AddApiKeyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (apiKey: Omit<ApiKey, "id" | "createdAt" | "updatedAt">) => Promise<void>
}

export function AddApiKeyDialog({ open, onOpenChange, onAdd }: AddApiKeyDialogProps) {
    const [name, setName] = useState("")
    const [key, setKey] = useState("")
    const [url, setUrl] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await onAdd({ name, key, url })
            // リセット
            setName("")
            setKey("")
            setUrl("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新しいAPIキーを追加</DialogTitle>
                    <DialogDescription>APIキーの情報を入力してください</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-name">名前</Label>
                            <Input
                                id="add-name"
                                placeholder="例: OpenAI API"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-key">APIキー</Label>
                            <Input
                                id="add-key"
                                type="password"
                                placeholder="sk-..."
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-url">URL</Label>
                            <Input
                                id="add-url"
                                type="url"
                                placeholder="https://api.example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    追加中...
                                </>
                            ) : (
                                "追加"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
