import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { DEMO_USER } from '@app/core/auth/demo-user';
import { Post, PostInput } from '@app/core/models/post';
import { ToasterService } from '@app/core/services/toaster.service';
import { FeedStore } from '@app/features/feed/feed-store';
import { PostEditorPage } from './post-editor-page';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    author: { id: DEMO_USER.id, username: DEMO_USER.username, avatarUrl: null },
    title: 'A casa que aprendi a habitar',
    contentType: 'Book',
    genre: 'Drama',
    content: 'Primeira linha.\n\nSegunda linha.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 148,
    commentCount: 2,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

interface ApiStubs {
  getPost?: (id: string) => Observable<Post>;
  createPost?: (input: PostInput) => Observable<Post>;
  updatePost?: (id: string, input: PostInput) => Observable<Post>;
  deletePost?: (id: string) => Observable<void>;
  updateNotificationSettings?: (id: string, input: unknown) => Observable<Post>;
}

function setup(stubs: ApiStubs = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideRouter([]),
      {
        provide: REVIEW_API,
        useValue: {
          getPost: () => of(makePost()),
          createPost: (input: PostInput) =>
            of(makePost({ ...input, id: 'created-1', notifyEnabled: true, notifyChannel: 'In-App' })),
          updatePost: (_id: string, input: PostInput) => of(makePost({ ...input })),
          deletePost: () => of(undefined),
          updateNotificationSettings: (id: string, input: Partial<Post>) =>
            of(makePost({ id, ...input })),
          ...stubs,
        } as unknown as ReviewApi,
      },
    ],
  });

  return TestBed.createComponent(PostEditorPage);
}

async function render(
  fixture: ComponentFixture<PostEditorPage>,
  id?: string,
): Promise<HTMLElement> {
  if (id) {
    fixture.componentRef.setInput('id', id);
  }

  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 20));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function text(element: HTMLElement): string {
  return element.textContent ?? '';
}

function fill(element: HTMLElement, selector: string, value: string): void {
  const control = element.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
  control.value = value;
  control.dispatchEvent(new Event('input'));
}

function choose(element: HTMLElement, selector: string, label: string): void {
  const select = element.querySelector(selector) as HTMLSelectElement;
  const option = Array.from(select.options).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!option) {
    throw new Error(`Option ${label} not found in ${selector}.`);
  }

  select.value = option.value;
  select.dispatchEvent(new Event('change'));
}

function button(element: HTMLElement, label: string): HTMLButtonElement {
  const found = Array.from(element.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );

  if (!found) {
    throw new Error(`Button ${label} not found.`);
  }

  return found;
}

function fillValidReview(element: HTMLElement): void {
  fill(element, '#review-title', 'Uma review completa');
  choose(element, '#review-type', 'Livro');
  choose(element, '#review-genre', 'Drama');
  fill(
    element,
    '#review-content',
    'Um texto longo o bastante para passar da validação mínima do formulário.',
  );
}

