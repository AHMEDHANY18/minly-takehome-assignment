import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
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
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/50 grid place-items-center text-red-600 dark:text-red-400 text-lg">
            ✕
          </div>
          <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">
            Not authorized
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            This area is restricted to administrators.
          </div>
          <button
            onClick={() => nav("/")}
            className="mt-5 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[860px]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            Admin
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            Moderate reported content and monitor the platform.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 inline-flex rounded-full bg-gray-100 dark:bg-zinc-800 p-1">
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
    </motion.div>
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
        "h-9 px-5 rounded-full text-sm font-semibold transition active:scale-[0.98]",
        active
          ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm"
          : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
