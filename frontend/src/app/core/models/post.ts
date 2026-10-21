export type ContentType = 'Book' | 'Movie' | 'Album' | 'Game';
export type Genre = 'Action' | 'Romance' | 'Horror' | 'Comedy' | 'Drama';
export type NotifyChannel = 'None' | 'In-App' | 'Email' | 'Both';

export interface ProfileSummary {
  id: string;
  username: string;
  avatarUrl: string | null;
}

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
  createdAt: string;
  updatedAt: string;
}
