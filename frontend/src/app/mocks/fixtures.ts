import { Post } from '@app/core/models/post';

const maria = {
  id: '10000000-0000-4000-8000-000000000001',
  username: 'Maria Rohls',
  avatarUrl: null,
};

const joao = {
  id: '10000000-0000-4000-8000-000000000002',
  username: 'João Lima',
  avatarUrl: null,
};

const lena = {
  id: '10000000-0000-4000-8000-000000000003',
  username: 'Lena Souza',
  avatarUrl: null,
};

const caio = {
  id: '10000000-0000-4000-8000-000000000004',
  username: 'Caio Reis',
  avatarUrl: null,
};

const bia = {
  id: '10000000-0000-4000-8000-000000000005',
  username: 'Bia Nunes',
  avatarUrl: null,
};

/**
 * Curated posts used as the first entries of the demo dataset built by
 * `mock-seed.ts`. Dates are fixed so the visual stays deterministic.
 */
export const DEMO_POSTS: readonly Post[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    author: maria,
    title: 'A casa que aprendi a habitar',
    contentType: 'Book',
    genre: 'Drama',
    content:
      'Este é um livro sobre voltar. Não sobre voltar para casa, mas sobre reconhecer que a casa mudou enquanto você estava fora. A escrita é lenta de propósito: cada capítulo parece uma tarde inteira, com cheiro de madeira molhada e conversas que nunca terminam.\n\nO que mais me pegou foi a relação da protagonista com os objetos. Nada é só cenário. Uma cadeira, um caderno, uma janela — tudo carrega uma decisão que ela não conseguiu tomar. Recomendo para quem gosta de ler devagar e sublinhar frases.',
    notifyEnabled: true,
    notifyChannel: 'In-App',
    likeCount: 148,
    commentCount: 12,
    createdAt: '2026-10-21T09:30:00Z',
    updatedAt: '2026-10-21T09:30:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    author: joao,
    title: 'O silêncio depois da meia-noite',
    contentType: 'Movie',
    genre: 'Horror',
    content:
      'Um filme que entende que o medo mora nos corredores, não nos monstros. A câmera fica parada um segundo a mais do que deveria, e é nesse segundo que tudo acontece. O som é o verdadeiro protagonista: quase não há trilha, só o barulho da casa respirando.\n\nSai do cinema com a sensação de que precisava falar baixo. Não é um terror de sustos, é um terror de permanência. Perfeito para quem gosta de sair do cinema com uma pergunta na cabeça.',
    notifyEnabled: true,
    notifyChannel: 'Email',
    likeCount: 23,
    commentCount: 4,
    createdAt: '2026-10-20T21:10:00Z',
    updatedAt: '2026-10-20T21:10:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    author: lena,
    title: 'Canções para dias de chuva',
    contentType: 'Album',
    genre: 'Romance',
    content:
      'Tem disco que a gente ouve e tem disco que a gente habita. Este é do segundo tipo. As faixas não têm pressa, e a voz parece gravada dentro da mesma sala em que você está ouvindo. A produção deixa os erros pequenos no lugar, e isso faz tudo parecer mais perto.\n\nA melhor sequência é a do meio: três músicas que funcionam como uma conversa só. Se você gosta de álbuns para atravessar uma tarde inteira, comece por aqui.',
    notifyEnabled: false,
    notifyChannel: 'None',
    likeCount: 7,
    commentCount: 2,
    createdAt: '2026-10-19T14:00:00Z',
    updatedAt: '2026-10-19T14:00:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    author: caio,
    title: 'Horizonte de cinzas: um mundo que responde',
    contentType: 'Game',
    genre: 'Action',
    content:
      'O grande acerto é a escalada. No começo você resolve tudo com um golpe e um pouco de sorte; no fim, está lendo o cenário como quem lê uma partitura. O mapa não é um menu gigante, é uma sequência de decisões. Cada atalho que você abre muda o ritmo da próxima área.\n\nA história demora um pouco para engatar, mas quando engata justifica as horas. Joguei em sessões de uma hora e sempre terminei querendo só mais uma. É o tipo de jogo que faz o console parecer pequeno.',
    notifyEnabled: true,
    notifyChannel: 'In-App',
    likeCount: 56,
    commentCount: 9,
    createdAt: '2026-10-16T18:00:00Z',
    updatedAt: '2026-10-16T18:00:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    author: bia,
    title: 'Manual de sobrevivência para adultos cansados',
    contentType: 'Book',
    genre: 'Comedy',
    content:
      'Li esperando rir e terminei rindo de reconhecimento. O livro não tenta ensinar a ser produtivo; ele tenta ensinar a não transformar cada domingo em uma reunião de planejamento pessoal. Os capítulos são curtos, quase piadas, e a autora tem um timing excelente.\n\nÉ leve sem ser bobo. Presente certo para quem está naquela fase em que dormir cedo virou projeto de vida.',
    notifyEnabled: false,
    notifyChannel: 'None',
    likeCount: 0,
    commentCount: 0,
    createdAt: '2026-10-10T11:00:00Z',
    updatedAt: '2026-10-10T11:00:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    author: maria,
    title: 'Quando o verão termina',
    contentType: 'Movie',
    genre: 'Romance',
    content:
      'Um filme sobre o que fica depois que a estação acaba. Não tem grandes declarações, tem gestos pequenos: guardar um ingresso, deixar uma janela aberta, responder uma mensagem tarde demais. A fotografia é quente sem ser nostálgica, e o final não tenta consertar o que já passou.\n\nAssisti sozinha e depois liguei para uma amiga. Acho que esse é o melhor elogio que posso fazer.',
    notifyEnabled: true,
    notifyChannel: 'In-App',
    likeCount: 31,
    commentCount: 6,
    createdAt: '2026-09-28T16:20:00Z',
    updatedAt: '2026-09-28T16:20:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    author: joao,
    title: 'Fita magnética',
    contentType: 'Album',
    genre: 'Drama',
    content:
      'O disco começa com uma gravação de voz que parece ter sido encontrada por acaso. Essa sensação de arquivo perdido atravessa todas as faixas. É melancólico, mas não é pesado; há uma espécie de carinho no modo como os samples são repetidos.\n\nPara ouvir no ônibus, olhando pela janela. Funciona melhor assim do que em qualquer playlist de fundo.',
    notifyEnabled: false,
    notifyChannel: 'None',
    likeCount: 18,
    commentCount: 1,
    createdAt: '2026-09-14T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    author: lena,
    title: 'Pequenos turnos',
    contentType: 'Game',
    genre: 'Comedy',
    content:
      'Um jogo sobre organizar a vida em turnos de vinte minutos. Parece burocrático e é justamente aí que está a graça: você tem que escolher entre lavar a louça, ligar para a mãe ou terminar o projeto que vai mudar sua carreira. O humor está nos detalhes e nas descrições dos objetos.\n\nJoguei em uma tarde e fiquei pensando nas minhas próprias prioridades. Não sei se era o objetivo, mas foi o efeito.',
    notifyEnabled: true,
    notifyChannel: 'Email',
    likeCount: 42,
    commentCount: 3,
    createdAt: '2026-08-30T19:45:00Z',
    updatedAt: '2026-08-30T19:45:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000009',
    author: maria,
    title: 'O mapa das coisas que ficaram',
    contentType: 'Book',
    genre: 'Drama',
    content:
      'Uma coleção de contos que funcionam como um só romance sobre perda. Os personagens aparecem de passagem em histórias alheias, e essa costura é o melhor que o livro tem. Nada é explicado em voz alta; o leitor junta as peças aos poucos.\n\nGostei especialmente do conto do meio, em que uma família inteira conversa sem dizer o nome de quem morreu. Terminei querendo reler o primeiro capítulo e começar de novo.',
    notifyEnabled: true,
    notifyChannel: 'In-App',
    likeCount: 64,
    commentCount: 5,
    createdAt: '2026-09-09T15:30:00Z',
    updatedAt: '2026-09-09T15:30:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000010',
    author: maria,
    title: 'Três minutos de silêncio',
    contentType: 'Movie',
    genre: 'Drama',
    content:
      'É um filme pequeno, quase todo dentro de um apartamento, e ainda assim tem a sensação de um lugar enorme. A câmera acompanha a rotina de duas pessoas que já se conhecem demais, e o roteiro evita a discussão fácil. As pausas fazem o trabalho.\n\nO final é aberto sem ser covarde. Saí achando que tinha entendido tudo e, dois dias depois, mudaria uma fala inteira de lugar.',
    notifyEnabled: false,
    notifyChannel: 'None',
    likeCount: 12,
    commentCount: 2,
    createdAt: '2026-08-27T20:15:00Z',
    updatedAt: '2026-08-27T20:15:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000011',
    author: maria,
    title: 'Ruído branco para dormir acordada',
    contentType: 'Album',
    genre: 'Drama',
    content:
      'Um disco que parece ter sido gravado de madrugada, com microfone aberto na janela. As texturas mudam muito pouco, e é isso que faz funcionar: você para de prestar atenção e começa a usar o som como fundo para pensar.\n\nNão é música para o dia inteiro. É música para um trecho específico da noite, quando o cansaço já ganhou e a cabeça ainda insiste.',
    notifyEnabled: false,
    notifyChannel: 'None',
    likeCount: 9,
    commentCount: 1,
    createdAt: '2026-08-18T02:40:00Z',
    updatedAt: '2026-08-18T02:40:00Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000012',
    author: maria,
    title: 'A cidade que só abre à noite',
    contentType: 'Game',
    genre: 'Horror',
    content:
      'O jogo propõe uma cidade que muda de regras depois que o sol se põe. Durante o dia você conversa; à noite, precisa atravessar os mesmos lugares sem ser visto. A repetição do cenário poderia cansar, mas cada volta acrescenta uma informação nova sobre o que aconteceu ali.\n\nNão é um jogo difícil, é um jogo atento. Errei por pressa mais de uma vez. Vale jogar com fone e com tempo.',
    notifyEnabled: true,
    notifyChannel: 'Email',
    likeCount: 27,
    commentCount: 4,
    createdAt: '2026-08-05T21:00:00Z',
    updatedAt: '2026-08-05T21:00:00Z',
  },
];
