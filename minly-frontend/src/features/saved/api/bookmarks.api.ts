import { api } from "@/shared/api/http";

export type SavedSort = "recent" | "oldest" | "popularity";
export type SavedType = "image" | "video";

export type SavedMedia = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: "IMAGE" | "VIDEO";
  title?: string | null;
  description?: string | null;
  createdAt: string;
  uploader?: { id: string; name: string; avatarUrl: string | null } | null;
};

export type ListSavedResponse = {
  status: "success";
  data: SavedMedia[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
};

export const BookmarksAPI = {
  list(params: { page: number; limit: number; sort?: SavedSort; type?: SavedType }) {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("limit", String(params.limit));
    if (params.sort) sp.set("sort", params.sort);
    if (params.type) sp.set("type", params.type);

    return api.get<ListSavedResponse>(`/bookmark?${sp.toString()}`);
  },
};
