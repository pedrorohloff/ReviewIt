#!/usr/bin/env node
/**
 * Deterministic ReviewIt seed.
 *
 * Creates 1,000 community profiles, 5,000 reviews, 25,000 comments and a
 * plausible amount of likes. Every seeded row uses a `5eed...` UUID namespace,
 * so `--reset` can remove only what this script created. The real account and
 * any content written by real users are preserved.
 *
 * Fake profiles are `public.profiles` rows only: they are not Supabase Auth
 * users and cannot sign in. That is intentional; the seed exists to make the
 * community look alive, not to create credentials.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { WORKS } from './works.mjs';

const { Client } = pg;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const NOW = Date.now();

const PROFILE_COUNT = 1000;
const POST_COUNT = 5000;
const COMMENT_COUNT = 25_000;

const IDS = {
  profile: '5eed0000',
  post: '5eed1000',
  comment: '5eed2000',
  postLike: '5eed3000',
  commentLike: '5eed4000',
};

const TYPE_LABELS = {
  Book: 'livro',
  Movie: 'filme',
  Album: 'álbum',
  Series: 'série',
  Game: 'jogo',
};

const TYPE_PHRASES = {
  Book: 'um livro',
  Movie: 'um filme',
  Album: 'um álbum',
  Series: 'uma série',
  Game: 'um jogo',
};

const GENRE_LABELS = {
  Action: 'ação',
  Romance: 'romance',
  Horror: 'terror',
  Comedy: 'comédia',
  Drama: 'drama',
};

const TYPE_NOUNS = {
  Book: ['capítulos', 'páginas', 'frases', 'silêncios'],
  Movie: ['cenas', 'planos', 'cortes', 'enquadramentos'],
  Album: ['faixas', 'arranjos', 'refrões', 'produções'],
  Series: ['episódios', 'temporadas', 'arcos', 'ganchos'],
  Game: ['áreas', 'mecânicas', 'mapas', 'sistemas'],
};

const FIRST_NAMES = [
  'Ana',
  'André',
  'Beatriz',
  'Bruno',
  'Camila',
  'Carla',
  'Daniel',
  'Diego',
  'Eduarda',
  'Felipe',
  'Fernanda',
  'Gabriel',
  'Gabriela',
  'Gustavo',
  'Helena',
  'Henrique',
  'Isabela',
  'João',
  'Juliana',
  'Larissa',
  'Leonardo',
  'Letícia',
  'Lucas',
  'Manuela',
  'Marcos',
  'Mariana',
  'Mateus',
  'Nathália',
  'Otávio',
  'Patrícia',
  'Paulo',
  'Rafael',
  'Raquel',
  'Renata',
  'Rodrigo',
  'Sofia',
  'Thaís',
  'Thiago',
  'Vinícius',
  'Vitória',
];

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Pereira',
  'Costa',
  'Rodrigues',
  'Almeida',
  'Nascimento',
  'Lima',
  'Araújo',
  'Fernandes',
  'Carvalho',
  'Gomes',
  'Martins',
  'Rocha',
  'Ribeiro',
  'Alves',
  'Monteiro',
  'Mendes',
  'Barbosa',
  'Freitas',
  'Ramos',
  'Cardoso',
  'Teixeira',
];

const TITLE_TEMPLATES = [
  (work) => `${work.title}: o que fica depois do fim`,
  (work) => `${work.title} — uma obra para revisitar`,
  (work) => `Por que ${work.title} ainda funciona`,
  (work) => `${work.title}: ${work.creator} no seu melhor`,
  (work) => `O que ${work.title} me ensinou sobre ${GENRE_LABELS[work.genre]}`,
  (work) => `${work.title} não é para todo mundo`,
  (work) => `Uma segunda chance para ${work.title}`,
  (work) => `${work.title}, ${work.year}: uma experiência completa`,
  (work) => `Entre o hype e a obra: ${work.title}`,
  (work) => `${work.title}: o detalhe que muda tudo`,
  (work) => `Terminei ${work.title} e precisei escrever`,
  (work) => `${work.title} e a arte de não explicar tudo`,
];

const OPENERS = [
  (work, kind) =>
    `"${work.title}" não pede pressa. É ${kind} que ganha com atenção, e cada reencontro com a obra revela uma camada que eu tinha deixado passar.`,
  (work) =>
    `Cheguei a "${work.title}" sem saber bem o que esperar. Saí com a sensação de que precisava de alguns dias antes de conseguir falar sobre.`,
  (work) =>
    `Tem obra que a gente termina e esquece. "${work.title}" fez o contrário: ficou rondando as conversas seguintes.`,
  (work) =>
    `A primeira coisa que notei em "${work.title}" foi o controle do ritmo. Nada parece apressado, mas também não sobra espaço para o acaso.`,
  (work) =>
    `Eu estava evitando "${work.title}" por causa da reputação. Agora entendo o barulho, e também entendo por que ele incomoda tanta gente.`,
  (work) =>
    `"${work.title}" é daquelas obras que não entregam tudo de uma vez. A recompensa vem de aceitar o tempo que ela propõe.`,
  (work) =>
    `Comecei "${work.title}" com uma expectativa muito específica e terminei com outra completamente diferente. Esse deslocamento é o melhor elogio que posso fazer.`,
  (work, kind) =>
    `Existe uma diferença entre ${kind} competente e ${kind} que fica com você. "${work.title}" pertence ao segundo grupo.`,
  (work) =>
    `O que me fez ficar em "${work.title}" não foi a trama, mas a forma como ela trata os detalhes pequenos.`,
  (work) =>
    `Não sei se todo mundo vai gostar de "${work.title}", mas tenho dificuldade de imaginar alguém saindo indiferente.`,
  (work) =>
    `"${work.title}" chegou com uma reputação enorme e mesmo assim conseguiu me surpreender em alguns pontos.`,
  (work, kind) =>
    `Terminei "${work.title}" querendo conversar sobre ${kind} que não tenta agradar a todo custo. É uma experiência mais interessante por isso.`,
];

const MIDDLES = [
  (work) =>
    `A mão de ${work.creator} aparece menos na superfície e mais nas decisões de estrutura. É ali que a obra encontra o próprio tom.`,
  (work) =>
    `Lançada em ${work.year}, a obra conversa com o seu tempo sem ficar presa a ele. Isso ajuda a explicar por que ainda funciona hoje.`,
  (work, _kind, genre) =>
    `O recorte de ${genre} é usado com respeito: não vira rótulo, nem desculpa para repetir fórmulas.`,
  (work, _kind, _genre, noun) =>
    `Os ${noun} fazem um trabalho silencioso. Quando você percebe, já está dentro da lógica da obra.`,
  (work) =>
    `A estrutura é mais generosa do que parece no começo. Cada parte entrega uma informação que só faz sentido depois.`,
  (work) =>
    `O que mais sustenta "${work.title}" é a coerência entre o que a obra promete e o que ela entrega.`,
  (work) =>
    `Há um cuidado com o tempo que hoje é raro. As pausas não são vazias; elas também contam a história.`,
  (work) =>
    `Em vez de explicar cada escolha, ${work.creator} confia no repertório de quem está do outro lado.`,
  (work) =>
    `A obra não tem medo de deixar algumas perguntas abertas. Para mim, esse é um dos seus maiores acertos.`,
  (work) =>
    `A comparação mais óbvia não dá conta de "${work.title}". Ela pede uma leitura menos apressada.`,
  (work) =>
    `Quando você volta ao começo depois do final, várias cenas mudam de peso. Isso mostra que a construção foi pensada.`,
  (work) =>
    `O acabamento não é ostensivo, mas está lá: no som, no corte, na escolha de uma palavra ou no jeito de conduzir o olhar.`,
];

const CLOSERS = [
  (work) =>
    `Recomendo "${work.title}" para quem gosta de terminar com uma pergunta na cabeça, não com todas as respostas.`,
  (work) =>
    `Vale a experiência completa, do começo ao último minuto. "${work.title}" é daquelas obras que merecem o tempo que pedem.`,
  (work) =>
    `Se você gosta de revisitar, este é o tipo de obra que aguenta uma segunda vez. Voltei e encontrei outras coisas.`,
  (work) =>
    `Não é leve, mas é generoso com quem vai até o fim. "${work.title}" fica na memória mais tempo do que o esperado.`,
  (work) =>
    `É uma boa porta de entrada para o gênero sem simplificar demais. Se estiver em dúvida, comece por aqui.`,
  (work) =>
    `"${work.title}" não vai agradar em unanimidade, e tudo bem. A conversa que ela provoca já justifica a experiência.`,
  (work) =>
    `Sai querendo indicar para pessoas específicas, e acho que essa é a melhor medida de uma obra que funciona.`,
  (work) =>
    `Fiquei com a impressão de que ainda vou pensar em "${work.title}" por um tempo. Recomendo sem ressalvas.`,
  (work) =>
    `Se a proposta te parece estranha, dê uma chance. A obra sabe exatamente o que está fazendo.`,
  (work) =>
    `Termino esta review com a certeza de que "${work.title}" merece mais do que uma leitura de superfície.`,
];

const COMMENT_TEMPLATES = [
  (work) => `Boa resenha. Fiquei com vontade de revisitar ${work.title}.`,
  () => 'Concordo com quase tudo, só mudaria o final.',
  (work) => `A parte sobre ${work.creator} foi a que mais me pegou.`,
  () => 'Discordo um pouco do ponto sobre o ritmo, mas entendo.',
  (work) => `Alguém sabe se ${work.title} tem continuação?`,
  () => 'Esse trecho descreve exatamente o que senti.',
  () => 'Vou guardar para o fim de semana, obrigado pela resenha.',
  () => 'Não esperava gostar tanto assim.',
  (work) => `A comparação com ${work.title} ficou perfeita.`,
  () => 'Você escreveu o que eu não conseguia formular.',
  () => 'Li a resenha antes de terminar a obra e me arrependi um pouco.',
  (work) => `Voltei só para reler o parágrafo sobre ${work.creator}.`,
  () => 'Para mim, a melhor parte foi outra, mas ótimo texto.',
  () => 'Esse tipo de review faz falta por aqui.',
  () => 'Já coloquei na lista. Depois volto para dizer o que achei.',
  () => 'Concordo, mas acho que a obra merece uma segunda leitura.',
  () => 'A resenha é melhor que muitas análises profissionais.',
  () => 'Você tocou no ponto que ninguém comenta.',
  () => 'Boa. Só senti falta de falar mais sobre o final.',
  () => 'Passando só para dizer que essa resenha me convenceu.',
];

function mulberry32(seed) {
  let value = seed >>> 0;

  return function next() {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0x5eed2026);

function randomInt(max) {
  return Math.floor(rng() * max);
}

function pick(items) {
  return items[randomInt(items.length)];
}

function pickTwo(items) {
  const first = pick(items);
  let second = pick(items);

  while (second === first) {
    second = pick(items);
  }

  return [first, second];
}

function uuid(namespace, index) {
  return `${namespace}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function timestamp(ms) {
  return new Date(ms).toISOString().replace('T', ' ').replace('Z', '');
}

function truncate(value, max) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
}

function buildProfiles(existingUsernames) {
  const taken = new Set(existingUsernames.map((username) => username.toLowerCase()));
  const profiles = [];

  for (let index = 0; index < PROFILE_COUNT; index += 1) {
    const id = uuid(IDS.profile, index + 1);
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
    const base = slug(`${first}.${last}`).slice(0, 50);
    let username = base;
    let suffix = 1;

    while (taken.has(username)) {
      suffix += 1;
      username = `${base.slice(0, 50 - String(suffix).length - 1)}-${suffix}`;
    }

    taken.add(username);

    const createdAtMs =
      NOW - (900 + randomInt(700)) * DAY - randomInt(DAY) - randomInt(60) * MINUTE;

    profiles.push({
      id,
      username,
      createdAtMs,
      row: [
        id,
        username,
        null,
        'Regular',
        'Active',
        null,
        timestamp(createdAtMs),
        true,
      ],
    });
  }

  return profiles;
}

function buildPostTitle(work) {
  return truncate(pick(TITLE_TEMPLATES)(work), 200);
}

function buildReviewContent(work) {
  const kind = TYPE_PHRASES[work.type];
  const genre = GENRE_LABELS[work.genre];
  const nouns = TYPE_NOUNS[work.type];
  const [middleA, middleB] = pickTwo(MIDDLES);

  return [
    pick(OPENERS)(work, kind),
    middleA(work, kind, genre, pick(nouns)),
    middleB(work, kind, genre, pick(nouns)),
    pick(CLOSERS)(work),
  ].join('\n\n');
}

function buildPosts(profileIds) {
  const posts = [];

  for (let index = 0; index < POST_COUNT; index += 1) {
    const work = WORKS[index % WORKS.length];
    const id = uuid(IDS.post, index + 1);
    const authorId = profileIds[randomInt(profileIds.length)];

    // Bias towards recent dates so the feed changes every time the page loads,
    // while still spreading 5,000 reviews over roughly 18 months.
    const daysAgo = Math.floor(Math.pow(rng(), 1.7) * 540);
    const minutesAgo = randomInt(24 * 60);
    const createdAtMs = NOW - daysAgo * DAY - minutesAgo * MINUTE;
    const updatedAtMs = Math.min(
      NOW,
      createdAtMs + randomInt(3 * 24 * 60) * MINUTE,
    );
    const notifyEnabled = rng() < 0.65;
    const notifyChannel = notifyEnabled ? pick(['In-App', 'Email', 'Both']) : 'None';

    posts.push({
      id,
      authorId,
      work,
      createdAtMs,
      row: [
        id,
        authorId,
        buildPostTitle(work),
        work.type,
        work.genre,
        buildReviewContent(work),
        notifyEnabled,
        notifyChannel,
        timestamp(createdAtMs),
        timestamp(updatedAtMs),
      ],
    });
  }

  return posts;
}

function buildComments(posts, profileIds) {
  const comments = [];

  for (let index = 0; index < COMMENT_COUNT; index += 1) {
    const post = posts[randomInt(posts.length)];
    let authorId = profileIds[randomInt(profileIds.length)];

    if (authorId === post.authorId) {
      authorId = profileIds[(profileIds.indexOf(authorId) + 1) % profileIds.length];
    }

    const maxDelta = Math.max(MINUTE, Math.min(30 * DAY, NOW - post.createdAtMs));
    const createdAtMs = Math.min(
      NOW,
      post.createdAtMs + MINUTE + randomInt(maxDelta),
    );
    const id = uuid(IDS.comment, index + 1);

    comments.push({
      id,
      postId: post.id,
      authorId,
      createdAtMs,
      row: [
        id,
        post.id,
        authorId,
        pick(COMMENT_TEMPLATES)(post.work),
        timestamp(createdAtMs),
        timestamp(createdAtMs),
      ],
    });
  }

  return comments;
}

function postLikeTarget() {
  const roll = rng();

  if (roll < 0.08) {
    return 0;
  }
  if (roll < 0.6) {
    return 1 + randomInt(12);
  }
  if (roll < 0.9) {
    return 13 + randomInt(50);
  }
  return 63 + randomInt(190);
}

function buildPostLikes(posts, profileIds) {
  const likes = [];
  let index = 0;

  for (const post of posts) {
    const target = Math.min(postLikeTarget(), profileIds.length);
    const selected = new Set();

    while (selected.size < target) {
      selected.add(randomInt(profileIds.length));
    }

    for (const profileIndex of selected) {
      index += 1;
      const createdAtMs = Math.min(
        NOW,
        post.createdAtMs + randomInt(Math.max(MINUTE, NOW - post.createdAtMs)),
      );

      likes.push([
        uuid(IDS.postLike, index),
        post.id,
        profileIds[profileIndex],
        timestamp(createdAtMs),
      ]);
    }
  }

  return likes;
}

function buildCommentLikes(comments, profileIds) {
  const likes = [];
  let index = 0;

  for (const comment of comments) {
    if (rng() < 0.3) {
      continue;
    }

    const target = 1 + randomInt(12);
    const selected = new Set();

    while (selected.size < Math.min(target, profileIds.length)) {
      selected.add(randomInt(profileIds.length));
    }

    for (const profileIndex of selected) {
      index += 1;
      const createdAtMs = Math.min(
        NOW,
        comment.createdAtMs + randomInt(Math.max(MINUTE, NOW - comment.createdAtMs)),
      );

      likes.push([
        uuid(IDS.commentLike, index),
        comment.id,
        profileIds[profileIndex],
        timestamp(createdAtMs),
      ]);
    }
  }

  return likes;
}

async function generateData(existingUsernames) {
  const profiles = buildProfiles(existingUsernames);
  const profileIds = profiles.map((profile) => profile.id);
  const posts = buildPosts(profileIds);
  const comments = buildComments(posts, profileIds);
  const postLikes = buildPostLikes(posts, profileIds);
  const commentLikes = buildCommentLikes(comments, profileIds);

  return { profiles, posts, comments, postLikes, commentLikes };
}

function loadEnvFile() {
  const values = {};

  try {
    const content = readFileSync(path.join(ROOT, '.env.properties'), 'utf8');

    for (const line of content.split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
      if (!match) {
        continue;
      }

      const value = match[2].replace(/^['"]|['"]$/g, '');
      values[match[1]] = value;
    }
  } catch {
    // Environment variables are enough when the file does not exist.
  }

  for (const key of [
    'SUPABASE_DB_URL',
    'SUPABASE_DB_USERNAME',
    'SUPABASE_DB_PASSWORD',
    'SEED_DB_URL',
    'SEED_DB_PORT',
  ]) {
    if (process.env[key]) {
      values[key] = process.env[key];
    }
  }

  return values;
}

function connectionConfig(env, portOverride) {
  const rawUrl = env.SEED_DB_URL || env.SUPABASE_DB_URL;

  if (!rawUrl) {
    throw new Error('Defina SEED_DB_URL ou SUPABASE_DB_URL.');
  }

  const normalized = rawUrl.startsWith('jdbc:') ? rawUrl.slice(5) : rawUrl;
  const parsed = new URL(normalized);
  const sslMode = parsed.searchParams.get('sslmode') ?? 'require';
  const urlUser = parsed.username
    ? decodeURIComponent(parsed.username)
    : parsed.searchParams.get('user');
  const user = env.SUPABASE_DB_USERNAME || urlUser;
  const password = env.SUPABASE_DB_PASSWORD || decodeURIComponent(parsed.password);
  const port = Number(portOverride || env.SEED_DB_PORT || parsed.port || 5432);

  if (!user || !password) {
    throw new Error('Defina SUPABASE_DB_USERNAME e SUPABASE_DB_PASSWORD.');
  }

  return {
    host: parsed.hostname,
    port,
    database: parsed.pathname.replace(/^\//u, '') || 'postgres',
    user,
    password,
    ssl: sslMode === 'disable' ? false : { rejectUnauthorized: false },
    application_name: 'reviewit-seed',
    statement_timeout: 300_000,
    query_timeout: 300_000,
  };
}

async function connect(env, portOverride) {
  const config = connectionConfig(env, portOverride);
  let client = new Client(config);

  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end().catch(() => undefined);

    const poolerFull =
      /max clients|too many clients|remaining connection slots|connection slots/iu.test(
        error.message,
      );

    if (!portOverride && !env.SEED_DB_PORT && config.port === 5432 && poolerFull) {
      console.warn('Pooler de sessão cheio; tentando a porta 6543 (transaction pooler)...');
      client = new Client({ ...config, port: 6543 });
      await client.connect();
      return client;
    }

    throw error;
  }
}

async function resetSeedData(client) {
  const statements = [
    [
      'comment likes',
      `delete from comment_likes
       where user_id::text like '${IDS.profile}-%'
          or id::text like '${IDS.commentLike}-%'`,
    ],
    [
      'post likes',
      `delete from post_likes
       where user_id::text like '${IDS.profile}-%'
          or id::text like '${IDS.postLike}-%'`,
    ],
    ['comments', `delete from comments where id::text like '${IDS.comment}-%'`],
    ['posts', `delete from posts where id::text like '${IDS.post}-%'`],
    ['profiles', `delete from profiles where id::text like '${IDS.profile}-%'`],
  ];

  for (const [label, sql] of statements) {
    const result = await client.query(sql);
    console.log(`  removidos ${label}: ${result.rowCount}`);
  }
}

async function existingUsernames(client) {
  const result = await client.query(
    `select username from profiles where id::text not like '${IDS.profile}-%'`,
  );

  return result.rows.map((row) => row.username);
}

async function insertRows(client, table, columns, rows, conflict, batchSize) {
  if (rows.length === 0) {
    return;
  }

  let inserted = 0;

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const values = [];
    const params = [];

    for (const row of batch) {
      const placeholders = row.map((_, index) => `$${params.length + index + 1}`);
      values.push(`(${placeholders.join(', ')})`);
      params.push(...row);
    }

    await client.query(
      `insert into ${table} (${columns.join(', ')})
       values ${values.join(', ')}
       ${conflict}`,
      params,
    );

    inserted += batch.length;

    if (inserted === rows.length || Math.floor(start / batchSize) % 10 === 0) {
      console.log(`  ${table}: ${inserted}/${rows.length}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith('--') && !arg.includes('=')));
  const portArg = args.find((arg) => arg.startsWith('--port='));
  const reset = flags.has('--reset');
  const yes = flags.has('--yes');
  const dryRun = flags.has('--dry-run');

  if (flags.has('--help')) {
    console.log(`Uso: node seed.mjs [opções]

  --reset        remove somente os dados com IDs 5eed... antes de semear
  --yes          confirma o --reset sem perguntar
  --dry-run      gera os dados e mostra os totais sem conectar ao banco
  --port=6543    usa uma porta específica do pooler
`);
    return;
  }

  if (reset && !yes) {
    throw new Error('Use --reset --yes para confirmar a remoção dos dados de seed.');
  }

  console.log(
    `ReviewIt seed: ${PROFILE_COUNT} perfis, ${POST_COUNT} reviews, ${COMMENT_COUNT} comentários`,
  );

  if (dryRun) {
    const data = await generateData([]);
    console.log(
      JSON.stringify(
        {
          profiles: data.profiles.length,
          posts: data.posts.length,
          comments: data.comments.length,
          postLikes: data.postLikes.length,
          commentLikes: data.commentLikes.length,
        },
        null,
        2,
      ),
    );
    console.log('\nAmostra:');
    console.log(data.posts[0].row[2]);
    console.log(data.posts[0].row[5].slice(0, 240));
    return;
  }

  const env = loadEnvFile();
  const client = await connect(env, portArg?.slice('--port='.length));

  try {
    if (reset) {
      console.log('Removendo dados de seed...');
      await resetSeedData(client);
    }

    const usernames = await existingUsernames(client);
    const data = await generateData(usernames);

    console.log('Inserindo dados...');
    await insertRows(
      client,
      'profiles',
      [
        'id',
        'username',
        'avatar_url',
        'role',
        'account_status',
        'suspended_until',
        'created_at',
        'onboarded',
      ],
      data.profiles.map((profile) => profile.row),
      'on conflict (id) do nothing',
      500,
    );
    await insertRows(
      client,
      'posts',
      [
        'id',
        'author_id',
        'title',
        'content_type',
        'genre',
        'content',
        'notify_enabled',
        'notify_channel',
        'created_at',
        'updated_at',
      ],
      data.posts.map((post) => post.row),
      'on conflict (id) do nothing',
      500,
    );
    await insertRows(
      client,
      'comments',
      ['id', 'post_id', 'author_id', 'content', 'created_at', 'updated_at'],
      data.comments.map((comment) => comment.row),
      'on conflict (id) do nothing',
      1000,
    );
    await insertRows(
      client,
      'post_likes',
      ['id', 'post_id', 'user_id', 'created_at'],
      data.postLikes,
      'on conflict do nothing',
      2000,
    );
    await insertRows(
      client,
      'comment_likes',
      ['id', 'comment_id', 'user_id', 'created_at'],
      data.commentLikes,
      'on conflict do nothing',
      2000,
    );

    const counts = await client.query(`
      select
        (select count(*) from profiles where id::text like '5eed0000-%') as profiles,
        (select count(*) from posts where id::text like '5eed1000-%') as posts,
        (select count(*) from comments where id::text like '5eed2000-%') as comments,
        (select count(*) from post_likes where id::text like '5eed3000-%') as post_likes,
        (select count(*) from comment_likes where id::text like '5eed4000-%') as comment_likes
    `);

    console.log('\nSeed concluído:');
    console.log(counts.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`\nFalha no seed: ${error.message}`);
  process.exitCode = 1;
});
