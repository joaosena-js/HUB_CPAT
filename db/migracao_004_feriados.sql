-- Migração 004: feriados e pontos facultativos no Calendário
-- Também é aplicada sozinha na primeira requisição (lib/comum.js). Pode ser executada mais de uma vez.

alter table eventos add column if not exists classificacao text not null default '';  -- Feriado nacional | Feriado estadual | Feriado municipal | Ponto facultativo
alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check check (tipo in ('Reunião', 'Treinamento', 'Férias', 'Agenda do servidor', 'Feriado ou ponto facultativo'));
