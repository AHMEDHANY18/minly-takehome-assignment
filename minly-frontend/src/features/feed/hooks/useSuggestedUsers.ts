import { useCallback, useEffect, useState } from "react";
import { SocialAPI, type SuggestedUser } from "@/shared/api/social.api";

export function useSuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await SocialAPI.suggestedUsers();
      if (res.data.status !== "success") throw new Error("Suggested users failed");

      setUsers(res.data.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load suggested users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ✅ Remove instantly
  const removeUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  // ✅ Restore (in case API fails)
  const restoreUser = useCallback((user: SuggestedUser, index = 0) => {
    setUsers((prev) => {
      if (prev.some((x) => x.id === user.id)) return prev;
      const copy = [...prev];
      copy.splice(Math.max(0, Math.min(index, copy.length)), 0, user);
      return copy;
    });
  }, []);

  return {
    users,
    loading,
    error,
    reload: load,
    removeUser,
    restoreUser,
  };
}
