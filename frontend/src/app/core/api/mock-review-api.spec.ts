import { firstValueFrom } from 'rxjs';
import { MockReviewApi } from './mock-review-api';

const noLatency = { min: 0, max: 0 };

describe('MockReviewApi', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('paginates the deterministic dataset into four pages', async () => {
    const api = new MockReviewApi(noLatency);
    const page = await firstValueFrom(api.listPosts({ page: 0, pageSize: 12 }));

    expect(page.content).toHaveLength(12);
    expect(page.totalElements).toBe(48);
    expect(page.totalPages).toBe(4);
    expect(page.hasNext).toBe(true);

    const last = await firstValueFrom(api.listPosts({ page: 3, pageSize: 12 }));
    expect(last.content).toHaveLength(12);
    expect(last.hasNext).toBe(false);
  });

  it('filters the whole dataset by type, genre and query', async () => {
    const api = new MockReviewApi(noLatency);
    const byType = await firstValueFrom(api.listPosts({ page: 0, pageSize: 50, contentType: 'Game' }));
    expect(byType.content.length).toBeGreaterThan(0);
    expect(byType.content.every((post) => post.contentType === 'Game')).toBe(true);

    const searched = await firstValueFrom(api.listPosts({ page: 0, pageSize: 50, q: 'silenciosa' }));
    expect(searched.content.length).toBeGreaterThan(0);
  });

  it('sorts popular posts by like count', async () => {
    const api = new MockReviewApi(noLatency);
    const page = await firstValueFrom(api.listPosts({ page: 0, pageSize: 12, sort: 'popular' }));
    const counts = page.content.map((post) => post.likeCount);

    expect([...counts].sort((left, right) => right - left)).toEqual(counts);
  });

  it('persists likes across instances', async () => {
    const api = new MockReviewApi(noLatency);
    const page = await firstValueFrom(api.listPosts({ page: 0, pageSize: 1 }));
    const post = page.content[0];

    expect(post).toBeDefined();
    const before = post?.likedByMe ?? false;

    const result = await firstValueFrom(api.togglePostLike(post!.id));
    expect(result.liked).toBe(!before);

    const reloaded = new MockReviewApi(noLatency);
    const persisted = await firstValueFrom(reloaded.getPost(post!.id));
    expect(persisted.likedByMe).toBe(!before);
  });

  it('creates comments and updates the post counter', async () => {
    const api = new MockReviewApi(noLatency);
    const page = await firstValueFrom(api.listPosts({ page: 0, pageSize: 1 }));
    const post = page.content[0]!;
    const before = post.commentCount;

    const created = await firstValueFrom(api.createComment(post.id, { content: 'Primeiro!' }));
    expect(created.content).toBe('Primeiro!');

    const updated = await firstValueFrom(api.getPost(post.id));
    expect(updated.commentCount).toBe(before + 1);
  });

  it('fails with a mapped 404 for unknown posts', async () => {
    const api = new MockReviewApi(noLatency);

    await expect(firstValueFrom(api.getPost('missing'))).rejects.toMatchObject({
      status: 404,
      title: 'Não encontrado',
    });
  });
});
