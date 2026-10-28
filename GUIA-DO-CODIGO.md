# Guia de leitura do código do Hub Patrimonial

Este guia explica como o código do Hub Patrimonial (antigo Hub DBM) está organizado, para quem está começando a ler. Você não precisa entender tudo de uma vez. Comece pelo mapa de arquivos, escolha uma tela que já conhece e siga o caminho de um clique, como no exemplo da seção 4.

## 1. As três partes do sistema

O sistema tem três partes, e cada uma fica em uma pasta.

| Parte | Onde fica | O que faz |
|---|---|---|
| Navegador (o que o usuário vê) | `index.html` e a pasta `js/` | Desenha as telas, os formulários, os filtros, os gráficos e as exportações em Excel e PDF |
| Servidor (as regras) | pastas `api/` e `lib/` | Confere quem está logado e o que cada perfil pode fazer, valida os dados e grava no banco |
| Banco de dados | Neon (PostgreSQL), com scripts na pasta `db/` | Guarda processos, atendimentos, eventos, usuários, histórico e log |

Uma regra importante: o navegador pode ser manipulado por quem usa o sistema, por isso toda regra de segurança fica no servidor. Esconder um botão na tela melhora a experiência, mas quem protege é o servidor.

## 2. Mapa de arquivos

### Navegador (`js/`)

Os arquivos são carregados pelo `index.html` nesta ordem, e cada um pode usar o que os anteriores criaram:

| Arquivo | Conteúdo |
|---|---|
| `js/base.js` | Funções usadas por todas as telas: ícones, login, comunicação com o servidor (`api`), menu, troca de tela (`go`, `draw`), tema claro e escuro, pop-up Resumo do dia, exportação para Excel e PDF |
| `js/processos.js` | Gestão de Processos: Dashboard, Caixa do Setor, Alienações, Transferências, Todos os Processos, Vida do Processo, detalhe com histórico, formulário, Listas e Relatórios, cadastros e importação de planilha |
| `js/atendimentos.js` | Gestão de Atendimentos: tela, filtros, detalhe com histórico, formulário e importação de planilha |
| `js/relatorios.js` | Relatórios gerenciais (quadros por mês, trimestre, ano ou intervalo de datas, com comparação ao período anterior) |
| `js/calendario.js` | Calendário: reuniões, treinamentos, outros eventos, férias, agenda do servidor, feriados e aniversários, anexos e exportação por tipo |
| `js/inicio.js` | Tela Início, com os atalhos, a agenda da semana e os itens do usuário |
| `js/usuarios.js` | Usuários e log de atividades (somente administrador) |
| `js/app.js` | Último a ser carregado: desenha a primeira tela e liga a atualização automática |

### Servidor (`api/` e `lib/`)

| Arquivo | Conteúdo |
|---|---|
| `lib/comum.js` | Base de todas as APIs: conexão com o banco, criação das tabelas, senhas (scrypt), sessão (cookie assinado), validação de datas e textos, registro no log |
| `api/data.js` | Login, sessão, processos, listas de cadastro, usuários e log |
| `api/atendimentos.js` | Atendimentos e o histórico deles, incluindo a importação |
| `api/eventos.js` | Calendário, participantes, permissões por tipo de evento e anexos (Vercel Blob) |

### Outros arquivos

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página e todo o visual (CSS: cores, tamanhos, versão para celular) |
| `db/migracao_00X_*.sql` | Scripts que criam ou alteram tabelas no banco, em ordem |
| `seed.json` | Dados de exemplo usados só para carregar um banco vazio |
| `xlsx.min.js` | Biblioteca pronta que lê e gera planilhas Excel. Não deve ser editada |
| `.prettierrc.json` | Regras de formatação do código (veja a seção 7) |

## 3. Como ler um arquivo de tela

Os arquivos de tela seguem sempre o mesmo padrão:

1. No topo ficam as listas fixas (por exemplo, `AT_CANAIS`, com os canais de atendimento) e as variáveis que guardam os dados carregados (por exemplo, `AT`, com os atendimentos).
2. Depois vêm as funções. Cada uma tem um comentário de uma linha acima dizendo o que faz.
3. As funções de tela devolvem HTML em forma de texto, entre crases. Exemplo:

```js
`<td>${esc(a.solicitante)}</td>`
```

O que está dentro de `${ }` é trocado pelo valor na hora de desenhar. A função `esc` protege o texto antes de colocá-lo na tela, para que ninguém consiga injetar código (proteção contra XSS). Todo texto digitado por usuário passa por ela.

4. Os botões chamam funções pelo `onclick`. Por exemplo, `onclick="atDet(5)"` abre o detalhe do atendimento de número 5. Para descobrir o que um botão faz, procure no projeto o nome da função que aparece no `onclick`.

No VS Code, `Ctrl+Shift+F` pesquisa em todos os arquivos e `F12`, com o cursor sobre o nome de uma função, vai direto para onde ela foi escrita.

## 4. Exemplo: o caminho do botão "Novo atendimento"

