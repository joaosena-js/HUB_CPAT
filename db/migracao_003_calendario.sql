-- Migração 003: módulo Calendário (reuniões, treinamentos, férias e agenda do servidor)
-- Também é criada sozinha na primeira requisição (lib/comum.js). Pode ser executada mais de uma vez.

create table if not exists eventos (
  id                     serial primary key,
  tipo                   text not null check (tipo in ('Reunião', 'Treinamento', 'Férias', 'Agenda do servidor')),
  titulo                 text not null,                 -- na agenda do servidor é o rótulo público: Ausente | Compromisso pessoal
  inicio                 date not null,
  fim                    date not null,
  hora_inicio            time,                          -- vazio = dia inteiro
  hora_fim               time,
  local                  text not null default '',      -- endereço, sala ou link da reunião
  pauta                  text not null default '',      -- pauta da reunião ou conteúdo do treinamento
  participantes_externos text not null default '',
  carga_horaria          numeric(5,1),                  -- só treinamento
  servidor_id            int references usuarios(id),   -- férias e agenda do servidor
  motivo                 text not null default '',      -- agenda do servidor: visível só para o próprio servidor e o administrador
  cancelado              boolean not null default false,
  criado_por             int references usuarios(id),
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now(),
  check (fim >= inicio)
);
create index if not exists eventos_periodo on eventos(inicio, fim);

create table if not exists evento_participantes (
  evento_id  int not null references eventos(id) on delete cascade,
  usuario_id int not null references usuarios(id),
  primary key (evento_id, usuario_id)
);

-- Foto, ATA e lista de presença. O arquivo fica no Vercel Blob (armazenamento privado); aqui fica só o endereço.
create table if not exists evento_anexos (
  id               serial primary key,
  evento_id        int not null references eventos(id) on delete cascade,
  categoria        text not null,                       -- Foto | ATA | Lista de presença | Outro documento
  nome             text not null,                       -- nome original do arquivo
  tipo             text not null,                       -- application/pdf | image/jpeg | image/png
  tamanho          int not null,
  caminho          text not null unique,                -- caminho do arquivo no Blob
  confirmado       boolean not null default false,      -- vira true depois que o servidor confere o arquivo enviado
  enviado_por      int references usuarios(id),
  enviado_por_nome text not null default '',
  criado_em        timestamptz not null default now()
);
create index if not exists evento_anexos_evento on evento_anexos(evento_id);
