import { Injectable, signal } from '@angular/core';
import { Post } from '@app/core/models/post';

/** The post fields screens may change without a refetch. */
export type PostCounterPatch = Partial<Pick<Post, 'likeCount' | 'commentCount' | 'likedByMe'>>;

/**
 * Session-wide overrides for counts that change on one screen but must show
 * everywhere else (feed, detail, profile). Screens read posts through `merge`,
 * so a like on the detail page updates the feed card without a refetch.
 *
 * Overrides are not the source of truth: a fresh server row wins and calls
 * `sync`, which drops the override for the ids it brought.
 */
@Injectable({ providedIn: 'root' })
export class PostCacheService {
  private readonly overrides = signal<ReadonlyMap<string, PostCounterPatch>>(new Map());

  /** Applies the known overrides to a server row, preserving identity when empty. */
  merge(post: Post): Post {
    const patch = this.overrides().get(post.id);
    return patch ? { ...post, ...patch } : post;
  }

  patch(id: string, patch: PostCounterPatch): void {
    const next = new Map(this.overrides());
    next.set(id, { ...next.get(id), ...patch });
    this.overrides.set(next);
  }

  /** Lets server rows win by dropping the overrides they already resolved. */
  sync(posts: readonly Post[]): void {
    const current = this.overrides();

    if (current.size === 0 || posts.length === 0) {
      return;
    }

    const next = new Map(current);
    let changed = false;

    for (const post of posts) {
      if (next.delete(post.id)) {
        changed = true;
      }
    }

    if (changed) {
      this.overrides.set(next);
    }
  }

  reset(): void {
    if (this.overrides().size > 0) {
      this.overrides.set(new Map());
    }
  }
}
