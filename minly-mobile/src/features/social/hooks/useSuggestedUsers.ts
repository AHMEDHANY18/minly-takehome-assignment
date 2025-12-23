import { useCallback, useEffect, useState } from "react";
import { SocialAPI, type SuggestedUser } from "../api/social.api";

export function useSuggestedUsers(limit = 10) {
  const [items, setItems] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SocialAPI.suggested(limit);
      setItems(res);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchIt();
  }, [fetchIt]);

  const toggleFollow = useCallback(async (userId: string) => {
    setItems((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
      )
    );

    const current = items.find((x) => x.id === userId);
    const next = !(current?.isFollowing ?? false);

    try {
      if (next) await SocialAPI.follow(userId);
      else await SocialAPI.follow(userId);
    } catch {
      // rollback
      setItems((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
    }
  }, [items]);

  return { items, loading, refetch: fetchIt, toggleFollow };
}
