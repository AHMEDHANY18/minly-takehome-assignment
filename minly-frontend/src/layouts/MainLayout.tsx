import { Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";

export default function MainLayout() {
  return (
    <div>
      <header
        style={{
          height: 56,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #eee",
        }}
      >
        <strong>Minly</strong>
        <UserMenu />
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
