import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { DEMO_USER } from '@app/core/auth/demo-user';
import { Notification, NotificationPage } from '@app/core/models/notification';
import { Post } from '@app/core/models/post';
import { ToasterService } from '@app/core/services/toaster.service';
import { NotificationStore } from './notification-store';

function makeNotification(index: number, overrides: Partial<Notification> = {}): Notification {
  return {
    id: `notification-${index}`,
    userId: DEMO_USER.id,
    postId: `post-${index}`,
    type: index % 2 === 0 ? 'New Comment' : 'Like Milestone',
    channel: 'In-App',
    readAt: null,
    ...overrides,
  };
}

function makePage(notifications: Notification[], hasNext = false): NotificationPage {
  return {
    notifications,
    totalElements: notifications.length + (hasNext ? 10 : 0),
    totalPages: hasNext ? 2 : 1,
    hasNext,
  };
}

function makePost(id: string): Post {
  return {
    id,
    author: { id: DEMO_USER.id, username: DEMO_USER.username, avatarUrl: null },
    title: `Título de ${id}`,
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function setup(api: {
  listNotifications?: (page: number, pageSize: number) => Observable<NotificationPage>;
  markNotificationRead?: (id: string) => Observable<void>;
}) {
  const listNotifications = vi.fn(
    api.listNotifications ??
      ((page: number) =>
        of(
          page === 0
            ? makePage([makeNotification(1), makeNotification(2)], true)
            : makePage([makeNotification(3)]),
        )),
  );
  const markNotificationRead = vi.fn(api.markNotificationRead ?? (() => of(undefined)));

  TestBed.configureTestingModule({
    providers: [
      NotificationStore,
      {
        provide: REVIEW_API,
        useValue: {
          listNotifications,
          markNotificationRead,
          getPost: (id: string) => of(makePost(id)),
        } as unknown as ReviewApi,
      },
    ],
  });

  return {
    store: TestBed.inject(NotificationStore),
    listNotifications,
    markNotificationRead,
  };
}

describe('NotificationStore', () => {
  it('loads a page with unread count and resolves the post titles', () => {
    const { store, listNotifications } = setup({});

    store.load();

    expect(listNotifications).toHaveBeenCalledWith(0, 10);
    expect(store.items().length).toBe(2);
    expect(store.unreadCount()).toBe(2);
    expect(store.hasNext()).toBe(true);
    expect(store.status()).toBe('ready');
    expect(store.titles().get('post-1')).toBe('Título de post-1');
  });

  it('appends the next page', () => {
    const { store, listNotifications } = setup({});

    store.load();
    store.loadMore();

    expect(listNotifications).toHaveBeenLastCalledWith(1, 10);
    expect(store.items().length).toBe(3);
    expect(store.status()).toBe('end');
  });

  it('marks a notification as read optimistically and keeps it after the ack', () => {
    const response = new Subject<void>();
    const { store, markNotificationRead } = setup({
      markNotificationRead: () => response.asObservable(),
    });

    store.load();
    const notification = store.items()[0]!;

    store.markRead(notification);

    expect(markNotificationRead).toHaveBeenCalledWith(notification.id);
    expect(store.items()[0]?.readAt).not.toBeNull();
    expect(store.unreadCount()).toBe(1);

    response.next();
    response.complete();

    expect(store.items()[0]?.readAt).not.toBeNull();
  });

  it('rolls the read state back and warns when the request fails', () => {
    const { store } = setup({
      markNotificationRead: () =>
        throwError(() => new ApiError(500, 'Erro no servidor', 'Falhou.')),
    });
    const toaster = TestBed.inject(ToasterService);

    store.load();
    const notification = store.items()[0]!;

    store.markRead(notification);

    expect(store.items()[0]?.readAt).toBeNull();
    expect(store.unreadCount()).toBe(2);
    expect(toaster.toasts().some((toast) => toast.kind === 'error')).toBe(true);
  });

  it('ignores a notification that is already read', () => {
    const { store, markNotificationRead } = setup({});

    store.load();
    const read = makeNotification(9, { readAt: '2026-01-01T00:00:00.000Z' });
    store.markRead(read);

    expect(markNotificationRead).not.toHaveBeenCalled();
  });
});
