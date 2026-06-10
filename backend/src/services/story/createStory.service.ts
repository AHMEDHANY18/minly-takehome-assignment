import { StoryRepository } from "../../repositories/story.repository";

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function createStoryService(params: {
  userId: string;
  url: string;
  type: "IMAGE" | "VIDEO";
}) {
  const { userId, url, type } = params;

  const story = await StoryRepository.create({
    userId,
    url,
    type,
    expiresAt: new Date(Date.now() + STORY_TTL_MS),
  });

  return { story };
}
