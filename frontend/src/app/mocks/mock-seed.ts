import { Comment } from '@app/core/models/comment';
import { Notification } from '@app/core/models/notification';
import { ContentType, Genre, NotifyChannel, Post } from '@app/core/models/post';
import { Profile } from '@app/core/models/profile';
import { ModerationAction, Report } from '@app/core/models/report';
import { DEMO_POSTS } from './fixtures';

export const MOCK_STATE_VERSION = 1;
export const MOCK_TOTAL_POSTS = 48;

export interface MockState {
  version: number;
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
  actions: ModerationAction[];
  profiles: Profile[];
  likedPostIds: string[];
  likedCommentIds: string[];
}

const BASE_DATE = Date.UTC(2026, 9, 21, 9, 30);
const PROFILE_CREATED = '2026-01-15T12:00:00Z';

const CONTENT_TYPES: readonly ContentType[] = ['Book', 'Movie', 'Album', 'Game'];
const GENRES: readonly Genre[] = ['Action', 'Romance', 'Horror', 'Comedy', 'Drama'];
const CHANNELS: readonly NotifyChannel[] = ['In-App', 'Email', 'None', 'Both'];

const ARTICLES = ['A', 'O', 'Uma', 'Um'] as const;
const ADJECTIVES = ['silenciosa', 'última', 'pequena', 'antiga', 'breve', 'eterna'] as const;
const NOUNS = ['cidade', 'estrada', 'memória', 'estação', 'história', 'noite', 'casa', 'distância'] as const;

const OPENERS = [
  'Comecei sem expectativa e terminei querendo conversar sobre.',
  'Reencontrei isto anos depois e mudou de lugar.',
  'Não é para todo mundo, e talvez seja por isso que funcione.',
  'Existe uma calma estranha aqui que eu não sabia que precisava.',
  'Li, ouvi e joguei em pedaços, sempre voltando pelo mesmo motivo.',
  'Tentei explicar para alguém e acabei entendendo melhor sozinho.',
  'A primeira metade me deixou desconfiado; a segunda me desarmou.',
  'Guardei para um fim de semana e foi a melhor decisão.',
] as const;

const MIDDLES = [
  'O ritmo respeita quem está prestando atenção: nada acontece cedo demais.',
  'As escolhas pequenas pesam mais do que a trama principal, e isso é um elogio.',
  'Tem uma economia de palavras que deixa cada cena respirar.',
  'A produção prefere sugerir a explicar, e o resultado é mais honesto.',
  'Os detalhes de cenário e som fazem um trabalho que o texto sozinho não faria.',
  'Em nenhum momento senti que estava sendo conduzido pela mão.',
  'A estrutura se dobra sobre si mesma sem virar confusão.',
  'É o tipo de obra que melhora quando você conta para outra pessoa.',
] as const;

const CLOSERS = [
  'Recomendo para quem gosta de terminar com uma pergunta na cabeça.',
  'Vale a experiência completa, do começo ao último minuto.',
  'Se você gosta de revisitar, este é daqueles que aguentam uma segunda vez.',
  'Não é leve, mas é generoso com quem vai até o fim.',
  'Fica na memória mais tempo do que o esperado.',
  'Uma boa porta de entrada para o gênero sem simplificar demais.',
] as const;

const COMMENT_TEXTS = [
  'Concordo com quase tudo, só mudaria o final.',
  'Boa resenha. Fiquei com vontade de conhecer.',
  'A parte do meio também foi a minha favorita.',
  'Discordo um pouco, mas entendo o ponto.',
  'Alguém sabe se tem continuação?',
  'Esse trecho descreve exatamente o que senti.',
  'Vou guardar para o fim de semana, obrigado.',
  'A comparação com som me pegou de surpresa.',
  'Reli o parágrafo duas vezes. Muito bom.',
  'Não esperava gostar tanto assim.',
] as const;

