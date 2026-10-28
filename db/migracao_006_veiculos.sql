-- Hub Patrimonial v7.0: Gestão de Veículos
-- O sistema cria estas tabelas sozinho na primeira requisição (lib/comum.js). Este arquivo serve de registro
-- e para quem preferir rodar a alteração manualmente no Neon antes de publicar.

create table if not exists veiculos (
    id serial primary key,
    orgao text not null default '',
    processo_id int references processos(id) on delete set null,
    placa text not null default '',
    tombo text not null default '',
    tipo text not null default '',
    modelo text not null,
    ano int,
    chassi text not null default '',
    renavam text not null default '',
    ultimo_licenciamento int,
    destinacao text not null default '',
    situacao_doc text not null default '', -- Regularizado, Em regularização ou Não regularizado (marcado pelo usuário)
    entrada date,                       -- entrada no depósito (opcional)
    saida date,                         -- saída do depósito; vazio = veículo no depósito
    vistoria jsonb not null default '{}', -- Lista de Verificação de Veículo
    criado_por int references usuarios(id),
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);
create index if not exists veiculos_processo on veiculos(processo_id);

create table if not exists veiculo_fotos (
    id serial primary key,
    veiculo_id int not null references veiculos(id) on delete cascade,
    parte text not null,                -- parte do veículo mostrada na foto (ex.: Frontal)
    nome text not null,
    tipo text not null,
    tamanho int not null,
    caminho text not null unique,       -- caminho no Vercel Blob privado
    confirmado boolean not null default false,
    enviado_por int references usuarios(id),
    enviado_por_nome text not null default '',
    criado_em timestamptz not null default now()
);
create index if not exists veiculo_fotos_veiculo on veiculo_fotos(veiculo_id);
