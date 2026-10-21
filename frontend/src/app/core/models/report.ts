export type ReportStatus = 'Pending' | 'Resolved';
export type ModerationActionType = 'Remove' | 'Warn' | 'Suspend' | 'Ban';

export interface Report {
  id: string;
  reporterId: string;
  postId: string | null;
  commentId: string | null;
  reason: string;
  status: ReportStatus;
}

export interface ReportPage {
  content: Report[];
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ReportInput {
  postId?: string;
  commentId?: string;
  reason: string;
}

export interface ModerationAction {
  reportId: string;
  moderatorId: string;
  targetUserId: string | null;
  actionType: ModerationActionType;
  durationDays: number | null;
}

export interface ModerationActionInput {
  actionType: ModerationActionType;
  durationDays?: number;
}
