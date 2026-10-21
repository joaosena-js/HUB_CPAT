# Hub DBM: entrega

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
