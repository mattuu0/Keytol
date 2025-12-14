"use client"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog"
import { Button } from "./ui/button"
import { Loader2, Cloud, HardDrive, AlertTriangle } from "lucide-react"
import type { ApiKey } from "../lib/api-key.service"

interface SyncDialogProps {
    open: boolean
    localData: ApiKey[]
    remoteData: ApiKey[]
    localTimestamp: number
    remoteTimestamp: number
    onUseLocal: () => Promise<void>
    onUseRemote: () => Promise<void>
}

export function SyncDialog({
    open,
    localData,
    remoteData,
    localTimestamp,
    remoteTimestamp,
    onUseLocal,
    onUseRemote,
}: SyncDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [action, setAction] = useState<"local" | "remote" | null>(null)

    const handleUseLocal = async () => {
        setAction("local")
        setIsLoading(true)
        try {
            await onUseLocal()
        } finally {
            setIsLoading(false)
            setAction(null)
        }
    }

    const handleUseRemote = async () => {
        setAction("remote")
        setIsLoading(true)
        try {
            await onUseRemote()
        } finally {
            setIsLoading(false)
            setAction(null)
        }
    }

    const formatDate = (timestamp: number) => {
        if (!timestamp || timestamp === 0) {
            return "データなし"
        }
        return new Date(timestamp).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        データの同期が必要です
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        ローカルとリモートのデータが異なります。どちらのデータを使用しますか?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-4 py-4 sm:grid-cols-2">
                    {/* ローカルデータ */}
                    <div className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold">ローカルデータ</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                                APIキー数: <span className="font-medium text-foreground">{localData.length}件</span>
                            </p>
                            <p className="text-muted-foreground">
                                最終更新: <span className="font-medium text-foreground">{formatDate(localTimestamp)}</span>
                            </p>
                        </div>
                    </div>

                    {/* リモートデータ */}
                    <div className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2">
                            <Cloud className="h-5 w-5 text-green-500" />
                            <h3 className="font-semibold">リモートデータ</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                                APIキー数: <span className="font-medium text-foreground">{remoteData.length}件</span>
                            </p>
                            <p className="text-muted-foreground">
                                最終更新: <span className="font-medium text-foreground">{formatDate(remoteTimestamp)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium">⚠️ 注意</p>
                    <p className="mt-1 text-xs">
                        選択したデータで上書きされます。この操作は取り消せません。
                    </p>
                </div>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={handleUseLocal}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading && action === "local" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                同期中...
                            </>
                        ) : (
                            <>
                                <HardDrive className="mr-2 h-4 w-4" />
                                ローカルを使用
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleUseRemote}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading && action === "remote" ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                同期中...
                            </>
                        ) : (
                            <>
                                <Cloud className="mr-2 h-4 w-4" />
                                リモートを使用
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}