1. `index.html`: o botão do cabeçalho tem `onclick="atEd(0)"`.
2. `js/atendimentos.js`, função `atEd`: desenha o formulário. O número 0 significa "novo".
3. Ao clicar em Salvar, a função `atSv` lê os campos e chama `api({ op: 'save', item: b }, '/api/atendimentos')`.
4. `js/base.js`, função `api`: envia o pedido ao servidor e, se der erro, mostra a mensagem que o servidor devolveu.
5. `api/atendimentos.js`: o servidor confere a sessão, passa os dados pela função `validar`, que recusa valores fora das listas e datas inexistentes, e entra no trecho `if (b.op === 'save')`, que grava no banco e registra o histórico.
6. De volta ao navegador, `atLoad` busca a lista atualizada e `atDet` abre o detalhe do atendimento salvo.

Quase todas as ações do sistema seguem esse mesmo caminho: botão, função de tela, `api`, arquivo da pasta `api/` (no trecho do `op` correspondente) e banco.

## 5. Nomes curtos que aparecem em todo lugar

Alguns nomes são curtos porque são usados centenas de vezes. Os principais:

| Nome | Significado |
|---|---|
| `$('#id')` | Pega um elemento da página pelo id |
| `esc(texto)` | Protege o texto antes de mostrar na tela |
| `nz(texto)` | Texto sem acento e em minúsculas, usado nas pesquisas |
| `TS()` | Data de hoje, no formato aaaa-mm-dd |
| `fmt(data)` | Converte aaaa-mm-dd para dd/mm/aaaa |
| `D` | Lista de processos carregados |
| `L` | Listas de cadastro (status, responsáveis, órgãos, motivos, assuntos) |
| `ME` | Usuário logado |
| `adm()` | Verdadeiro quando o usuário logado é administrador |
| `AT` | Lista de atendimentos carregados |
| `EV` | Lista de eventos do calendário |
| `tab` | Tela aberta no momento |
| `draw()` | Redesenha a tela atual |
| `go('tela')` | Troca de tela |
| `api(pedido, endereço)` | Envia um pedido ao servidor |
| `done(processo)` | Verdadeiro quando o processo está concluído (status começa com CONCLU) |
| `#dd` e `#dg` | Janelas que abrem por cima da tela. `#dd` é usada por quase tudo (detalhes, formulários de atendimento e evento, importações); `#dg` é o formulário de processo |

Os prefixos ajudam a saber de qual módulo é cada função: `at` é de atendimentos (`atEd`, `atSv`), `ev` e `ca` são do calendário (`evEd`, `caMes`), `rg` é dos relatórios gerenciais, `usu` é de usuários e `in` é da tela Início.

## 6. Onde mexer para mudanças comuns

| Quero mudar | Onde |
|---|---|
| Cores, tamanhos, espaçamentos | `index.html`, no bloco `<style>`. As cores ficam em variáveis como `--pr` no início do bloco |
| Itens do menu lateral | `js/base.js`, lista `NAV` |
| Colunas da tabela de processos | `js/processos.js`, lista `CT` |
| Colunas da tabela de atendimentos | `js/atendimentos.js`, lista `AT_C` (tela) e `AT_X` (exportação) |
| Canais, categorias e situações de atendimento | `js/atendimentos.js` (`AT_CANAIS`, `AT_CATS`, `AT_SIT`) e também `api/atendimentos.js` (`CANAIS`, `CATEGORIAS`, `SITUACOES`), porque o servidor confere os mesmos valores |
| Tipos de evento do calendário | `js/calendario.js` e `api/eventos.js`, além de uma migração na pasta `db/`, porque o banco também restringe os tipos |
| Prazos de Atenção e Crítico | Pela própria tela, em Listas e Relatórios, aba Cadastros. Não precisa mexer no código |

Sempre que uma lista existir no navegador e no servidor, as duas precisam ser alteradas juntas. Se mudar só no navegador, o servidor recusa o valor novo.

## 7. Como manter o código organizado

O código foi formatado com o Prettier, uma ferramenta que organiza indentação, espaços e quebras de linha automaticamente. As regras estão em `.prettierrc.json`. Para continuar assim:

1. No VS Code, instale a extensão "Prettier - Code formatter".
2. Em Configurações, ative "Format On Save" (Formatar ao salvar).
3. Pronto: a cada `Ctrl+S` o arquivo é reorganizado no mesmo padrão.

Algumas linhas continuam longas. São trechos de HTML com muitos valores no meio, ou os desenhos dos ícones, que o Prettier não quebra para não alterar o que aparece na tela.

## 8. Cuidados antes de alterar

- Teste localmente antes de enviar para a Vercel. Um erro em `js/base.js` derruba todas as telas.
- Não grave senha, chave ou endereço do banco no código. Eles ficam nas variáveis de ambiente da Vercel (`DATABASE_URL`, `SESSION_SECRET`, `APP_PASSWORD` e as do Blob).
- Regra nova de permissão vai no servidor (pasta `api/`), e não apenas escondendo o botão na tela.
- Alteração de tabela no banco vai em um arquivo novo na pasta `db/`, com o número seguinte (por exemplo, `migracao_006_...sql`), para manter o registro do que foi feito.
