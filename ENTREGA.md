# Hub DBM: entrega

## Versão 6.9: cabeçalho do PDF dos Gerenciais

No PDF da tela Gerenciais, o título passou de "Relatório gerencial" para **Relatório Controle de Processos**. Acima dele aparece **Departamento de Bens Móveis - DBM**, no lugar de "Coordenadoria de Patrimônio · DBM". O nome sugerido ao salvar o PDF segue o novo título. O Excel e os PDFs das outras telas não mudaram.

| Arquivo | Situação |
|---|---|
| `js/relatorios.js` | alterado |

Publicação: substitua o arquivo (ou aplique `hub-dbm-v6.9.patch` com `git am --keep-cr` sobre a v6.8), faça o push e recarregue com Ctrl + F5.

---

## Versão 6.8: tela Gerenciais

**Digitação do ano nas datas:** ao digitar o ano num campo de data, o navegador entrega valores intermediários (0002, 0020, 0202) antes de chegar a 2026. A tela era redesenhada a cada um deles, e não dava para terminar de digitar. Agora o filtro só é aplicado quando o ano tem 4 dígitos de verdade. A correção vale para o intervalo e o mês da tela Gerenciais e para os filtros de data de Processos, Listas e Relatórios, Atendimentos e Log de atividades.

**Personalizar relatório:** novo botão na tela Gerenciais. Ele abre uma lista com os 6 indicadores do Resumo do período e todos os quadros, e o que for desmarcado não entra no PDF nem no Excel.
- A tela continua mostrando tudo. Os itens fora do relatório ficam esmaecidos, com a etiqueta "Fora do relatório", e aparece o aviso "Relatório personalizado: N item(ns) fora do PDF e do Excel".
- A escolha fica guardada no navegador, separada por usuário. Vale para todos os períodos até ser alterada, e "Marcar todos" volta ao relatório completo.
- Se tudo for desmarcado, o sistema avisa em vez de gerar um arquivo vazio.

**Nome:** "Relatórios gerenciais" passou a se chamar "Gerenciais" no menu, no título da tela e no atalho da tela Início. O PDF continua com o título "Relatório gerencial".

| Arquivo | Situação |
|---|---|
| `js/relatorios.js`, `js/base.js`, `js/processos.js`, `js/atendimentos.js`, `js/usuarios.js`, `js/inicio.js`, `index.html`, `GUIA-DO-CODIGO.md` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.8.patch` com `git am --keep-cr` sobre a v6.7), faça o push e recarregue com Ctrl + F5.

---

## Versão 6.7: código organizado e guia de leitura

Esta versão não muda nada do que aparece na tela. Ela organiza o código para que seja possível ler e entender.

**Indentação e quebras de linha:** todos os arquivos de `js/`, `api/` e `lib/` foram formatados com o Prettier: indentação de 4 espaços, uma instrução por linha e linhas de até 120 caracteres. O código passou de cerca de 3.300 para cerca de 5.100 linhas, porque o que antes ficava espremido em uma linha agora ocupa várias. Os trechos longos de HTML e as consultas SQL também foram quebrados em pontos seguros.

**Comentários:** cada arquivo começa com um comentário dizendo o que contém, e cada função tem uma linha acima explicando o que faz. As variáveis principais, como `D`, `L`, `ME`, `AT` e `EV`, também estão explicadas onde são criadas.

**Guia de leitura:** o arquivo novo `GUIA-DO-CODIGO.md` traz o mapa de arquivos, o caminho completo de um clique (do botão até o banco), os nomes curtos mais usados, onde mexer em mudanças comuns e como manter a formatação no VS Code.

**Como foi conferido que nada mudou:**
- A estrutura lógica de cada arquivo foi comparada automaticamente com a versão anterior, depois de formatada: os 12 arquivos são idênticos.
- As 37 telas e janelas principais foram fotografadas antes e depois, com os mesmos dados. As únicas diferenças eram a hora preenchida no formulário e o log de atividades, que mudam a cada execução.
- Os testes das versões anteriores (calendário, importação, relatórios, exportações e as melhorias da v6.6) passaram.

**Uma correção pequena:** durante os testes apareceu um ponto frágil. Se um processo fosse gravado sem status (por exemplo, numa importação de planilha sem essa coluna), todas as telas de processos deixavam de abrir. Agora esse processo é tratado como em aberto e o sistema continua funcionando. É a única alteração de comportamento desta versão.

| Arquivo | Situação |
|---|---|
| `GUIA-DO-CODIGO.md`, `.prettierrc.json` | novos |
| todos os arquivos de `js/`, `api/` e `lib/` | reformatados e comentados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.7.patch` com `git am --keep-cr` sobre a v6.6), faça o push e recarregue com Ctrl + F5. Como quase todas as linhas mudaram de posição, se você tiver alterações locais ainda não enviadas, envie-as antes ou guarde uma cópia, para evitar conflitos.

---

## Versão 6.6: melhorias de uso e de Excel

