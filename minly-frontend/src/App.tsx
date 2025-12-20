import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import FeedPage from "./features/feed/FeedPage";
import UploadPage from "./features/upload/UploadPage";
import ProfilePage from "./features/profile/ProfilePage";
// import UserProfilePage from "./features/profile/UserProfilePage";
import { useUserStore } from "./store/user.store";
import { ThemeProvider } from "./components/ThemeProvider";
import MainLayout from "./layouts/MainLayout";
import AuthBootstrap from "./features/auth/AuthBootstrap";
import AuthSuccessPage from "./features/auth/pages/AuthSuccessPage";
import NotificationsPage from "./features/notifications/NotificationsPage";
import MediaDetailsPage from "./features/media/MediaDetailsPage";
import SavedPage from "./features/saved/SavedPage";
import EditProfilePage from "./features/profile/EditProfilePage";



export default function App() {
  const user = useUserStore((s) => s.user);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          {/* callback */}
          <Route path="/auth/success" element={<AuthSuccessPage />} />

          {/* protected */}
          <Route element={<AuthBootstrap />}>
            {/* خارج الـ MainLayout */}
            <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />

            {/* كل الصفحات اللي ليها navbar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<FeedPage mode="home" />} />
              <Route path="/explore" element={<FeedPage mode="explore" />} />
              <Route path="/trending" element={<FeedPage mode="trending" />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/media/:mediaId" element={<MediaDetailsPage />} />
              {/* <Route path="/users/:userId" element={<UserProfilePage />} /> */}
            </Route>
          </Route>

          {/* public */}
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" replace />}
          />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
