// import { api } from "./axios"; // نفس axios instance بتاعك

// export type PostDetails = {
//   id: string;
//   mediaUrl: string;
//   caption?: string;
//   createdAt?: string;

//   likesCount?: number;
//   isLiked?: boolean;
//   isBookmarked?: boolean;

//   uploader: {
//     id: string;
//     name: string;
//     avatarUrl?: string;
//     location?: string;
//   };

//   // optional: لو عندك /auth/me
//   me?: { avatarUrl?: string };
// };

// export type PostComment = {
//   id: string;
//   text: string;
//   createdAt?: string;
//   user: { id: string; name: string; avatarUrl?: string };
// };

// export const MediaAPI = {
//   async details(mediaId: string): Promise<PostDetails> {
//     const res = await api.get(`/v1/media/${mediaId}/details`);
//     return res.data?.data ?? res.data; // خليها مرنة
//   },

//   async comments(mediaId: string): Promise<PostComment[]> {
//     const res = await api.get(`/v1/media/${mediaId}/comments`);
//     return res.data?.data ?? res.data ?? [];
//   },

//   async addComment(mediaId: string, text: string): Promise<PostComment> {
//     const res = await api.post(`/v1/media/${mediaId}/comments`, { text });
//     return res.data?.data ?? res.data;
//   },

//   async like(mediaId: string) {
//     await api.post(`/v1/media/${mediaId}/like`);
//   },

//   async unlike(mediaId: string) {
//     await api.delete(`/v1/media/${mediaId}/like`);
//   },

//   async bookmark(mediaId: string) {
//     await api.post(`/v1/media/${mediaId}/bookmark`);
//   },

//   async unbookmark(mediaId: string) {
//     await api.delete(`/v1/media/${mediaId}/bookmark`);
//   },
// };
