import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import FeedPage from "./features/feed/FeedPage";
import { useUserStore } from "./store/user.store";

function App() {
  const user = useUserStore((s) => s.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <FeedPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
