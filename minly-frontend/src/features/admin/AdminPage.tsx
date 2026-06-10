import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/shared/store/user.store";
import ReportsTab from "./components/ReportsTab";
import StatsTab from "./components/StatsTab";

type AdminTab = "reports" | "stats";

export default function AdminPage() {
  const me = useUserStore((s) => s.user);
  const nav = useNavigate();
  const [tab, setTab] = useState<AdminTab>("reports");

  if (!me?.isAdmin) {
    return (
      <div className="mx-auto max-w-[680px]">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 dark:bg-red-950 grid place-items-center text-red-600 dark:text-red-400 text-lg">
            ✕
          </div>
          <div className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Not authorized
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This area is restricted to administrators.
          </div>
          <button
            onClick={() => nav("/")}
            className="mt-5 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Admin
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Moderate reported content and monitor the platform.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
          Reports
        </TabButton>
        <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
          Stats
        </TabButton>
      </div>

      <div className="mt-5">
        {tab === "reports" ? <ReportsTab /> : <StatsTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "h-9 px-5 rounded-lg text-sm font-semibold transition",
        active
          ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
