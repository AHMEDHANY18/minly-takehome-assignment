import { useRef, useState } from "react";
import { useUserStore } from "@/shared/store/user.store";
import { useStories } from "../hooks/useStories";
import type { StoryGroup } from "../api/stories.api";
import StoryViewer from "./StoryViewer";

const MAX_STORY_SIZE_BYTES = 50 * 1024 * 1024;

export default function StoriesBar() {
  const me = useUserStore((s) => s.user);
  const { groups, loading, posting, error, reload, markViewedLocal, postStory } =
    useStories();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const ownIndex = me ? groups.findIndex((g) => g.user.id === me.id) : -1;
  const ownGroup = ownIndex >= 0 ? groups[ownIndex] : null;

  const onPickFile = (f: File) => {
    if (f.size > MAX_STORY_SIZE_BYTES) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return;
    postStory(f);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm px-3 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Your story tile */}
        <div className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
          <div className="relative">
            <button
              onClick={() => {
                if (ownGroup) setViewerIndex(ownIndex);
                else inputRef.current?.click();
              }}
              disabled={posting}
              className={[
                "h-16 w-16 rounded-full p-[2.5px] transition disabled:opacity-60",
                ownGroup
                  ? ownGroup.allViewed
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600"
                  : "bg-gray-200 dark:bg-gray-700",
              ].join(" ")}
              aria-label={ownGroup ? "View your story" : "Add a story"}
            >
              <span className="block h-full w-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                {me?.avatarUrl ? (
                  <img
                    src={me.avatarUrl}
                    alt={me.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="h-full w-full rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold">
                    {(me?.name?.[0] ?? "U").toUpperCase()}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={posting}
              className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-blue-600 text-white grid place-items-center border-2 border-white dark:border-gray-900 hover:bg-blue-700 transition disabled:opacity-60"
              aria-label="Add a story"
            >
              {posting ? (
                <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 5v14M5 12h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate w-full text-center">
            Your story
          </span>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.currentTarget.value = "";
            }}
          />
        </div>

        {/* Other groups (own group rendered via the tile above) */}
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 shrink-0 w-[68px] animate-pulse"
              >
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-2.5 w-12 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))
          : groups.map((g, i) =>
              i === ownIndex ? null : (
                <StoryCircle
                  key={g.user.id}
                  group={g}
                  onClick={() => setViewerIndex(i)}
                />
              )
            )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</div>
      )}

      {viewerIndex !== null && groups[viewerIndex] && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          meId={me?.id}
          onClose={() => setViewerIndex(null)}
          onViewed={markViewedLocal}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function StoryCircle({
  group,
  onClick,
}: {
  group: StoryGroup;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
      <button
        onClick={onClick}
        className={[
          "h-16 w-16 rounded-full p-[2.5px] transition hover:scale-[1.03]",
          group.allViewed
            ? "bg-gray-300 dark:bg-gray-600"
            : "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600",
        ].join(" ")}
        aria-label={`View ${group.user.name}'s story`}
      >
        <span className="block h-full w-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
          {group.user.avatarUrl ? (
            <img
              src={group.user.avatarUrl}
              alt={group.user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="h-full w-full rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center text-gray-700 dark:text-gray-200 font-semibold">
              {(group.user.name?.[0] ?? "U").toUpperCase()}
            </span>
          )}
        </span>
      </button>
      <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate w-full text-center">
        {group.user.name}
      </span>
    </div>
  );
}
