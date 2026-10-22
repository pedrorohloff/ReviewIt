import { ProfileSummary } from './profile';

export type ContentType = 'Book' | 'Movie' | 'Album' | 'Game' | 'Series';
export type Genre = 'Action' | 'Romance' | 'Horror' | 'Comedy' | 'Drama';
export const NOTIFY_CHANNELS = ['None', 'In-App', 'Email', 'Both'] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];
export type SortOption = 'recent' | 'popular';

export interface Post {
  id: string;
  author: ProfileSummary;
  title: string;
  contentType: ContentType;
  genre: Genre;
  content: string;
  notifyEnabled: boolean;
  notifyChannel: NotifyChannel;
  likeCount: number;
  commentCount: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostPage {
  content: Post[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ListPostsParams {
  page: number;
  pageSize: number;
  q?: string;
  contentType?: ContentType;
  genre?: Genre;
  sort?: SortOption;
  authorId?: string;
}

export interface FeedFilters {
  q: string;
  contentType?: ContentType;
  genre?: Genre;
  sort: SortOption;
}

export interface PostInput {
  title: string;
  contentType: ContentType;
  genre: Genre;
  content: string;
}

export interface NotificationSettingsInput {
  notifyEnabled: boolean;
  notifyChannel: NotifyChannel;
}
