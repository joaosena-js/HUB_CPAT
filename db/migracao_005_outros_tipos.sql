-- Migração 005: tipos "Outro evento" e "Aniversário" no calendário
-- Também é aplicada sozinha na primeira requisição (lib/comum.js). Pode ser executada mais de uma vez.
-- Aniversário guarda só dia e mês: o ano fica fixo em 2000 e o calendário repete a data todo ano (o ano de nascimento não é coletado).

alter table eventos drop constraint if exists eventos_tipo_check;
alter table eventos add constraint eventos_tipo_check
  check (tipo in ('Reunião', 'Treinamento', 'Outro evento', 'Férias', 'Agenda do servidor', 'Feriado ou ponto facultativo', 'Aniversário'));
