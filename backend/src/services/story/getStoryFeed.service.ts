import { FeedRepository } from "../../repositories/feed.repository";
import { StoryRepository } from "../../repositories/story.repository";

type StoryGroup = {
  user: { id: string; name: string; avatarUrl: string | null };
  stories: {
    id: string;
    url: string;
    type: "IMAGE" | "VIDEO";
    createdAt: Date;
    expiresAt: Date;
    viewed: boolean;
  }[];
  allViewed: boolean;
};

export async function getStoryFeedService(viewerId: string) {
  const followingIds = await FeedRepository.getFollowingIds(viewerId);

  const rows = await StoryRepository.findActiveForUsers(
    [viewerId, ...followingIds],
    viewerId
  );

  // group by user (rows are already ordered createdAt asc)
  const groupsByUser = new Map<string, StoryGroup>();

  for (const row of rows) {
    let group = groupsByUser.get(row.userId);
    if (!group) {
      group = { user: row.user, stories: [], allViewed: true };
      groupsByUser.set(row.userId, group);
    }

    const viewed = row.views.length > 0;
    if (!viewed) group.allViewed = false;

    group.stories.push({
      id: row.id,
      url: row.url,
      type: row.type,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      viewed,
    });
  }

  const latestStoryTime = (group: StoryGroup) =>
    new Date(group.stories[group.stories.length - 1].createdAt).getTime();

  const own = groupsByUser.get(viewerId);
  const others = Array.from(groupsByUser.values()).filter(
    (g) => g.user.id !== viewerId
  );

  // unviewed groups first, then viewed; newest story first within each bucket
  others.sort((a, b) => {
    if (a.allViewed !== b.allViewed) return a.allViewed ? 1 : -1;
    return latestStoryTime(b) - latestStoryTime(a);
  });

  // own group always FIRST
  const groups = own ? [own, ...others] : others;

  return { groups };
}
