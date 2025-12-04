"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { authService } from "../lib/auth.service"
import { Loader2 } from "lucide-react"

export function LoginForm() {
    const navigate = useNavigate()
    const [email, _setEmail] = useState("")
    const [password, _setPassword] = useState("")
    const [_error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await authService.login({ email, password })
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
                <CardDescription>メールアドレスとパスワードを入力してください</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
