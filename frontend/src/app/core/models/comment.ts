import { ProfileSummary } from './profile';

export interface Comment {
  id: string;
  postId: string;
  author: ProfileSummary;
  content: string;
  likeCount: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPage {
  comments: Comment[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface CommentInput {
  content: string;
}