export const MOCK_PROFILES: Profile[] = [
  profile('10000000-0000-4000-8000-000000000001', 'Maria Rohls', 'Admin'),
  profile('10000000-0000-4000-8000-000000000002', 'João Lima', 'Regular'),
  profile('10000000-0000-4000-8000-000000000003', 'Lena Souza', 'Regular'),
  profile('10000000-0000-4000-8000-000000000004', 'Caio Reis', 'Regular'),
  profile('10000000-0000-4000-8000-000000000005', 'Bia Nunes', 'Moderator'),
  profile('10000000-0000-4000-8000-000000000006', 'Rafa Pires', 'Regular'),
  profile('10000000-0000-4000-8000-000000000007', 'Nina Torres', 'Regular'),
  profile('10000000-0000-4000-8000-000000000008', 'Tomás Ávila', 'Regular'),
];

export function buildMockState(): MockState {
  const posts = buildPosts();
  const comments = buildComments(posts);

  for (const post of posts) {
    post.commentCount = comments.filter((comment) => comment.postId === post.id).length;
  }

  const likedPostIds = posts.slice(0, 6).map((post) => post.id);
  for (const id of likedPostIds) {
    const post = posts.find((candidate) => candidate.id === id);
    if (post) {
      post.likeCount += 1;
    }
  }

  return {
    version: MOCK_STATE_VERSION,
    posts,
    comments,
    notifications: buildNotifications(posts),
    reports: buildReports(posts),
    actions: [],
    profiles: MOCK_PROFILES.map((item) => ({ ...item })),
    likedPostIds,
    likedCommentIds: comments.slice(0, 4).map((comment) => comment.id),
  };
}

export function saveMockState(state: MockState, storage: Storage | null): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem('reviewit:mock:v1', JSON.stringify(state));
  } catch {
    // Storage can be unavailable or full; the in-memory state still works.
  }
}

export function loadMockState(storage: Storage | null): MockState {
  if (storage) {
    try {
      const raw = storage.getItem('reviewit:mock:v1');
      if (raw) {
        const parsed = JSON.parse(raw) as MockState;
        if (parsed.version === MOCK_STATE_VERSION && Array.isArray(parsed.posts)) {
          return parsed;
        }
      }
    } catch {
      // Corrupted storage falls back to a fresh deterministic seed.
    }
  }

  const seeded = buildMockState();
  saveMockState(seeded, storage);
  return seeded;
}

function profile(id: string, username: string, role: Profile['role']): Profile {
  return {
    id,
    username,
    avatarUrl: null,
    role,
    status: 'Active',
    suspendedUntil: null,
    createdAt: PROFILE_CREATED,
  };
}

function buildPosts(): Post[] {
  const posts: Post[] = [];

  for (let index = 0; index < MOCK_TOTAL_POSTS; index += 1) {
    const fixture = DEMO_POSTS[index];
    posts.push(fixture ? cloneFixture(fixture) : buildGeneratedPost(index));
  }

  return posts;
}

function cloneFixture(source: Post): Post {
  return { ...source, author: { ...source.author } };
}

function buildGeneratedPost(index: number): Post {
  const authorProfile = pick(MOCK_PROFILES, index * 3 + 1);
  const contentType = pick(CONTENT_TYPES, index);
  const genre = pick(GENRES, index);
  const createdAt = new Date(BASE_DATE - index * 7 * 3_600_000).toISOString();
  const title = buildTitle(index);
  const content = index === 9 ? longContent() : buildContent(index, title, contentType, genre);

  return {
    id: postId(index),
    author: {
      id: authorProfile.id,
      username: authorProfile.username,
      avatarUrl: authorProfile.avatarUrl,
    },
    title: index === 10 ? longTitle() : title,
    contentType,
    genre,
    content,
    notifyEnabled: index % 3 !== 0,
    notifyChannel: pick(CHANNELS, index),
    likeCount: (index * 53 + 17) % 420,
    commentCount: 0,
    createdAt,
    updatedAt: createdAt,
  };
}

function buildTitle(index: number): string {
  const article = pick(ARTICLES, index);
  const adjective = pick(ADJECTIVES, Math.floor(index / ARTICLES.length));
  const noun = pick(NOUNS, Math.floor(index / (ARTICLES.length * ADJECTIVES.length)));

  return `${article} ${adjective} ${noun}`;
}