**Excel dos relatórios** (telas de processos, Listas e Relatórios, Atendimentos e Calendário):
- Datas saem como data de verdade (formato dd/mm/aaaa), então o filtro do Excel agrupa por ano, mês e dia. Traço vira célula vazia. A Planilha completa e os Relatórios gerenciais também passam a gravar as datas como data.
- No topo de cada planilha há um cabeçalho de gestão: título, data de emissão, filtros usados e um **resumo só com quantitativos** (total de registros e contagem por tipo, status ou situação, prioridade, categoria, canal e responsável, conforme as colunas do relatório).
- A linha de títulos da tabela já vem com o filtro do Excel ligado, e as colunas vêm com largura ajustada.
- A importação de atendimentos aceita também uma planilha exportada pelo próprio Hub, com o resumo no topo.

**Pesquisa nas telas:** a barra de pesquisa de Todos os Processos, Caixa do Setor, Alienações, Transferências e Vida do Processo agora filtra enquanto você digita. Havia um erro que impedia a atualização da lista (o nome da função coincidia com uma propriedade do próprio campo de texto do navegador).

**Layout:** a área principal ocupa toda a largura da tela (antes parava em 1.500 px). No celular, a busca rápida do cabeçalho ganhou mais espaço.

**Ícone:** o site tem ícone na aba do navegador (arquivo novo `favicon.svg`, com o mesmo símbolo do menu).

**Tabelas:** cabeçalhos e células ficam centralizados. Só as colunas de texto livre (Descrição, Assunto, Motivo) continuam alinhadas à esquerda, para facilitar a leitura.

**Novo atendimento:** botão no cabeçalho, ao lado de Novo processo, disponível em qualquer tela. No celular aparecem só os ícones.

| Arquivo | Situação |
|---|---|
| `favicon.svg` | novo |
| `index.html`, `js/base.js`, `js/processos.js`, `js/atendimentos.js`, `js/calendario.js`, `js/relatorios.js` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.6.patch` com `git am --keep-cr` sobre a v6.5), faça o push e recarregue com Ctrl + F5. O ícone pode demorar alguns minutos para aparecer na aba, porque o navegador guarda o ícone antigo.

---

## Versão 6.5: exportação do calendário

No **Calendário da equipe**, o botão **Exportar** abre a escolha de período (vem preenchido com o mês ou a semana em tela), tipo, servidor e se os cancelados entram. Depois é só clicar em Excel ou PDF.
- **Um tipo:** uma tabela com as colunas daquele tipo (por exemplo, reunião traz horário, local, participantes, pauta e anexos; treinamento traz também a carga horária; férias traz o servidor e os dias).
- **Todos os tipos:** no Excel, uma aba de resumo e uma aba por tipo; no PDF, uma seção por tipo.
- Entram os eventos que acontecem em pelo menos um dia do período. Aniversário entra quando a data cai no período.
- O motivo reservado da agenda do servidor nunca vai para a exportação.

| Arquivo | Situação |
|---|---|
| `js/calendario.js` | alterado |

Publicação: substitua o arquivo `js/calendario.js` (ou aplique `hub-dbm-v6.5.patch` com `git am --keep-cr` sobre a v6.4), faça o push e recarregue com Ctrl + F5.

---

## Versão 6.4: coluna Conclusão também nas telas de processos

A coluna **Conclusão** passa a aparecer também em **Todos os Processos** (logo depois de Movimentação), **Alienações** e **Transferências**, na tela e nas exportações de Excel e PDF dessas telas. Processo não concluído fica com traço (—). Caixa do Setor e Vida do Processo mostram só processos em andamento, então ficaram sem a coluna.

| Arquivo | Situação |
|---|---|
| `js/processos.js` | alterado |

Publicação: substitua o arquivo `js/processos.js` (ou aplique `hub-dbm-v6.4.patch` com `git am --keep-cr` sobre a v6.3) e faça o push. Depois de publicar, recarregue a página com Ctrl + F5 para o navegador não usar o arquivo antigo.

---

## Versão 6.3: data de conclusão nos relatórios de processos

Em **Listas e Relatórios**, os relatórios Alienações por período, Transferências por período e Processos concluídos ganharam a coluna **Conclusão**, logo depois de Movimentação. Ela aparece na tela, no Excel e no PDF. Processo ainda não concluído fica com traço (—). A data é a mesma que o sistema já grava quando o status passa para um status iniciado por "CONCLU".

Os relatórios Processos em andamento e Processos em atraso não têm a coluna, porque nela só apareceriam traços. A Planilha completa já trazia a coluna Conclusão.

| Arquivo | Situação |
|---|---|
| `js/processos.js` | alterado |

Publicação: substitua o arquivo (ou aplique `hub-dbm-v6.3.patch` com `git am --keep-cr` sobre a v6.2) e faça o push.

---

## Versão 6.2: importação de atendimentos por planilha

Em **Atendimentos**, o administrador tem o botão **Importar planilha**. O fluxo:
1. Escolha o arquivo .xlsx. A primeira aba precisa ter cabeçalho com DATA, HORA, SIGLA, SOLICITANTE, CATEGORIA, ASSUNTO, DESCRIÇÃO, TIPO DE CONTATO, RESPONSÁVEL, DATA DE FINALIZAÇÃO e STATUS (OBSERVAÇÃO é opcional e vai para a descrição).
2. A prévia mostra o total de linhas, o período e a contagem por situação, categoria e canal. Nada é gravado nesse momento.
3. Cada nome da coluna RESPONSÁVEL é ligado a um usuário do Hub. O sistema sugere pelo primeiro nome e você confirma ou troca. A pessoa precisa ter usuário ativo; se não tiver, cadastre em Usuários e Log antes.
4. Linhas com erro (data inválida, categoria ou tipo de contato desconhecido) bloqueiam a importação inteira e aparecem com o número da linha. Linhas que precisam de ajuste aparecem na lista de ajustes.
5. Ao importar, cada atendimento ganha no histórico a anotação "importado da planilha (linha N)", com o ajuste feito, se houver.

Conversões: SUPORTE vira "Suporte operacional"; TELEFONE vira "Ligação"; FINALIZADO vira "Finalizado"; EM ANDAMENTO e PENDENTE viram "Em atendimento"; hora 00:00 ou "-" fica em branco.

Ajustes automáticos (sempre listados na prévia): solicitante vazio ou "-" vira "Não informado"; descrição vazia recebe o assunto; data de finalização anterior à data do atendimento é trocada pela data do atendimento (a data original fica anotada no histórico); data de finalização em atendimento não finalizado é desconsiderada.

Importar o mesmo arquivo de novo não duplica: atendimentos com mesma data, hora, órgão, solicitante, assunto, descrição e atendente que já estão no Hub são ignorados. Linhas iguais dentro da mesma planilha são mantidas, porque podem ser pedidos diferentes. A gravação é feita numa única operação: se der erro, nada fica pela metade. Só o administrador pode importar (conferido no servidor) e a importação fica no Log.

| Arquivo | Situação |
|---|---|
| `api/atendimentos.js` | alterado (operação de importação) |
| `js/atendimentos.js` | alterado (botão, prévia e correspondência de responsáveis) |
| `js/usuarios.js` | alterado (nome da ação no Log) |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.2.patch` com `git am --keep-cr` sobre a v6.1) e faça o push. Não há tabela nem variável nova.