describe('PostEditorPage', () => {
  it('blocks an invalid publish and explains every empty field', async () => {
    const createPost = vi.fn((input: PostInput) => of(makePost({ ...input })));
    const fixture = setup({ createPost });
    const element = await render(fixture);

    expect(text(element)).toContain('Nova review');

    button(element, 'Publicar').click();
    fixture.detectChanges();

    expect(createPost).not.toHaveBeenCalled();
    expect(text(element)).toContain('Informe um título.');
    expect(text(element)).toContain('Escreva sua review.');
    expect(text(element)).toContain('Selecione o tipo.');
    expect(text(element)).toContain('Selecione o gênero.');
  });

  it('publishes a valid review and opens its detail page', async () => {
    const createPost = vi.fn((input: PostInput) => of(makePost({ ...input, id: 'created-1' })));
    const fixture = setup({ createPost });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const markStale = vi.spyOn(TestBed.inject(FeedStore), 'markStale');

    const element = await render(fixture);
    fillValidReview(element);
    fixture.detectChanges();

    button(element, 'Publicar').click();
    fixture.detectChanges();

    expect(createPost).toHaveBeenCalledWith({
      title: 'Uma review completa',
      contentType: 'Book',
      genre: 'Drama',
      content: 'Um texto longo o bastante para passar da validação mínima do formulário.',
    });
    expect(markStale).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/posts', 'created-1']);
  });

  it('patches the notification settings only when they changed', async () => {
    const createPost = vi.fn((input: PostInput) => of(makePost({ ...input, id: 'created-2' })));
    const updateNotificationSettings = vi.fn(() =>
      of(makePost({ notifyEnabled: true, notifyChannel: 'Email' })),
    );
    const fixture = setup({ createPost, updateNotificationSettings });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const element = await render(fixture);
    fillValidReview(element);
    choose(element, '#notify-channel', 'E-mail');
    fixture.detectChanges();

    button(element, 'Publicar').click();
    fixture.detectChanges();

    expect(updateNotificationSettings).toHaveBeenCalledWith('created-2', {
      notifyEnabled: true,
      notifyChannel: 'Email',
    });
  });

  it('skips the patch when the settings match the saved review', async () => {
    const updateNotificationSettings = vi.fn(() => of(makePost()));
    const fixture = setup({ updateNotificationSettings });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const element = await render(fixture);
    fillValidReview(element);
    fixture.detectChanges();

    button(element, 'Publicar').click();
    fixture.detectChanges();

    expect(updateNotificationSettings).not.toHaveBeenCalled();
  });

  it('turns the channel off together with the switch', async () => {
    const fixture = setup();
    const element = await render(fixture);
    const toggle = element.querySelector('[role="switch"]') as HTMLButtonElement;
    const channel = element.querySelector('#notify-channel') as HTMLSelectElement;

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(channel.disabled).toBe(false);

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(channel.disabled).toBe(true);
  });

  it('maps API field errors to the form controls', async () => {
    const createPost = vi.fn(() =>
      throwError(
        () =>
          new ApiError(400, 'Dados inválidos', 'Revise os campos.', {
            title: 'Já existe uma review com este título.',
          }),
      ),
    );
    const fixture = setup({ createPost });

    const element = await render(fixture);
    fillValidReview(element);
    fixture.detectChanges();

    button(element, 'Publicar').click();
    fixture.detectChanges();

    expect(text(element)).toContain('Já existe uma review com este título.');
  });

  it('loads an existing review and saves it with PUT', async () => {
    const updatePost = vi.fn((_id: string, input: PostInput) =>
      of(makePost({ ...input, notifyEnabled: false })),
    );
    const fixture = setup({
      getPost: () => of(makePost({ notifyEnabled: false })),
      updatePost,
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const element = await render(fixture, 'post-1');
    expect(text(element)).toContain('Editar review');

    const title = element.querySelector('#review-title') as HTMLInputElement;
    expect(title.value).toBe('A casa que aprendi a habitar');

    fill(element, '#review-title', 'Um novo título para a review');
    fixture.detectChanges();
    button(element, 'Salvar alterações').click();
    fixture.detectChanges();

    expect(updatePost).toHaveBeenCalledWith('post-1', {
      title: 'Um novo título para a review',
      contentType: 'Book',
      genre: 'Drama',
      content: 'Primeira linha.\n\nSegunda linha.',
    });
    expect(navigate).toHaveBeenCalledWith(['/posts', 'post-1']);
  });

  it('blocks the editor when the signed-in user is not the author', async () => {
    const fixture = setup({
      getPost: () => of(makePost({ author: { id: 'someone-else', username: 'joao', avatarUrl: null } })),
    });

    const element = await render(fixture, 'post-1');

    expect(text(element)).toContain('Você não pode editar esta review');
    expect(element.querySelector('form')).toBeNull();
  });

  it('asks before leaving with unsaved changes', async () => {
    const fixture = setup();
    const element = await render(fixture);
    const page = fixture.componentInstance;

    expect(page.canLeave()).toBe(true);

    fill(element, '#review-title', 'Rascunho');
    fixture.detectChanges();

    expect(page.canLeave()).toBe(false);
  });

  it('deletes the review after the confirmation', async () => {
    const deletePost = vi.fn(() => of(undefined));
    const fixture = setup({ deletePost });
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const element = await render(fixture, 'post-1');
    button(element, 'Excluir review').click();
    fixture.detectChanges();

    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Excluir esta review?');

    button(dialog, 'Excluir').click();
    fixture.detectChanges();

    expect(deletePost).toHaveBeenCalledWith('post-1');
    expect(navigateByUrl).toHaveBeenCalledWith('/');
    expect(TestBed.inject(ToasterService).toasts().at(-1)?.message).toBe('Review excluída.');
  });
});
