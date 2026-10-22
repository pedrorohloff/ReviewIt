# ReviewIt seed

Popula o banco com uma comunidade plausível para validar o feed, os filtros, os
comentários, os likes e as páginas de perfil:

- 1.000 perfis fictícios;
- 5.000 reviews baseadas em 250 obras reais;
- 25.000 comentários;
- likes em posts e comentários.

Os perfis criados aqui são apenas linhas de `public.profiles`. Eles **não** são
usuários do Supabase Auth e não conseguem entrar no app. Isso é intencional: o
objetivo é dar vida à comunidade sem criar credenciais.

## Pré-requisitos

- Node.js 20 ou superior;
- acesso ao banco do Supabase;
- arquivo `.env.properties` na raiz do repositório (ignorado pelo Git) com
  `SUPABASE_DB_URL`, `SUPABASE_DB_USERNAME` e `SUPABASE_DB_PASSWORD`, ou as
  mesmas variáveis exportadas no ambiente.

O script lê `SEED_DB_URL` antes de `SUPABASE_DB_URL`, caso você queira apontar
para outro banco. `SEED_DB_PORT=6543` força o transaction pooler do Supabase.

## Uso

```bash
cd seed
npm install

# gera os dados, sem conectar no banco
npm run dry-run

# insere os dados
npm run seed

# remove somente os dados de seed e recria tudo
npm run seed:reset
```

Também é possível chamar diretamente:

```bash
node seed.mjs --reset --yes
node seed.mjs --port=6543
```

`--reset` exige `--yes` para evitar remoções acidentais. A remoção atinge apenas
as linhas com UUIDs nos namespaces `5eed...` criados por este script. O post e o
perfil da conta real são preservados. Se um usuário real tiver comentado ou
curtido um post de seed, esse vínculo é removido junto com o post no reset.

## Determinismo

Os UUIDs e o conteúdo são determinísticos:

- perfis: `5eed0000-...`;
- posts: `5eed1000-...`;
- comentários: `5eed2000-...`;
- likes de posts: `5eed3000-...`;
- likes de comentários: `5eed4000-...`.

As datas usam o momento da execução, então o feed parece recente em cada carga.
Rodar de novo sem `--reset` é seguro: os inserts usam `on conflict do nothing`.

## Observações

- O dataset de obras fica em `works.mjs`, com dez obras por tipo/gênero.
- Cada obra recebe cerca de 20 reviews.
- O volume de likes é variável e proposital: alguns posts ficam populares e
  outros quase sem interação, para o filtro de populares ter contraste.
- O script não cria notificações, denúncias nem ações de moderação.
- O Supabase pode recusar a conexão de sessão (porta 5432) quando o pool está
  cheio. Nesse caso, o script tenta automaticamente a porta 6543; também é
  possível forçar com `SEED_DB_PORT=6543`.