---

## Versão 6.1: outro evento e aniversário no calendário

**Outro evento:** para o que não é reunião nem treinamento (confraternização, visita técnica, palestra, ação de extensão). Tem título, datas, horário, local, participantes da equipe e externos, descrição e anexos (fotos e documentos). Pode ser cancelado e entra no relatório Agenda da equipe, contando qualquer arquivo anexado como registro. Cor roxa no calendário.

**Aniversário:** cor rosa, aparece todos os anos no mesmo dia, no calendário, na tela Início e no Resumo do dia.
- O formulário pede só dia e mês. O ano de nascimento não é coletado nem guardado (no banco a data fica com o ano 2000 apenas como referência).
- O servidor lança e corrige o próprio aniversário. O administrador lança o de qualquer servidor e também o de pessoas de fora da equipe, informando o nome.
- Cada pessoa tem um aniversário só: o sistema recusa lançar de novo.
- Quem nasceu em 29/02 aparece em 28/02 nos anos que não são bissextos.

**Correção:** datas que não existem (31/11, 30/02) passam a ser recusadas pelo servidor em todo o sistema. Antes a validação aceitava e a data virava o dia seguinte.

| Arquivo | Situação |
|---|---|
| `api/eventos.js` | alterado (novos tipos, regras do aniversário) |
| `lib/comum.js` | alterado (atualiza a regra de tipos do banco sozinho; validação de data) |
| `db/migracao_005_outros_tipos.sql` | novo (mesma atualização, para rodar manualmente se preferir) |
| `js/calendario.js`, `js/relatorios.js`, `index.html` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.1.patch` com `git am --keep-cr` sobre a v6) e faça o push. O banco é atualizado na primeira requisição; não há variável nova.

Como testar:
1. Entre como servidor, clique em Novo evento, escolha Aniversário, informe dia e mês e salve. O aniversário aparece no calendário, na tela Início (se for nesta semana) e repete no ano seguinte.
2. Tente lançar o aniversário de novo: o sistema recusa.
3. Como administrador, lance o aniversário de "Pessoa de fora da equipe" informando o nome.
4. Lance um Outro evento com fotos: os arquivos aparecem em "Fotos e documentos".

---

## Versão 6: tela Início e bloqueio de duplicados

**Tela Início** (primeira tela ao entrar, item "Início" no topo do menu):
- Saudação com a data e botões para cada módulo, com um número de apoio (processos em andamento por tipo, atendimentos em aberto, eventos de hoje). Usuários e Log aparece só para o administrador.
- **Agenda da semana:** eventos de hoje até 6 dias à frente. Evento de vários dias (férias, por exemplo) aparece uma vez só.
- **Meus processos em andamento:** os 5 mais antigos do responsável vinculado ao usuário, com botão "Ver todos" quando houver mais. Se o usuário não estiver vinculado a um responsável, a tela orienta a pedir o vínculo ao administrador.
- **Meus atendimentos em aberto:** os 5 mais antigos do usuário.
- Para o administrador, aviso quando já existem números de processo repetidos no banco (cadastrados antes desta versão), com a lista para conferir e corrigir.

**Pop-up de entrada** passa a se chamar "Resumo do dia" e mostra também a agenda de hoje e de amanhã da equipe, além dos processos e atendimentos do usuário.

**Processos duplicados:** o servidor recusa cadastrar, ou trocar para, um nº que já existe. A comparação ignora pontos, barras, traços e espaços, então "01.01.0227/2025-93" e "01 01 0227 2025 93" contam como o mesmo número. Na tela, o sistema avisa e abre o processo existente. Na importação, a planilha é recusada inteira, sem alterar nada, se tiver nº repetido entre as linhas ou nº já cadastrado (exceto quando a opção escolhida substitui aquele tipo). Repetições antigas não impedem editar outros campos desses processos.

**Eventos duplicados:** o servidor recusa o mesmo evento lançado de novo (mesmo tipo, título, datas e hora de início; maiúsculas e espaços não fazem diferença) e férias do mesmo servidor que se sobrepõem a férias já lançadas. Eventos cancelados não contam.

**Clique duplo em Salvar:** nos formulários de processo, atendimento e evento, cliques repetidos enquanto o salvamento está em andamento são ignorados.

**ATA e fotos no cadastro do evento:** o formulário de reunião e treinamento tem os campos ATA (ou Lista de presença, no treinamento) e Fotos (vários arquivos de uma vez). Os arquivos são enviados logo depois de salvar, e o detalhe mostra o andamento. No detalhe do evento também dá para escolher vários arquivos de uma vez. Continua valendo: o envio só funciona depois de criar o Blob privado na Vercel (passo a passo na versão 5, abaixo).

| Arquivo | Situação |
|---|---|
| `js/inicio.js` | novo (tela Início) |
| `api/data.js` | alterado (bloqueio de nº repetido no cadastro e na importação) |
| `api/eventos.js` | alterado (bloqueio de evento repetido) |
| `js/base.js` | alterado (menu, tela inicial padrão, pop-up, proteção contra clique duplo) |
| `js/processos.js`, `js/atendimentos.js`, `js/calendario.js`, `js/app.js`, `index.html` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v6.patch` com `git am --keep-cr` sobre a v5.1) e faça o push. Não há tabela nem variável nova.

