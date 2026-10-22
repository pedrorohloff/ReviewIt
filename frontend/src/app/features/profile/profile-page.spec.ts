import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { AuthService } from '@app/core/auth/auth.service';
import { DEMO_USER } from '@app/core/auth/demo-user';
import { ListPostsParams, Post, PostPage } from '@app/core/models/post';
import { Profile, ProfileInput } from '@app/core/models/profile';
import { ProfilePage } from './profile-page';
import { PROFILE_PAGE_SIZE } from './profile-feed-store';

const AUTHOR_ID = '10000000-0000-4000-8000-000000000002';
const OWN_ID = DEMO_USER.id;

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: AUTHOR_ID,
    username: 'João Lima',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    suspendedUntil: null,
    createdAt: '2026-01-15T12:00:00Z',
    ...overrides,
  };
}

function makePost(index: number, authorId = AUTHOR_ID): Post {
  return {
    id: `post-${index}`,
    author: { id: authorId, username: 'João Lima', avatarUrl: null },
    title: `Review ${index}`,
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo da review.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: index,
    commentCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Ten posts: one page of eight plus a second page of two. */
function makePages(posts: Post[], params: ListPostsParams) {
  const size = Math.min(params.pageSize ?? PROFILE_PAGE_SIZE, PROFILE_PAGE_SIZE);
  const start = (params.page ?? 0) * size;
  const content = posts.slice(start, start + size);

  return of({
    content,
    totalElements: posts.length,
    totalPages: Math.ceil(posts.length / size),
    hasNext: start + content.length < posts.length,
  });
}

function setup(api: {
  getProfile?: (id: string) => Observable<Profile>;
  updateProfile?: (id: string, input: ProfileInput) => Observable<Profile>;
  listPosts?: (params: ListPostsParams) => Observable<PostPage>;
}) {
  const listPosts = vi.fn(
    api.listPosts ??
      (() =>
        of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          hasNext: false,
        })),
  );

  const updateProfile = vi.fn(
    api.updateProfile ??
      ((id: string, input: ProfileInput) =>
        of(makeProfile({ id, username: input.username, avatarUrl: input.avatarUrl }))),
  );

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: REVIEW_API,
        useValue: {
          getProfile: api.getProfile ?? (() => of(makeProfile())),
          updateProfile,
          listPosts,
          togglePostLike: () => of({ liked: true, likeCount: 1 }),
        } as unknown as ReviewApi,
      },
    ],
  });

  return {
    fixture: TestBed.createComponent(ProfilePage),
    listPosts,
    updateProfile,
  };
}

async function render(fixture: ComponentFixture<ProfilePage>, id: string): Promise<void> {
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 30));
  fixture.detectChanges();
}

function text(fixture: ComponentFixture<ProfilePage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function findButton(root: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(label),
  );
}

describe('ProfilePage', () => {
  it('renders the author header and paginates the author feed by eight', async () => {
    const posts = Array.from({ length: 10 }, (_, index) => makePost(index + 1));
    const { fixture, listPosts } = setup({
      getProfile: () => of(makeProfile()),
      listPosts: (params) => makePages(posts, params),
    });

    await render(fixture, AUTHOR_ID);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('João Lima');
    expect(text(fixture)).toContain('Entrou em 15 de janeiro de 2026');
    expect(text(fixture)).toContain('10 reviews');
    expect(element.querySelectorAll('app-review-card').length).toBe(8);
    expect(listPosts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, pageSize: PROFILE_PAGE_SIZE, authorId: AUTHOR_ID }),
    );
    expect(TestBed.inject(Title).getTitle()).toBe('João Lima · ReviewIt');

    findButton(element, 'Carregar mais reviews')?.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

    expect(element.querySelectorAll('app-review-card').length).toBe(10);
    expect(text(fixture)).toContain('Fim das reviews de João Lima.');
  });

  it('shows a friendly state when the profile does not exist', async () => {
    const { fixture } = setup({
      getProfile: () => throwError(() => new ApiError(404, 'Não encontrado', 'Perfil ausente.')),
    });

    await render(fixture, 'missing');

    expect(text(fixture)).toContain('Perfil não encontrado');
    expect(fixture.nativeElement.querySelector('.profile-head')).toBeNull();
  });

  it('only offers the edit action on the own profile', async () => {
    const { fixture } = setup({
      getProfile: () => of(makeProfile()),
    });

    await render(fixture, AUTHOR_ID);

    expect(findButton(fixture.nativeElement, 'Editar perfil')).toBeUndefined();
  });

  it('updates the own profile through the dialog and mirrors it in the session', async () => {
    const own = makeProfile({ id: OWN_ID, username: 'Maria Rohls', role: 'Admin' });
    const { fixture, updateProfile } = setup({
      getProfile: () => of(own),
      updateProfile: (id, input) =>
        of(makeProfile({ ...own, id, username: input.username, avatarUrl: input.avatarUrl })),
    });

    await render(fixture, OWN_ID);

    const element = fixture.nativeElement as HTMLElement;
    findButton(element, 'Editar perfil')?.click();
    fixture.detectChanges();

    const input = element.querySelector<HTMLInputElement>('#profile-username');
    expect(input).not.toBeNull();
    input!.value = 'Maria Atualizada';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    findButton(element, 'Salvar')?.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

    expect(updateProfile).toHaveBeenCalledWith(OWN_ID, {
      username: 'Maria Atualizada',
      avatarUrl: null,
    });
    expect(element.querySelector('h1')?.textContent).toContain('Maria Atualizada');
    expect(element.querySelector('#profile-username')).toBeNull();
    expect(TestBed.inject(AuthService).user()?.username).toBe('Maria Atualizada');
  });
});
