import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Notification, NotificationType } from '@app/core/models/notification';
import { Icon, IconName } from '@app/shared/ui/icon/icon';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';
import { NotificationStore } from './notification-store';

const TYPE_ICONS: Record<NotificationType, IconName> = {
  'New Comment': 'message',
  'Like Milestone': 'heart',
};

const TYPE_MESSAGES: Record<NotificationType, string> = {
  'New Comment': 'Novo comentário na sua review',
  'Like Milestone': 'Sua review atingiu um marco de curtidas',
};

/**
 * In-app notification center. Rows are marked as read optimistically; the
 * unread badge in the avatar menu is not implemented because the API exposes
 * no unread-count endpoint.
 */
@Component({
  selector: 'app-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink, ScrollRail],
  providers: [NotificationStore],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css',
})
export class NotificationsPage implements OnInit {
  private readonly store = inject(NotificationStore);
  private readonly title = inject(Title);

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('notificationsPanel');

  protected readonly skeletonRows = [1, 2, 3, 4, 5];
  protected readonly items = this.store.items;
  protected readonly status = this.store.status;
  protected readonly hasNext = this.store.hasNext;
  protected readonly titles = this.store.titles;
  protected readonly unreadCount = this.store.unreadCount;
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar as notificações agora.',
  );
  protected readonly countLabel = computed(() => {
    const total = this.store.totalElements();

    if (total === 0) {
      return '';
    }

    const noun = total === 1 ? 'notificação' : 'notificações';
    const unread = this.unreadCount();

    if (this.status() !== 'end' || unread === 0) {
      return `${total} ${noun}`;
    }

    return `${total} ${noun} · ${unread} ${unread === 1 ? 'não lida' : 'não lidas'}`;
  });

  ngOnInit(): void {
    this.title.setTitle('Notificações · ReviewIt');
    this.store.load();
  }

  protected loadMore(): void {
    this.store.loadMore();
  }

  protected retry(): void {
    this.store.retry();
  }

  protected markRead(notification: Notification): void {
    this.store.markRead(notification);
  }

  protected typeLabel(notification: Notification): string {
    return TYPE_MESSAGES[notification.type];
  }

  protected iconFor(notification: Notification): IconName {
    return TYPE_ICONS[notification.type];
  }

  protected postTitle(notification: Notification): string {
    return this.titles().get(notification.postId) ?? 'Ver review';
  }
}
