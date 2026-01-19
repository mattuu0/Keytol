import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "./components/ui/sonner"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import SettingsPage from "./pages/SettingsPage"
import HistoryPage from "./pages/HistoryPage"
import { useEffect, useState } from "react"
import { authService } from "./lib/auth.service"
import { initializeStore } from "./lib/apiKey"

// 認証が必要なルートのためのコンポーネント
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 起動時に既存の鍵があればストアを初期化
    const encryptionKey = authService.getEncryptionKey();
    if (encryptionKey) {
      try {
        initializeStore(encryptionKey);
      } catch (err) {
        console.error("Failed to initialize store:", err);
      }
    }
    setIsInitialized(true);
  }, []);

  if (!isInitialized) return null;

  return (
    <BrowserRouter basename='/ui'>
      <Toaster />
      <Routes>
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