function buildContent(
  index: number,
  title: string,
  contentType: ContentType,
  genre: Genre,
): string {
  const opener = pick(OPENERS, index);
  const middle = pick(MIDDLES, index * 3);
  const closer = pick(CLOSERS, index * 5);
  const format = formatLabel(contentType);

  return `${opener} "${title}" é um ${format} de ${genre.toLowerCase()} que não tem pressa.\n\n${middle} O trabalho com ${pick(['som', 'imagem', 'texto', 'ritmo'], index)} sustenta a experiência inteira.\n\n${closer}`;
}

function longTitle(): string {
  return (
    'Um estudo longo sobre tudo o que costuma ficar de fora das resenhas apressadas ' +
    'e sobre o motivo pelo qual ainda vale escrever com calma sobre o que amamos'
  );
}

function longContent(): string {
  const sentence =
    'Esta review de estresse existe para provar que o layout aguenta um texto muito longo sem quebrar a grade, o clamp do card ou a leitura confortável. ';
  return sentence.repeat(30).slice(0, 5000);
}

function formatLabel(contentType: ContentType): string {
  switch (contentType) {
    case 'Book':
      return 'livro';
    case 'Movie':
      return 'filme';
    case 'Album':
      return 'álbum';
    default:
      return 'jogo';
  }
}

function buildComments(posts: Post[]): Comment[] {
  const comments: Comment[] = [];
  let counter = 0;

  posts.forEach((post, postIndex) => {
    const count = postIndex < 8 ? [12, 4, 2, 9, 3, 1, 5, 2][postIndex] ?? 2 : (postIndex * 5 + 2) % 6;

    for (let index = 0; index < count; index += 1) {
      counter += 1;
      const authorProfile = pick(MOCK_PROFILES, postIndex + index + 1);
      const createdAt = new Date(
        Date.parse(post.createdAt) + (index + 1) * 3_600_000,
      ).toISOString();

      comments.push({
        id: commentId(counter),
        postId: post.id,
        author: {
          id: authorProfile.id,
          username: authorProfile.username,
          avatarUrl: authorProfile.avatarUrl,
        },
        content: pick(COMMENT_TEXTS, postIndex + index * 3),
        likeCount: (postIndex * 7 + index * 13) % 24,
        createdAt,
        updatedAt: createdAt,
      });
    }
  });

  return comments;
}

function buildNotifications(posts: Post[]): Notification[] {
  const notifications: Notification[] = [];
  const total = 14;

  for (let index = 0; index < total && posts.length > 0; index += 1) {
    const post = posts[index % posts.length];

    if (!post) {
      continue;
    }

    notifications.push({
      id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      userId: MOCK_PROFILES[0]?.id ?? '',
      postId: post.id,
      type: index % 2 === 0 ? 'New Comment' : 'Like Milestone',
      channel: 'In-App',
      // Every fourth notification is already read, so the unread dot and the
      // "Marcar como lida" action both have something to show.
      readAt:
        index % 4 === 3 ? new Date(BASE_DATE - (index + 1) * 3_600_000).toISOString() : null,
    });
  }

  return notifications;
}

function buildReports(posts: Post[]): Report[] {
  const first = posts[0];
  const second = posts[1];

  return [
    {
      id: '50000000-0000-4000-8000-000000000001',
      reporterId: MOCK_PROFILES[1]?.id ?? '',
      postId: first?.id ?? null,
      commentId: null,
      reason: 'Conteúdo repetitivo e fora do tema da comunidade.',
      status: 'Pending',
    },
    {
      id: '50000000-0000-4000-8000-000000000002',
      reporterId: MOCK_PROFILES[2]?.id ?? '',
      postId: second?.id ?? null,
      commentId: null,
      reason: 'Possível divulgação sem relação com a review.',
      status: 'Pending',
    },
  ];
}

export function postId(index: number): string {
  return `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}

export function commentId(index: number): string {
  return `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

export function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function pick<T>(list: readonly T[], index: number): T {
  const item = list[Math.abs(index) % list.length];
  if (item === undefined) {
    throw new Error('Mock seed list is empty.');
  }

  return item;
}
