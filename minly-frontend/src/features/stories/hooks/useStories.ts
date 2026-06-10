import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { StoriesAPI, type StoryGroup } from "../api/stories.api";

export function useStories() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await StoriesAPI.feed();
      setGroups(res.data.data.groups ?? []);
      setError(null);
    } catch (error) {
      setError(getErrorMessage(error, "Failed to load stories."));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await StoriesAPI.feed();
        if (!alive) return;
        setGroups(res.data.data.groups ?? []);
        setError(null);
      } catch (error) {
        if (!alive) return;
        setError(getErrorMessage(error, "Failed to load stories."));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** Mark a story viewed in local state (API call is done by the viewer). */
  const markViewedLocal = useCallback((storyId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (!g.stories.some((s) => s.id === storyId)) return g;
        const stories = g.stories.map((s) =>
          s.id === storyId ? { ...s, viewed: true } : s
        );
        return { ...g, stories, allViewed: stories.every((s) => s.viewed) };
      })
    );
  }, []);

  const postStory = useCallback(
    async (file: File) => {
      if (posting) return;
      setPosting(true);
      setError(null);
      try {
        await StoriesAPI.upload(file);
        await reload();
      } catch (error) {
        setError(getErrorMessage(error, "Failed to post your story."));
      } finally {
        setPosting(false);
      }
    },
    [posting, reload]
  );

  return { groups, loading, posting, error, reload, markViewedLocal, postStory };
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}
