import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { toApiError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import {
  ContentType,
  Genre,
  NOTIFY_CHANNELS,
  NotifyChannel,
  Post,
  PostInput,
} from '@app/core/models/post';
import { ToasterService } from '@app/core/services/toaster.service';
import { FeedStore } from '@app/features/feed/feed-store';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '@app/shared/ui/icon/icon';
import {
  CONTENT_TYPE_LABELS,
  GENRE_LABELS,
  NOTIFY_CHANNEL_LABELS,
} from '@app/shared/utils/format';
import { PostStore } from './post-store';
import { ReviewDraft, ReviewPreview } from './review-preview';

/** Same limits as `PostRequestDTO` on the backend. */
const TITLE_MIN = 5;
const TITLE_MAX = 200;
const CONTENT_MIN = 10;
const CONTENT_MAX = 5000;

/** Rejects values that only contain whitespace, which `@NotBlank` rejects too. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim().length > 0 ? null : { blank: true };
}

type EditorForm = FormGroup<{
  title: FormControl<string>;
  contentType: FormControl<ContentType | null>;
  genre: FormControl<Genre | null>;
  content: FormControl<string>;
  notifyEnabled: FormControl<boolean>;
  notifyChannel: FormControl<NotifyChannel>;
}>;

/**
 * Create (`/new`) and edit (`/posts/:id/edit`) share this page: the `:id` input
 * picks the mode. Editing loads through `PostStore`, so a review opened from
 * the detail page is already on screen and the author check runs against the
 * session user before the form is usable.
 *
 * Notification settings travel separately: `POST`/`PUT` do not carry them, so
 * the page patches `/notification-settings` only when the switch or the
 * channel differs from what the server returned.
 */
@Component({
  selector: 'app-post-editor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, Icon, ReactiveFormsModule, ReviewPreview, RouterLink],
  templateUrl: './post-editor-page.html',
  styleUrl: './post-editor-page.css',
})
export class PostEditorPage {
  private readonly store = inject(PostStore);
  private readonly feed = inject(FeedStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toaster = inject(ToasterService);

  /** Bound from `:id`; absent on `/new`. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly post = this.store.post;
  protected readonly status = this.store.status;

  protected readonly form: EditorForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        notBlank,
        Validators.minLength(TITLE_MIN),
        Validators.maxLength(TITLE_MAX),
      ],
    }),
    contentType: new FormControl<ContentType | null>(null, { validators: Validators.required }),
    genre: new FormControl<Genre | null>(null, { validators: Validators.required }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        notBlank,
        Validators.minLength(CONTENT_MIN),
        Validators.maxLength(CONTENT_MAX),
      ],
    }),
    notifyEnabled: new FormControl(true, { nonNullable: true }),
    notifyChannel: new FormControl<NotifyChannel>('In-App', { nonNullable: true }),
  });

  protected readonly titleValue = toSignal(this.form.controls.title.valueChanges, {
    initialValue: '',
  });
  protected readonly contentValue = toSignal(this.form.controls.content.valueChanges, {
    initialValue: '',
  });
  protected readonly typeValue = toSignal(this.form.controls.contentType.valueChanges, {
    initialValue: null,
  });
  protected readonly genreValue = toSignal(this.form.controls.genre.valueChanges, {
    initialValue: null,
  });
  protected readonly notifyOn = toSignal(this.form.controls.notifyEnabled.valueChanges, {
    initialValue: true,
  });

  protected readonly titleLength = computed(() => this.titleValue().length);
  protected readonly contentLength = computed(() => this.contentValue().length);

  protected readonly draft = computed<ReviewDraft>(() => ({
    title: this.titleValue(),
    contentType: this.typeValue(),
    genre: this.genreValue(),
    content: this.contentValue(),
  }));

  protected readonly authorName = computed(() => this.auth.user()?.username ?? 'Você');
  protected readonly authorAvatar = computed(() => this.auth.user()?.avatarUrl ?? null);

  protected readonly forbidden = computed(() => {
    const post = this.post();
    const user = this.auth.user();
    return !!post && !!user && post.author.id !== user.id;
  });

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly deleteOpen = signal(false);
  protected readonly deleting = signal(false);
  private readonly serverErrors = signal<Readonly<Record<string, string>>>({});

  protected readonly saveLabel = computed(() => {
    if (this.saving()) {
      return this.isEdit() ? 'Salvando…' : 'Publicando…';
    }
    return this.isEdit() ? 'Salvar alterações' : 'Publicar';
  });

  protected readonly contentTypeOptions = Object.entries(CONTENT_TYPE_LABELS) as [
    ContentType,
    string,
  ][];
  protected readonly genreOptions = Object.entries(GENRE_LABELS) as [Genre, string][];
  protected readonly channelOptions = NOTIFY_CHANNELS.map(
    (channel) => [channel, NOTIFY_CHANNEL_LABELS[channel]] as const,
  );

  /** Marks the form as initialized so a refresh never overwrites the draft. */
  private initializedFor: string | null = null;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => {
        if (id) {
          this.store.load(id);
        }
      });
    });

    effect(() => {
      const post = this.post();
      const id = this.id();

      if (!post || !id || this.initializedFor === id) {
        return;
      }

      this.initializedFor = id;
      untracked(() => {
        this.form.setValue({
          title: post.title,
          contentType: post.contentType,
          genre: post.genre,
          content: post.content,
          notifyEnabled: post.notifyEnabled,
          notifyChannel: post.notifyChannel,
        });
        this.form.markAsPristine();
      });
    });

    // A channel only means something while notifications are on. Enabling and
    // disabling through the control (not the `disabled` attribute) keeps the
    // value in `getRawValue`, so turning it back on restores the choice.
    effect(() => {
      const enabled = this.notifyOn();
      const channel = this.form.controls.notifyChannel;

      if (enabled) {
        channel.enable({ emitEvent: false });
        return;
      }

      channel.disable({ emitEvent: false });
    });
  }

  /** Read by the `canDeactivate` guard. */
  canLeave(): boolean {
    return this.form.pristine || this.saving() || this.deleting();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.canLeave()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected showError(field: 'title' | 'content' | 'contentType' | 'genre'): boolean {
    if (this.serverErrors()[field]) {
      return true;
    }

    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  protected titleMessage(): string {
    return this.showError('title')
      ? this.messageFor('title', {
          blank: 'Informe um título.',
          required: 'Informe um título.',
          minlength: `O título precisa de pelo menos ${TITLE_MIN} caracteres.`,
          maxlength: `O título pode ter no máximo ${TITLE_MAX} caracteres.`,
        })
      : '';
  }

  protected contentMessage(): string {
    return this.showError('content')
      ? this.messageFor('content', {
          blank: 'Escreva sua review.',
          required: 'Escreva sua review.',
          minlength: `A review precisa de pelo menos ${CONTENT_MIN} caracteres.`,
          maxlength: `A review pode ter no máximo ${CONTENT_MAX} caracteres.`,
        })
      : '';
  }

  protected typeMessage(): string {
    return this.showError('contentType')
      ? this.messageFor('contentType', { required: 'Selecione o tipo.' })
      : '';
  }

  protected genreMessage(): string {
    return this.showError('genre') ? this.messageFor('genre', { required: 'Selecione o gênero.' }) : '';
  }

  protected toggleNotify(): void {
    const control = this.form.controls.notifyEnabled;
    control.setValue(!control.value);
    control.markAsDirty();
  }

  protected submit(): void {
    this.submitted.set(true);

    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const { contentType, genre } = value;

    if (!contentType || !genre) {
      return;
    }

    const input: PostInput = {
      title: value.title.trim(),
      contentType,
      genre,
      content: value.content.trim(),
    };

    this.serverErrors.set({});
    this.saving.set(true);

    const id = this.id();
    const request = id ? this.store.update(id, input) : this.store.create(input);

    request.subscribe({
      next: (post) => this.afterSave(post, value.notifyEnabled, value.notifyChannel),
      error: (error: unknown) => this.onSaveError(error),
    });
  }

  protected askDelete(): void {
    if (!this.saving()) {
      this.deleteOpen.set(true);
    }
  }

  protected cancelDelete(): void {
    if (!this.deleting()) {
      this.deleteOpen.set(false);
    }
  }

  protected confirmDelete(): void {
    const post = this.post();
    const id = this.id();

    if (!post || !id) {
      return;
    }

    this.deleting.set(true);

    this.store.delete(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.store.forget(id);
        this.feed.removePost(id);
        this.toaster.success('Review excluída.');
        this.form.markAsPristine();
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.toaster.error(toApiError(error).message);
      },
    });
  }

  protected goBack(): void {
    const state = this.location.getState() as { fromFeed?: boolean } | null;

    if (state?.fromFeed) {
      this.location.back();
      return;
    }

    const id = this.id();
    void this.router.navigate(id ? ['/posts', id] : ['/']);
  }

  protected retry(): void {
    this.store.retry();
  }

  private messageFor(
    field: 'title' | 'content' | 'contentType' | 'genre',
    messages: Record<string, string>,
  ): string {
    const server = this.serverErrors()[field];

    if (server) {
      return server;
    }

    const errors = this.form.controls[field].errors ?? {};
    const key = Object.keys(errors)[0];
    return (key && messages[key]) || 'Verifique este campo.';
  }

  /**
   * Patches the notification settings only when they differ from the saved
   * review. A failed patch must not hide the fact that the review itself was
   * saved, so it degrades to a toast and the detail page still opens.
   */
  private afterSave(post: Post, notifyEnabled: boolean, notifyChannel: NotifyChannel): void {
    if (post.notifyEnabled === notifyEnabled && post.notifyChannel === notifyChannel) {
      this.saving.set(false);
      this.finish(post);
      return;
    }

    this.store.saveNotificationSettings(post.id, { notifyEnabled, notifyChannel }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.finish(updated);
      },
      error: () => {
        this.saving.set(false);
        this.toaster.error('Review salva, mas as notificações não foram atualizadas.');
        this.finish(post);
      },
    });
  }

  private finish(post: Post): void {
    this.store.apply(post);
    this.feed.markStale();
    this.form.markAsPristine();
    void this.router.navigate(['/posts', post.id]);
  }

  private onSaveError(error: unknown): void {
    const apiError = toApiError(error);
    this.saving.set(false);

    if (Object.keys(apiError.fieldErrors).length > 0) {
      this.serverErrors.set(apiError.fieldErrors);
      this.form.markAllAsTouched();
      return;
    }

    this.toaster.error(
      apiError.status === 403 ? 'Você não tem permissão para alterar esta review.' : apiError.message,
    );
  }
}
