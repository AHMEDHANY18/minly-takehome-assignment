import { StoryRepository } from "../../repositories/story.repository";

export async function getStoryViewersService(params: {
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

  const rows = await StoryRepository.listViewers(storyId);

  const viewers = rows.map((row) => ({
    id: row.viewer.id,
    name: row.viewer.name,
    avatarUrl: row.viewer.avatarUrl,
    viewedAt: row.createdAt,
  }));

  return { viewers, count: viewers.length };
}