Como testar:
1. Entre: o "Resumo do dia" mostra a agenda de hoje e amanhã. Ao fechar, aparece a tela Início.
2. Clique em Novo processo e digite o nº de um processo existente: o sistema avisa e abre o existente.
3. Lance uma reunião e tente lançar a mesma reunião de novo: o sistema recusa.
4. Lance uma reunião escolhendo a ATA e duas fotos no próprio formulário: depois de salvar, os três arquivos aparecem no detalhe.

---

## Versão 5.1: feriados e pontos facultativos

No Calendário, o administrador passa a lançar **Feriado ou ponto facultativo**: clique em Novo evento, escolha esse tipo, informe o nome, a classificação (Feriado nacional, estadual, municipal ou Ponto facultativo), a data de início e fim e, se quiser, o ato ou observação (ex.: o decreto). Para vários dias seguidos, basta um lançamento com início e fim.

- Aparece em vermelho, no topo do dia, e o número do dia fica vermelho. Continua aparecendo quando se filtra por servidor, porque vale para todos.
- Ao marcar reunião ou treinamento em feriado ou ponto facultativo, o detalhe mostra um aviso. Não impede salvar.
- Só o administrador lança, altera e exclui (regra conferida no servidor). Servidores apenas visualizam.
- O sistema não traz a lista de feriados pronta: as datas de ponto facultativo mudam a cada ano conforme decreto, então o lançamento é feito pelo administrador a partir do calendário oficial.

