-- Hub Patrimonial v7.9: situação documental do veículo calculada pelos documentos, com opção manual
-- O sistema cria estas alterações sozinho na primeira requisição (lib/comum.js). Este arquivo serve de registro
-- e para quem preferir rodar a alteração manualmente no Neon antes de publicar.

-- Regra: com os 8 documentos = Regularizado; de 1 a 7 = Em regularização; nenhum = Não regularizado.
-- Os códigos são os mesmos de DOCUMENTOS em api/veiculos.js e VE_DOCS em js/veiculos.js.
create or replace function situacao_doc_auto(d jsonb) returns text language sql immutable as $$
    select case (select count(*) from jsonb_each(coalesce(d, '{}'::jsonb)) e
            where e.key = any(array['crlv', 'dut', 'ajuri', 'detran', 'dnit', 'immu', 'prf', 'sefaz']) and e.value = 'true'::jsonb)
        when 0 then 'Não regularizado' when 8 then 'Regularizado' else 'Em regularização' end
$$;

-- true = situação escolhida à mão (não muda com os documentos); false = calculada pelo sistema
alter table veiculos add column if not exists situacao_doc_manual boolean;

-- Na primeira vez: quem já tinha uma situação marcada diferente do cálculo fica como manual, para não perder o que foi marcado.
-- Vazios e iguais ao cálculo passam a ser automáticos.
update veiculos set situacao_doc_manual = (situacao_doc <> '' and situacao_doc <> situacao_doc_auto(documentos))
    where situacao_doc_manual is null;
alter table veiculos alter column situacao_doc_manual set default false, alter column situacao_doc_manual set not null;

-- Preenche a situação dos automáticos
update veiculos set situacao_doc = situacao_doc_auto(documentos)
    where not situacao_doc_manual and situacao_doc is distinct from situacao_doc_auto(documentos);
