// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import FeedPage from "./features/feed/FeedPage";
import UploadPage from "./features/upload/UploadPage";
import ProfilePage from "./features/profile/ProfilePage";
import { useUserStore } from "./store/user.store";
import { ThemeProvider } from "./components/ThemeProvider";
import MainLayout from "./layouts/MainLayout";
import UserProfilePage from "./features/profile/UserProfilePage";

export default function App() {
  const user = useUserStore((s) => s.user);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              user ? <MainLayout /> : <Navigate to="/login" replace />
            }
          >
            <Route path="/" element={<FeedPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
       {/* ⭐ public profile for any user */}
       <Route
          path="/users/:userId"
          element={user ? <UserProfilePage /> : <Navigate to="/login" replace />}
        />
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/register"
            element={!user ? <RegisterPage /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
