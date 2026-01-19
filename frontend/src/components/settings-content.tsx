"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { authService } from "../lib/auth.service"
import { apiKeyService } from "../lib/api-key.service"
import { AlertCircle, Loader2, LogOut, User, KeyRound, ArrowLeft } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog"

export function SettingsContent() {
    const navigate = useNavigate()
    const [user, setUser] = useState<{ id: string; username: string; email?: string; name?: string } | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [error, setError] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState("")

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            const userData = await authService.getCurrentUser()
            setUser(userData as any)
        } catch (err) {
            setError("ユーザー情報の取得に失敗しました")
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await authService.logout()
            navigate("/login")
        } catch (err) {
            setError("ログアウトに失敗しました")
            setIsLoggingOut(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setPasswordSuccess("")

        if (newPassword !== confirmNewPassword) {
            setError("新しいパスワードが一致しません")
            return
        }

        if (newPassword.length < 8) {
            setError("パスワードは8文字以上で入力してください")
            return
        }

        setIsChangingPassword(true)

        try {
            await authService.changePassword(currentPassword, newPassword)
            // authService.changePassword 内部で reencryptAllKeys が呼ばれるため、ここでは不要
            setPasswordSuccess("パスワードを変更し、全てのAPIキーを再暗号化しました")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmNewPassword("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "パスワードの変更に失敗しました")
        } finally {
            setIsChangingPassword(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">戻る</span>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">設定</h1>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                    <p>{passwordSuccess}</p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        アカウント情報
                    </CardTitle>
                    <CardDescription>現在ログイン中のアカウント情報</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">ユーザー名</p>
                        <p className="text-base text-foreground">{user?.username}</p>
                    </div>
                    {user?.email && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">メールアドレス</p>
                            <p className="text-base text-foreground">{user?.email}</p>
                        </div>
                    )}
                    {user?.name && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">名前</p>
                            <p className="text-base text-foreground">{user.name}</p>
                        </div>
                    )}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">ユーザーID</p>
                        <p className="font-mono text-sm text-foreground">{user?.id}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        パスワード変更
                    </CardTitle>
                    <CardDescription>パスワードを変更すると、全てのAPIキーが新しいパスワードで再暗号化されます</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">現在のパスワード</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                disabled={isChangingPassword}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">新しいパスワード</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={isChangingPassword}
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-muted-foreground">8文字以上で入力してください</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">新しいパスワード（確認）</Label>
                            <Input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                disabled={isChangingPassword}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                            <p className="font-medium">⚠️ 注意</p>
                            <p className="mt-1 text-xs">
                                パスワード変更時に全てのAPIキーが新しいパスワードで再暗号化されます。この処理には時間がかかる場合があります。
                            </p>
                        </div>

                        <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    変更中...
                                </>
                            ) : (
                                "パスワードを変更"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LogOut className="h-5 w-5" />
                        ログアウト
                    </CardTitle>
                    <CardDescription>アカウントからログアウトします</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isLoggingOut}>
                                {isLoggingOut ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ログアウト中...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        ログアウト
                                    </>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
                                <AlertDialogDescription>ログアウトすると、再度ログインが必要になります。</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout}>ログアウト</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    )
}
