-- Hub Patrimonial v7.1: ajustes da Gestão de Veículos para receber a planilha do depósito
-- O sistema faz esta alteração sozinho na primeira requisição (lib/comum.js). Este arquivo serve de registro
-- e para quem preferir rodar a alteração manualmente no Neon antes de publicar.

-- O processo passa a ser gravado pelo número, mesmo que ainda não esteja no cadastro de processos.
-- O vínculo com o cadastro é feito na consulta, comparando o número sem pontuação.
-- O ano passa a aceitar fabricação/modelo (2010/2011), como no documento do veículo.
do $$
begin
    if exists (select 1 from information_schema.columns where table_name = 'veiculos' and column_name = 'processo_id') then
        alter table veiculos add column if not exists processo text not null default '';
        update veiculos v set processo = coalesce((select p.data->>'numero' from processos p where p.id = v.processo_id), '');
        alter table veiculos drop column processo_id;
    end if;
    if exists (select 1 from information_schema.columns where table_name = 'veiculos' and column_name = 'ano' and data_type = 'integer') then
        alter table veiculos alter column ano type text using coalesce(ano::text, '');
        alter table veiculos alter column ano set default '';
        alter table veiculos alter column ano set not null;
    end if;
end $$;

-- Observações do veículo (por exemplo, "baixa no DETRAN")
alter table veiculos add column if not exists obs text not null default '';

-- RENAVAM com 11 números (os antigos, de 9, recebem zeros à esquerda)
update veiculos set renavam = lpad(renavam, 11, '0') where renavam <> '' and length(renavam) < 11;
