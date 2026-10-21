import { Pipe, PipeTransform } from '@angular/core';
import {
  ACCOUNT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  DELIVERY_CHANNEL_LABELS,
  GENRE_LABELS,
  MODERATION_ACTION_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFY_CHANNEL_LABELS,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
} from '@app/shared/utils/format';

export type EnumLabelKind =
  | 'contentType'
  | 'genre'
  | 'notifyChannel'
  | 'role'
  | 'accountStatus'
  | 'notificationType'
  | 'deliveryChannel'
  | 'reportStatus'
  | 'moderationAction';

const LABELS: Record<EnumLabelKind, Record<string, string>> = {
  contentType: CONTENT_TYPE_LABELS,
  genre: GENRE_LABELS,
  notifyChannel: NOTIFY_CHANNEL_LABELS,
  role: ROLE_LABELS,
  accountStatus: ACCOUNT_STATUS_LABELS,
  notificationType: NOTIFICATION_TYPE_LABELS,
  deliveryChannel: DELIVERY_CHANNEL_LABELS,
  reportStatus: REPORT_STATUS_LABELS,
  moderationAction: MODERATION_ACTION_LABELS,
};

/** Translates backend enum values to their pt-BR labels. */
@Pipe({
  name: 'enumLabel',
})
export class EnumLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, kind: EnumLabelKind): string {
    if (!value) {
      return '';
    }

    return LABELS[kind][value] ?? value;
  }
}
