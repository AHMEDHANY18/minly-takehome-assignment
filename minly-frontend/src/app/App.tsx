import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import MainLayout from "@/app/layouts/MainLayout";
import { useUserStore } from "@/shared/store";
import { AuthBootstrap, AuthSuccessPage, LoginPage } from "@/features/auth";
import { FeedPage } from "@/features/feed";
import { MediaDetailsPage } from "@/features/media";
import { NotificationsPage } from "@/features/notifications";
import { ProfilePage, EditProfilePage, BlockedUsersPage } from "@/features/profile";
import { SavedPage } from "@/features/saved";
import { UploadPage } from "@/features/upload";
import { SearchPage } from "@/features/search";
import { HashtagPage } from "@/features/hashtag";
import { ConversationsPage, ChatPage } from "@/features/messages";

export default function App() {
  const user = useUserStore((s) => s.user);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="/auth/success" element={<AuthSuccessPage />} />

          <Route element={<AuthBootstrap />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<FeedPage mode="home" />} />
              <Route path="/explore" element={<FeedPage mode="explore" />} />
              <Route path="/trending" element={<FeedPage mode="trending" />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/media/:mediaId" element={<MediaDetailsPage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/profile/blocked" element={<BlockedUsersPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/hashtag/:tag" element={<HashtagPage />} />
              <Route path="/messages" element={<ConversationsPage />} />
              <Route path="/messages/:conversationId" element={<ChatPage />} />
            </Route>
          </Route>

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
