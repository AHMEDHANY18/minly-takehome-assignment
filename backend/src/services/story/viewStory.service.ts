import { StoryRepository } from "../../repositories/story.repository";

export async function viewStoryService(params: {
  storyId: string;
  viewerId: string;
}) {
  const { storyId, viewerId } = params;

  const story = await StoryRepository.findById(storyId);
  if (!story || story.expiresAt <= new Date()) {
    const err: any = new Error("Story not found");
    err.status = 404;
    throw err;
  }

  // own stories are never marked viewed
  if (story.userId !== viewerId) {
    await StoryRepository.upsertView(storyId, viewerId);
  }

  return { storyId, viewed: true };
}
