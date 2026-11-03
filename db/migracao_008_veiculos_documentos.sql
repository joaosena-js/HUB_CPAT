-- Hub Patrimonial v7.6: nº de ordem automático, documentos do veículo e prontuário
-- O sistema cria estas alterações sozinho na primeira requisição (lib/comum.js). Este arquivo serve de registro
-- e para quem preferir rodar a alteração manualmente no Neon antes de publicar.

-- Nº de ordem do veículo, impresso no prontuário. É definido pelo sistema: novos veículos recebem o maior número + 1.
alter table veiculos add column if not exists ordem int;
-- Veículos já cadastrados recebem a sequência pela ordem de cadastro (id)
update veiculos v set ordem = x.n
    from (select id, (select coalesce(max(ordem), 0) from veiculos) + row_number() over (order by id) as n
        from veiculos
        where ordem is null) x
    where v.id = x.id;

-- Documentos que o veículo possui: {"crlv": true, "dut": true, ...}
alter table veiculos add column if not exists documentos jsonb not null default '{}';

-- Arquivos anexados a cada documento (PDF, JPG ou PNG no Vercel Blob privado)
create table if not exists veiculo_documentos (
    id serial primary key,
    veiculo_id int not null references veiculos(id) on delete cascade,
    documento text not null,              -- crlv, dut, ajuri, detran, dnit, immu, prf ou sefaz
    nome text not null,
    tipo text not null,
    tamanho int not null,
    caminho text not null unique,
    confirmado boolean not null default false,
    enviado_por int references usuarios(id),
    enviado_por_nome text not null default '',
    criado_em timestamptz not null default now()
);
create index if not exists veiculo_documentos_veiculo on veiculo_documentos(veiculo_id);
