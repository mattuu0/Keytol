"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { authService } from "../lib/auth.service"
import { initializeStore } from "../lib/apiKey"
import { Loader2, AlertCircle } from "lucide-react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export function LoginForm() {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await authService.login({ username, password })
            
            // 暗号化鍵を取得してストアを初期化
            const encryptionKey = authService.getEncryptionKey();
            if (encryptionKey) {
                initializeStore(encryptionKey);
            }
            
            navigate("/")
        } catch (err) {
            setError(err instanceof Error ? err.message : "ログインに失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">keytol にログイン</CardTitle>
                <CardDescription>ユーザー名とパスワードを入力してください</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

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
                            autoComplete="current-password"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ログイン中...
                            </>
                        ) : (
                            "ログイン"
                        )}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        アカウントをお持ちでない方は
                        <Link to="/register" className="ml-1 text-foreground underline underline-offset-4 hover:text-primary">
                            新規登録
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
