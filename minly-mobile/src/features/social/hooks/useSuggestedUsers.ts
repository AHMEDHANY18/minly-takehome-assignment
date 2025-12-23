import { useEffect, useState } from "react";
import { SocialAPI, SuggestedUser } from "../api/social.api";

export function useSuggestedUsers(limit = 10) {
  const [items, setItems] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await SocialAPI.suggested(limit);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [limit]);

  async function toggleFollow(userId: string) {
    // ✅ optimistic update: شيل اليوزر فورًا
    setItems((prev) => prev.filter((u) => u.id !== userId));

    try {
      await SocialAPI.toggleFollow(userId);
    } catch (e) {
      // ❌ لو فشل رجّع الداتا
      load();
    }
  }

  return {
    items,
    loading,
    toggleFollow,
  };
}