| Arquivo | Situação |
|---|---|
| `api/eventos.js`, `js/calendario.js`, `lib/comum.js`, `index.html` | alterados |
| `db/migracao_004_feriados.sql` | novo (coluna `classificacao` e novo tipo permitido em `eventos`) |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v5.1.patch` com `git am --keep-cr` sobre a v5) e faça o push. O banco é ajustado sozinho na primeira requisição; não há variável nova.

---

## Versão 5: Calendário

Novo grupo **Calendário** no menu, com a tela **Calendário da equipe**, disponível para todos os usuários.

- **Tipos de evento:** Reunião (local ou link, participantes da equipe, participantes externos, pauta), Treinamento (os mesmos campos e carga horária), Férias (servidor e período) e Agenda do servidor (período ou horário, com motivo reservado).
- **Agenda do servidor:** a equipe vê apenas "Ausente" ou "Compromisso pessoal". O motivo só é enviado pelo servidor para o próprio servidor e para o administrador; os demais nem recebem esse dado. O formulário orienta a não registrar diagnóstico nem detalhes de saúde.
- **Visões:** Mês (grade com dias, cores por tipo e "+n mais") e Semana (lista por dia). Filtros por tipo e por servidor. Clique no dia para ver tudo daquele dia ou lançar um evento nele. No celular, a grade mostra barras coloridas e o toque no dia abre a lista.
- **Cards:** eventos de hoje, próximos 7 dias, servidores fora do setor hoje e reuniões realizadas sem ATA (clique abre a lista).
- **Avisos que não impedem o salvamento:** férias que coincidem com as de outro servidor; participante de reunião ou treinamento que estará de férias ou ausente no período.
- **Situação exibida:** Agendado, Em andamento, Realizado (Encerrado para férias e agenda) e Cancelado. Para cancelar, edite o evento e marque "Evento cancelado"; ele continua no calendário, riscado.
- **Foto, ATA e lista de presença** (só em reuniões e treinamentos): PDF, JPG ou PNG, até 10 MB, até 30 arquivos por evento. Qualquer usuário logado abre os anexos; enviar e remover é para quem lançou o evento ou o administrador (quem enviou o arquivo também pode removê-lo).
- **Permissões no servidor:** qualquer usuário lança reunião e treinamento; férias e agenda, o servidor lança só para si (o administrador lança para qualquer um); altera e exclui quem lançou, o próprio servidor (férias e agenda) ou o administrador.
- **Log:** lançamento, alteração, exclusão, envio e remoção de anexo aparecem em Usuários e Log.
- **Relatórios gerenciais:** novo quadro "Agenda da equipe" com reuniões e treinamentos realizados e cancelados no período, quantos têm ATA ou lista de presença anexada, participações e horas de treinamento. Entra também no PDF e no Excel.

### Como os arquivos ficam protegidos

Os arquivos ficam no **Vercel Blob em modo privado**: o endereço do arquivo não abre sem autorização. O fluxo é este:

1. O navegador pede ao servidor um link de envio. O servidor confere login, permissão, extensão, tipo e tamanho, e devolve um link assinado que vale 10 minutos e só aceita aquele arquivo, daquele tipo, até 10 MB.
2. O navegador envia o arquivo direto para o Blob. Isso evita o limite de 4,5 MB do corpo das requisições das funções da Vercel.
3. O servidor lê o começo do arquivo recebido e confere se é mesmo PDF, JPG ou PNG. Se não for, apaga o arquivo e recusa. Só então o anexo aparece no evento.
4. Para abrir, o servidor confere o login e devolve um link assinado que vale 5 minutos.

Envios interrompidos são apagados automaticamente depois de 1 hora. Ao excluir um evento, os arquivos dele também são apagados do Blob.

### Arquivos

| Arquivo | Situação |
|---|---|
| `api/eventos.js` | novo (API do calendário e dos anexos) |
| `js/calendario.js` | novo (telas do calendário) |
| `db/migracao_003_calendario.sql` | novo (tabelas `eventos`, `evento_participantes`, `evento_anexos`) |
| `lib/comum.js` | alterado (cria as tabelas novas sozinho) |
| `js/base.js` | alterado (menu, ícones, navegação, atualização automática) |
| `js/relatorios.js` | alterado (quadro Agenda da equipe) |
| `js/usuarios.js` | alterado (nomes das novas ações no log) |
| `index.html` | alterado (estilos do calendário e inclusão do novo arquivo) |
| `package.json` | alterado (dependência `@vercel/blob`) |

### Publicação

1. Substitua os arquivos pelos do zip (ou aplique `hub-dbm-v5.patch` com `git am --keep-cr`) e faça o push. A Vercel instala o `@vercel/blob` sozinha pelo `package.json`.
2. Nas configurações do projeto na Vercel, confira em "Node.js Version" que o projeto usa a versão 20 ou mais nova (exigência do `@vercel/blob`).
3. Crie o armazenamento de anexos: no projeto da Vercel, aba **Storage** > **Create** > **Blob** > **Continue**, escolha acesso **Private** e conecte ao projeto (Production e Preview). A Vercel cria as variáveis sozinha (`BLOB_STORE_ID` e `BLOB_READ_WRITE_TOKEN`); não é preciso copiar token.
4. Faça um novo deploy (Deployments > Redeploy) para as variáveis valerem.

As tabelas são criadas sozinhas. O `db/migracao_003_calendario.sql` serve para quem preferir rodar no Neon antes. Se o Blob ainda não estiver configurado, o calendário funciona normalmente e só o envio de arquivos fica bloqueado, com aviso na tela.

**Plano gratuito (Hobby):** segundo a documentação da Vercel consultada em 21/10/2026, o Blob inclui 1 GB de armazenamento, 10.000 operações simples, 2.000 operações avançadas e 10 GB de transferência por mês. Ao passar do limite, não há cobrança, mas o Blob fica bloqueado até completar 30 dias. Para durar mais, prefira ATA em PDF e fotos reduzidas (o celular costuma gerar fotos de 3 a 5 MB).

### Como testar

1. Abra Calendário da equipe e clique em Novo evento. Lance uma reunião para hoje com dois participantes e pauta.
2. No detalhe da reunião, escolha "ATA", selecione um PDF e clique em Enviar. O arquivo aparece na lista; clique no olho para abrir.
3. Tente enviar um arquivo .docx ou um PDF de mais de 10 MB: o sistema recusa.
4. Lance férias para um servidor e, em seguida, férias de outro servidor em datas que se sobrepõem: o detalhe mostra o aviso.
5. Entre como Servidor A e lance uma Agenda do servidor com motivo. Entre como Servidor B: o calendário mostra "Ausente" ou "Compromisso pessoal", sem o motivo.
6. Como Servidor B, abra a reunião lançada pelo administrador: os anexos abrem, mas não há botão de enviar, editar ou excluir.
7. Em Relatórios gerenciais, confira o quadro Agenda da equipe e gere o PDF.
8. Em Usuários e Log, confira os registros do calendário e dos anexos.

---

## Versão 4: Relatórios gerenciais

Nova tela **Relatórios gerenciais** no menu (grupo Relatórios), disponível para todos os usuários. Os números são calculados a partir dos processos e atendimentos já cadastrados; não há tabela nova nem mudança de banco.

- **Período:** Mês, Trimestre, Ano ou Intervalo de datas. Período em curso vai até hoje e é comparado com o mesmo número de dias do período anterior (1 a 21/out contra 1 a 21/set). Período encerrado é comparado com o mês, trimestre ou ano anterior inteiro.
- **Cards:** processos recebidos, concluídos e em aguardo no fim do período, atendimentos registrados e finalizados, com a variação em relação ao período anterior.
- **Quadros:** Processos por tipo (recebidos, concluídos, em aguardo, tempo médio até concluir, bens nos processos concluídos); Entradas e conclusões por mês (quando o período tem mais de um mês); Processos em aguardo por responsável; Processos acima do prazo crítico; Interessados com mais processos; Atendimentos por canal, por categoria e por atendente; Órgãos com mais atendimentos.
- **Gerar PDF:** abre a impressão do navegador em A4, com cabeçalho "Coordenadoria de Patrimônio · DBM", período e rodapé com data, hora e nome de quem emitiu. Escolha "Salvar como PDF" na impressora.
- **Excel:** um arquivo com uma aba por quadro, com todas as linhas (na tela e no PDF as listas longas mostram as primeiras 10 ou 25).
- O quadro "Agenda da equipe" entrou na versão 5, junto com o Calendário.
- Correção: as exportações em PDF das listas passaram a usar o mesmo tamanho de letra em cabeçalho e linhas.

| Arquivo | Situação |
|---|---|
| `js/relatorios.js` | novo |
| `js/base.js` | alterado (menu, navegação, cabeçalho do PDF das listas) |
| `js/atendimentos.js` | alterado (atualiza também a tela de relatórios) |
| `index.html` | alterado (estilos dos quadros e inclusão do novo arquivo) |

Como testar:
1. Abra Relatórios gerenciais com o mês atual e confira se "Processos recebidos" bate com os processos com entrada neste mês em Todos os Processos (filtro Entrada de/até).
2. Troque para Ano e veja o quadro por mês aparecer.
3. Clique em Gerar PDF e salve como PDF; confira cabeçalho, quadros e rodapé.
4. Clique em Excel e confira uma aba por quadro.

---

## Versão 3: Gestão de Atendimentos e ajustes de layout

Esta versão inclui tudo da versão 2 (descrita mais abaixo) e acrescenta:

**Ajustes pedidos**
- Filtros: cada campo fica dentro da sua coluna; texto longo é cortado com reticências, sem invadir o campo ao lado.
- Assunto não usa mais o texto da Observação. Agora vem do Motivo/Assunto do processo; se estiver vazio, da Descrição; se também estiver vazia, do tipo do processo.
- Rolagem: barra fina e discreta, nas cores do tema claro e escuro; nos modais, o título fica fixo no topo enquanto o conteúdo rola.

**Módulo Gestão de Atendimentos** (menu agora agrupado em Gestão de Processos, Gestão de Atendimentos e Administração)
- Registro com data, hora, órgão, solicitante, contato, categoria, assunto, descrição, canal, atendente, situação, data de finalização e processo vinculado (opcional).
- Situações: Em atendimento, Aguardando análise interna, Aguardando retorno do solicitante, Finalizado. Ao escolher Finalizado, a data de finalização é preenchida com hoje; ao reabrir, ela é apagada.
- Cards: Em aberto, Meus em aberto (clique filtra os seus), Finalizados no mês, Tempo médio até finalizar.
- Filtros automáticos (Andamento, Situação, Atendente, Órgão, Canal, Categoria, Assunto, Data de/até), busca, Excel e PDF.
- Linha amarela: aberto há mais de 7 dias; vermelha: mais de 30 dias.
- Histórico do atendimento, com registros automáticos (registro, mudança de situação, transferência de atendente, vínculo com processo) e manuais.
- O pop-up de entrada mostra os processos e também os atendimentos em aberto do usuário.
- No detalhe do processo aparecem os atendimentos vinculados a ele.
- Nova lista "Assuntos (atendimentos)" em Listas e Relatórios > Cadastros.
- Permissões no servidor: qualquer usuário registra; só o atendente responsável ou o administrador altera; só o administrador exclui.

**Organização do código** (conforme o plano aprovado): o JavaScript saiu do `index.html` e foi dividido por módulo, e a API ganhou um arquivo por módulo com as funções comuns em `lib/comum.js`. Continua sem framework e sem etapa de compilação.

| Arquivo | Situação | Conteúdo |
|---|---|---|
| `index.html` | alterado | Só HTML e CSS; carrega os arquivos de `js/` |
| `js/base.js` | novo | Ícones, login, comunicação com a API, menu, pop-up de entrada, funções compartilhadas |
| `js/processos.js` | novo | Telas de processos, filtros, detalhe, histórico, formulário, relatórios, listas, importação |
| `js/atendimentos.js` | novo | Módulo de atendimentos |
| `js/usuarios.js` | novo | Usuários e Log |
| `js/app.js` | novo | Inicia o sistema (carregado por último) |
| `lib/comum.js` | novo | Banco, sessão, senhas, validação e log, usados por todas as APIs |
| `api/data.js` | alterado | Processos, login e usuários, agora usando `lib/comum.js` |
| `api/atendimentos.js` | novo | API dos atendimentos |
| `db/migracao_002_atendimentos.sql` | novo | Tabela `atendimentos` e coluna `atendimento_id` no histórico |

Publicação: igual à versão 2. Não há variável nova. Se a versão 2 já estiver no ar, basta substituir os arquivos (ou aplicar o patch v3) e fazer o push; as tabelas novas são criadas sozinhas.

Como testar os atendimentos:
1. Entre, abra Atendimentos e clique em Novo atendimento. Preencha e salve com situação "Aguardando análise interna".
2. No detalhe, registre um andamento. Depois edite e mude para Finalizado: a data de finalização vem preenchida e o histórico registra a finalização.
3. Cadastre outro em aberto, vinculado a um nº de processo existente. Abra esse processo: o atendimento aparece em "Atendimentos vinculados".
4. Clique em Sair e entre de novo: o pop-up lista o atendimento em aberto.
5. Entre como Servidor e tente editar um atendimento de outra pessoa: o sistema informa que só o atendente ou o administrador pode alterar.
6. Em Usuários e Log, confira os registros de atendimento.

---

# Versão 2: ajustes da Gestão de Processos

Versão com login individual, log de atividades, histórico do processo, campos Descrição e Setor atual, novos cards do dashboard, filtros automáticos na tela de Transferências e aviso de processos ao entrar.

## Arquivos alterados

| Arquivo | Situação | O que mudou |
|---|---|---|
| `api/data.js` | alterado | Login por usuário com senha em hash (scrypt), sessão em cookie seguro, permissões por perfil no servidor, validação dos dados do processo, histórico automático, log de atividades, gestão de usuários |
| `index.html` | alterado | Tela de login e de configuração inicial, dashboard por tipo, filtros da Transferência, Descrição e Setor atual no formulário, histórico no detalhe do processo, pop-up ao entrar, tela Usuários e Log, Alterar minha senha, Sair |
| `db/migracao_001_usuarios_historico_log.sql` | novo | Script das tabelas novas (`usuarios`, `historico`, `log_atividades`) |
| `ENTREGA.md` | novo | Este documento |

`package.json`, `seed.json` e `xlsx.min.js` não mudaram. Nenhuma dependência nova foi adicionada.

## O que já existia e foi aproveitado

- O campo **Observação** já existia no formulário (campo `obs`). Agora ele também aparece em destaque no detalhe do processo.
- Os filtros já aplicavam ao escolher a opção. O que mudou foi a lista de filtros, o painel aberto por padrão e as opções dependentes.
- O detalhe do processo já tinha uma linha do tempo calculada (documento, entrada, conclusão). Ela foi mantida e o histórico registrado ficou logo abaixo.

## Ajustes, um por um

**Total de Processos na Transferência.** O card agora conta só os não concluídos (Em análise + Em tramitação). Com os seus números: 27 + 1 = 28.

**Correção encontrada no caminho.** O status `EM ANÁLISE` era contado como "Em tramitação" na tela de Transferências, porque a regra só reconhecia `RECEBIDO` e `PEND`. Agora `EM ANÁLISE` conta como Em análise.

**Filtros da Transferência.** Ficaram exatamente: Assunto, Interessado, Recebedor, Responsável, Setor atual, Status, Prioridade, Entrada de, Entrada até. Entendi "automático" assim: o painel já abre visível, o filtro aplica no momento em que você escolhe a opção (sem botão), e cada lista mostra só as opções que existem com os outros filtros escolhidos, com a quantidade entre parênteses. As outras telas continuam com os filtros que tinham.

**Descrição.** Campo novo logo abaixo do Nº do processo. Aparece no detalhe, na tabela de Transferências, em Todos os Processos, na busca, nos relatórios e na planilha exportada e importada.

**Setor atual.** O filtro "Setor atual" pedido não tinha de onde tirar informação, porque o formulário não tinha esse campo (todo processo aparecia como DBM ou Concluído). Incluí o campo no formulário; se ficar vazio, continua sendo DBM.

**Histórico do processo.** No detalhe do processo há o campo para registrar data e descrição de qualquer andamento, mesmo com o processo em aberto (por exemplo, "Anexado ofício de resposta do órgão"). Cada registro mostra data, descrição, quem registrou e quando. O sistema também registra sozinho: cadastro, mudança de status, mudança de responsável, mudança de setor e conclusão. Registros não podem ser apagados pela tela, para preservar a rastreabilidade.

**Login individual e log.** Cada servidor tem login e senha próprios. Perfis:

| Ação | Servidor | Administrador |
|---|---|---|
| Consultar, cadastrar, editar e concluir processos | sim | sim |
| Registrar andamento no histórico | sim | sim |
| Editar listas (status, órgãos etc.) | sim | sim |
| Excluir processo | não | sim |
| Importar dados | não | sim |
| Criar e editar usuários, ver o log | não | sim |

As permissões são checadas no servidor, não só escondendo botões. O log registra entrada, saída, tentativa de acesso recusada, cadastro, alteração e exclusão de processo, registro no histórico, importação, alteração de listas e de usuários, com data, hora, usuário e IP. Após 5 senhas erradas em 15 minutos o login fica bloqueado por 15 minutos.

**Dashboard.** Cards: Total de Processos, Processos em aguardo, e dois grupos (Alienação e Transferência) com Total, Concluídos, Em análise e Em tramitação. Incluí "Em tramitação" porque sem ele a soma não fecha com o total (no seu exemplo, o 1 processo em tramitação sumiria). Clicar no card abre a tela correspondente. Também troquei "Pendentes" por "Em aguardo" nos gráficos.

**Pop-up ao entrar.** Depois do login aparece a lista dos processos não concluídos cujo Responsável é o servidor que entrou, do mais antigo para o mais novo. Para isso, cada usuário precisa estar vinculado ao nome da lista de Responsáveis (campo "Responsável vinculado" no cadastro de usuário). Aparece uma vez a cada login.

## Como publicar na Vercel

1. Na Vercel, abra o projeto, vá em **Settings > Environment Variables** e crie `SESSION_SECRET` com um valor aleatório longo (mínimo 32 caracteres). Para gerar, rode no terminal do seu computador:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Mantenha `DATABASE_URL` e `APP_PASSWORD` como estão. A `APP_PASSWORD` passa a servir só como chave de instalação do primeiro administrador.
3. Substitua os arquivos no repositório (ou aplique o patch, ver abaixo), faça commit e push. A Vercel publica sozinha.
4. Faça um backup antes: no sistema atual, clique em **Backup (JSON)**. As tabelas novas são criadas sem mexer nos processos existentes.

O caminho mais simples é extrair o zip da versão mais recente (`HUB_CPAT-v4.zip`) e copiar os arquivos por cima da pasta do repositório (mantendo a pasta `.git`), depois `git add -A`, `git commit` e `git push`.

Se preferir aplicar os patches, na pasta do repositório (Git Bash ou PowerShell). Aplique só os patches das versões que ainda não estão no repositório. Se o `git am` recusar por diferença de quebra de linha, use o zip:
```
git checkout -b hub-dbm-v4
git am --keep-cr hub-dbm-v2.patch hub-dbm-v3.patch hub-dbm-v4.patch
git push -u origin hub-dbm-v4
```
Abra o Pull Request no GitHub e confira o Preview da Vercel antes de juntar na branch principal.

## Primeiro acesso

1. Abra o sistema. Como ainda não há usuários, aparece **Configuração inicial**.
2. Informe a chave de instalação (valor da `APP_PASSWORD`), seu nome, um login (minúsculas, números, ponto ou sublinhado) e uma senha de pelo menos 8 caracteres. Você entra como administrador.
3. Em **Usuários e Log > Novo usuário**, cadastre cada servidor, escolha o perfil e vincule ao nome da lista de Responsáveis. Vincule também o seu usuário, se você for responsável por processos.
4. Entregue a senha inicial de forma reservada e peça para cada servidor trocar em **Alterar minha senha**.

## Como testar

1. **Login:** entre com senha errada (mensagem "Login ou senha inválidos"); entre com a certa.
2. **Pop-up:** atribua um processo em aberto ao seu responsável, clique em Sair e entre de novo. A lista deve aparecer.
3. **Transferências:** confira se Total de Processos = Em análise + Em tramitação. Escolha um Status no filtro e veja as demais listas se ajustarem.
4. **Descrição e Setor:** edite um processo, preencha os dois campos, salve e abra o detalhe.
5. **Histórico:** no detalhe, registre um andamento com data de ontem. Mude o status do processo e confira o registro automático com seu nome.
6. **Permissões:** entre com um usuário de perfil Servidor. Não devem aparecer Excluir, Importar dados nem Usuários e Log.
7. **Log:** como administrador, abra Usuários e Log e confira as ações dos testes acima.

## Pontos de atenção

- Importar no modo "Substituir" apaga também o histórico dos processos substituídos (a prévia da importação avisa).
- O histórico registra o texto do andamento. Guardar o arquivo em si (PDF, foto) fica para a etapa do Calendário, que já vai precisar de armazenamento de arquivos para fotos e ATAs.
- O log guarda o IP de quem acessou, para fins de auditoria. Defina com a gestão por quanto tempo esse registro deve ser mantido.
- Testado localmente com PostgreSQL 16 e Chromium (administrador, servidor e primeiro acesso). Não foi testado no Neon nem na Vercel de vocês.
