-- Migração 002: módulo Gestão de Atendimentos
-- Também é criada sozinha na primeira requisição (lib/comum.js). Pode ser executada mais de uma vez.

create table if not exists atendimentos (
  id               serial primary key,
  data             date not null,
  hora             time,
  orgao            text not null default '',
  solicitante      text not null,
  contato          text not null default '',              -- contato institucional; não registrar CPF
  categoria        text not null,                         -- Orientação | Suporte operacional
  assunto          text not null default '',
  descricao        text not null,
  canal            text not null,                         -- E-mail | WhatsApp | Presencial | Teams | Ligação
  atendente_id     int not null references usuarios(id),
  situacao         text not null,                         -- Em atendimento | Aguardando análise interna | Aguardando retorno do solicitante | Finalizado
  data_finalizacao date,                                  -- obrigatória quando Finalizado; vazia nas demais situações
  processo_id      int references processos(id) on delete set null,
  criado_por       int references usuarios(id),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);
create index if not exists atendimentos_situacao on atendimentos(situacao, atendente_id);

-- O histórico passa a servir também aos atendimentos
alter table historico alter column processo_id drop not null;
alter table historico add column if not exists atendimento_id int references atendimentos(id) on delete cascade;
create index if not exists historico_atendimento on historico(atendimento_id);
