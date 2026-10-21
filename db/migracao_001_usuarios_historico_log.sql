-- Migração 001: login individual, histórico do processo e log de atividades
-- O sistema cria estas tabelas sozinho na primeira requisição (api/data.js).
-- Este arquivo serve para documentação ou para executar manualmente no SQL Editor do Neon.
-- Pode ser executado mais de uma vez sem causar erro.
-- Os campos novos do processo (descricao, setor) ficam dentro da coluna JSONB "data" e não exigem alteração de tabela.

create table if not exists usuarios (
  id            serial primary key,
  login         text not null unique,
  nome          text not null,
  responsavel   text not null default '',          -- nome usado no campo Responsável dos processos
  perfil        text not null default 'servidor' check (perfil in ('admin', 'servidor')),
  senha_hash    text not null,                      -- scrypt com sal; a senha nunca é gravada
  ativo         boolean not null default true,
  versao        int not null default 1,             -- muda quando a senha/perfil muda e encerra sessões antigas
  ultimo_acesso timestamptz,
  criado_em     timestamptz not null default now()
);

create table if not exists historico (
  id           serial primary key,
  processo_id  int not null references processos(id) on delete cascade,
  data         date not null,                       -- data do acontecimento informada pelo usuário
  descricao    text not null,
  automatico   boolean not null default false,      -- true quando gerado pelo sistema (cadastro, status, responsável, setor)
  usuario_id   int references usuarios(id),
  usuario_nome text not null,
  criado_em    timestamptz not null default now()   -- quando o registro foi feito
);
create index if not exists historico_processo on historico(processo_id);

create table if not exists log_atividades (
  id           bigserial primary key,
  criado_em    timestamptz not null default now(),
  usuario_id   int references usuarios(id),
  usuario_nome text not null default '',
  acao         text not null,
  detalhe      text not null default '',
  ip           text not null default ''
);
create index if not exists log_atividades_data on log_atividades(criado_em desc);
