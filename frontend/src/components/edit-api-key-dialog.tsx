"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import type { ApiKey } from "./api-key-manager"

interface EditApiKeyDialogProps {
    apiKey: ApiKey
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (apiKey: ApiKey) => void
}

export function EditApiKeyDialog({ apiKey, open, onOpenChange, onSave }: EditApiKeyDialogProps) {
    const [name, setName] = useState(apiKey.name)
    const [key, setKey] = useState(apiKey.key)
    const [url, setUrl] = useState(apiKey.url)

    useEffect(() => {
        setName(apiKey.name)
        setKey(apiKey.key)
        setUrl(apiKey.url)
    }, [apiKey])

    const handleSave = () => {
        onSave({
            ...apiKey,
            name,
            key,
            url,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>APIキーを編集</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">名前</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: OpenAI API" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="key">APIキー</Label>
                        <Input
                            id="key"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="sk-..."
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://api.example.com"
                            className="font-mono text-sm"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSave}>保存</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
