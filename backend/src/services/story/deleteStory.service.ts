import { StoryRepository } from "../../repositories/story.repository";

export async function deleteStoryService(params: {
  storyId: string;
  userId: string;
}) {
  const { storyId, userId } = params;

  const story = await StoryRepository.findById(storyId);
  if (!story) {
    const err: any = new Error("Story not found");
    err.status = 404;
    throw err;
  }

  if (story.userId !== userId) {
    const err: any = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  await StoryRepository.deleteById(storyId);

  return { id: storyId, deleted: true };
}
