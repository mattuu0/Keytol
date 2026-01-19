"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { authService } from "../lib/auth.service"
import { initializeStore } from "../lib/apiKey"
import { AlertCircle, Loader2 } from "lucide-react"

export function RegisterForm() {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // パスワード確認
        if (password !== confirmPassword) {
            setError("パスワードが一致しません")
            return
        }

        // パスワードの長さチェック
        if (password.length < 8) {
            setError("パスワードは8文字以上で入力してください")
            return
        }

        setIsLoading(true)

        try {
            await authService.register({ username, password, name: name || undefined })
            
            // 暗号化鍵を取得してストアを初期化
            const encryptionKey = authService.getEncryptionKey();
            if (encryptionKey) {
                initializeStore(encryptionKey);
            }

            navigate("/")
        } catch (err) {
            setError(err instanceof Error ? err.message : "登録に失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">keytol に登録</CardTitle>
                <CardDescription>アカウントを作成してAPIキーを安全に管理しましょう</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <p className="font-medium">⚠️ 重要な注意事項</p>
                        <p className="mt-1 text-xs">
                            パスワードを忘れた場合、保存されたAPIキーを復号化できなくなります。パスワードは安全な場所に保管してください。
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">名前（任意）</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="山田太郎"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                            autoComplete="name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">ユーザー名</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="ユーザー名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">パスワード</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                        <p className="text-xs text-muted-foreground">8文字以上で入力してください</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                登録中...
                            </>
                        ) : (
                            "登録"
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        すでにアカウントをお持ちの方は
                        <Link to="/login" className="ml-1 text-foreground underline underline-offset-4 hover:text-primary">
                            ログイン
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
