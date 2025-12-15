export type FeedMediaItem = {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    type: "IMAGE" | "VIDEO";
    title: string | null;
    description: string | null;
    uploaderId: string;
    likesCount: number;
    commentCount: number;
    createdAt: Date;

    uploader: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };

    likes: { id: string }[];
    bookmarks: { id: string }[];
  };
