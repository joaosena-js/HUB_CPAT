# Hub DBM: entrega dos ajustes da Gestão de Processos

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

Aplicando o patch, na pasta do repositório (Git Bash ou PowerShell):
```
git checkout -b ajustes-login-historico
git am hub-dbm-v2.patch
git push -u origin ajustes-login-historico
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
