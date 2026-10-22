import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { toApiError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import { ToasterService } from '@app/core/services/toaster.service';
import { FeedSkeleton } from '@app/features/feed/feed-skeleton';
import { FeedSentinel } from '@app/features/feed/feed-sentinel';
import { FeedStore } from '@app/features/feed/feed-store';
import { ReviewCard } from '@app/features/feed/review-card';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';
import { DateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '@app/shared/ui/icon/icon';
import { ACCOUNT_STATUS_LABELS, ROLE_LABELS, reviewCountLabel } from '@app/shared/utils/format';
import { ProfileFeedStore } from './profile-feed-store';
import { ProfileStore } from './profile-store';

/**
 * Author page: header, own-profile actions and the author's reviews with an
 * infinite scroll that is independent from the main feed (`ProfileFeedStore`
 * is provided here, not at the root).
 */
@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Avatar,
    ConfirmDialog,
    DateFormatPipe,
    FeedSentinel,
    FeedSkeleton,
    Icon,
    ReviewCard,
    RouterLink,
    ScrollRail,
  ],
  providers: [ProfileFeedStore, ProfileStore],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly store = inject(ProfileStore);
  private readonly authorFeed = inject(ProfileFeedStore);
  private readonly feed = inject(FeedStore);
  private readonly title = inject(Title);
  private readonly toaster = inject(ToasterService);
  protected readonly auth = inject(AuthService);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('profilePanel');

  protected readonly profile = this.store.profile;
  protected readonly status = this.store.status;
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar este perfil agora.',
  );

  protected readonly posts = this.authorFeed.posts;
  protected readonly feedStatus = this.authorFeed.status;
  protected readonly hasNext = this.authorFeed.hasNext;
  protected readonly countLabel = computed(() => reviewCountLabel(this.authorFeed.totalElements()));
  protected readonly isOwn = computed(() => {
    const profile = this.profile();
    const user = this.auth.user();
    return !!profile && !!user && profile.id === user.id;
  });
  protected readonly roleLabel = computed(() => {
    const profile = this.profile();
    return profile ? ROLE_LABELS[profile.role] : '';
  });
  protected readonly statusLabel = computed(() => {
    const profile = this.profile();
    return profile ? ACCOUNT_STATUS_LABELS[profile.status] : '';
  });
  protected readonly feedErrorMessage = computed(
    () => this.authorFeed.error()?.message ?? 'Não foi possível carregar as reviews agora.',
  );

  protected readonly editOpen = signal(false);
  protected readonly editName = signal('');
  protected readonly editAvatar = signal('');
  protected readonly editSaving = signal(false);
  protected readonly editError = signal('');
  protected readonly editValid = computed(() => {
    const name = this.editName().trim();
    return name.length >= 3 && name.length <= 50 && this.editAvatar().trim().length <= 500;
  });
  protected readonly editUnchanged = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return true;
    }

    return (
      this.editName().trim() === profile.username &&
      this.editAvatar().trim() === (profile.avatarUrl ?? '')
    );
  });
  protected readonly editDisabled = computed(
    () => !this.editValid() || this.editUnchanged() || this.editSaving(),
  );

  constructor() {
    effect(() => {
      const id = this.id();
      // The stores write signals; keep this effect tied to the route only.
      untracked(() => {
        this.store.load(id);
        this.authorFeed.load(id);
      });
    });

    effect(() => {
      const profile = this.profile();
      if (profile) {
        this.title.setTitle(`${profile.username} · ReviewIt`);
      }
    });
  }

  protected retryProfile(): void {
    this.store.retry();
  }

  protected loadMore(): void {
    this.authorFeed.loadMore();
  }

  protected retryFeed(): void {
    this.authorFeed.retry();
  }

  protected openEdit(): void {
    const profile = this.profile();

    if (!profile) {
      return;
    }

    this.editName.set(profile.username);
    this.editAvatar.set(profile.avatarUrl ?? '');
    this.editError.set('');
    this.editOpen.set(true);
  }

  protected closeEdit(): void {
    if (!this.editSaving()) {
      this.editOpen.set(false);
    }
  }

  protected onNameInput(event: Event): void {
    this.editName.set((event.target as HTMLInputElement).value);
  }

  protected onAvatarInput(event: Event): void {
    this.editAvatar.set((event.target as HTMLInputElement).value);
  }

  protected saveEdit(): void {
    const profile = this.profile();

    if (!profile || this.editDisabled()) {
      return;
    }

    const avatarUrl = this.editAvatar().trim();
    this.editError.set('');
    this.editSaving.set(true);

    this.store
      .update(profile.id, { username: this.editName().trim(), avatarUrl: avatarUrl || null })
      .subscribe({
        next: (updated) => {
          this.editSaving.set(false);
          this.editOpen.set(false);
          this.store.apply(updated);
          this.auth.applyProfile(updated);
          // Card authors and the detail byline come from cached pages.
          this.feed.markStale();
          this.authorFeed.reload();
          this.toaster.success('Perfil atualizado.');
        },
        error: (error: unknown) => {
          this.editSaving.set(false);
          const apiError = toApiError(error);
          this.editError.set(apiError.fieldErrors['username'] ?? apiError.message);
        },
      });
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
