# Hub Patrimonial: entrega

## Versão 7.8: lista de veículos ordenada pelo Nº

**Ordem padrão:** a tabela da tela Veículos passa a abrir sempre na ordem do Nº de ordem, do menor para o maior (1, 2, 3…). Antes ela seguia a ordem de cadastro no banco, do mais recente para o mais antigo.

**Inverter a ordem:** clique no título da coluna Nº. A lista passa a ir do maior para o menor; um novo clique volta para o menor para o maior. A seta ao lado do título mostra a direção atual (▲ do menor para o maior, ▼ do maior para o menor), e o título fica em azul para indicar que pode ser clicado. Ao inverter, a lista volta para a primeira página.

**Como a ordenação funciona:**
- A comparação é numérica: o 2 vem antes do 10 (em ordem de texto, o 10 viria antes).
- A ordem é mantida junto com a pesquisa, os filtros e a paginação. Por exemplo, ao filtrar só motocicletas, elas aparecem na ordem do Nº escolhida.
- O Excel e o PDF exportados pela tela saem na mesma ordem da tela.
- Um veículo sem Nº (não deveria existir, porque o número é automático desde a versão 7.6) fica sempre no fim da lista.
- A escolha vale enquanto a página estiver aberta. Ao recarregar a página, a lista volta ao padrão, do menor para o maior.
- Pelo teclado, Tab chega ao título Nº e Enter inverte a ordem; o foco continua no título. Para leitores de tela, o título informa a direção atual.

**Nada mudou no servidor nem no banco:** a ordenação é feita no navegador, sobre a lista já carregada.

**Arquivos alterados:** `js/veiculos.js` (funções `veCmp`, `veOrd` e `veThOrd`; `veRows` ordena a lista), `index.html` (estilo do título que ordena), `js/base.js` (versão 7.8), `ENTREGA.md` e `GUIA-DO-CODIGO.md`.

**Testes (local, com navegador automatizado e dados simulados de 31 veículos):** ordem padrão 1 a 25 na primeira página; clique inverte para 30, 29…; segunda página em ordem decrescente termina no 1 e no veículo sem Nº; Nº gravado como texto ("10") ordenado como número; pesquisa e filtro de tipo mantêm a ordem; inverter volta à página 1; Enter pelo teclado inverte e mantém o foco; exportação na mesma ordem; tema escuro; celular com 375 px sem rolagem lateral; nenhum erro no console. Ainda não foi testado com o banco real na Vercel.

## Versão 7.7: menu do perfil no canto superior direito

**Menu do perfil:** as ações do usuário saíram do rodapé do menu lateral e foram para um ícone redondo com as iniciais do nome (por exemplo, "JS" para João Sena), no canto superior direito, ao lado do botão Novo processo. Ao clicar, abre uma lista com:
- nome e perfil (Administrador ou Servidor);
- Planilha completa, Backup (JSON) e Importar dados (este último só para administrador, como antes);
- Alterar minha senha e Sair, separados das demais por uma linha. Sair fica em vermelho ao passar o mouse.

**Como a lista se comporta:**
- Fecha ao clicar ou tocar fora dela, ao escolher uma opção e com a tecla Esc.
- Pelo teclado: Tab chega ao ícone, Enter ou seta para baixo abre a lista, as setas percorrem as opções, Home e End vão à primeira e à última, Esc fecha e devolve o foco ao ícone.
- A atualização automática (a cada 30 segundos) não fecha a lista aberta.
- Funciona no tema claro e no escuro e no celular, onde a lista ocupa a largura disponível sem criar rolagem lateral.
- Para leitores de tela, o ícone se anuncia como "Menu do usuário: nome, perfil".

**Nada mudou nas permissões:** as opções aparecem nas mesmas condições de antes, e o servidor continua conferindo o perfil em cada ação (por exemplo, a importação de dados só é aceita de administrador).

**Menu lateral:** sem o rodapé, sobra mais espaço para os itens de navegação.

**Arquivos alterados:** `index.html` (estilos do menu do perfil, ícone no topo e remoção do rodapé do menu lateral), `js/base.js` (função `pf`, que monta o menu, e o controle de abrir e fechar; versão 7.7), `ENTREGA.md` e `GUIA-DO-CODIGO.md`.

**Testes (local, com navegador automatizado):** administrador vê as 5 opções e servidor vê 4 (sem Importar dados); Planilha completa e Backup (JSON) baixaram os arquivos; Importar dados e Alterar minha senha abriram as janelas; Sair encerrou a sessão; clique fora, toque fora e Esc fecham a lista; navegação por setas, Home e End; redesenho da tela com a lista aberta; tema escuro; celular com 375 px de largura sem rolagem lateral; nenhum erro no console.

## Versão 7.6: documentos do veículo, detalhe em abas e prontuário em paisagem

**Detalhe do veículo em abas:** Informações do veículo, Documentos, Fotos e Lista de Verificação. As abas mostram a contagem (por exemplo, "Documentos (3/8)" e "Fotos (2)"). Depois de salvar uma foto, um documento ou a Lista de Verificação, a janela continua na mesma aba.

**Aba Documentos:** os documentos CRLV, DUT, Relatório do AJURI, Ficha do DETRAN, DNIT, IMMU, PRF e SEFAZ.
- Marque a caixa do documento que o veículo possui. Aparece o campo para anexar o arquivo (PDF, JPG ou PNG, até 10 MB, até 5 arquivos por documento).
- Anexar um arquivo marca o documento automaticamente.
- Para desmarcar um documento que tem arquivo, remova o arquivo antes. O sistema avisa.
- O servidor confere o conteúdo real do arquivo (um arquivo renomeado para .pdf é recusado), como já acontece nas fotos.
- Remover um arquivo segue a regra das fotos: quem enviou ou o administrador.
- Tudo fica no Log de atividades (documento marcado, desmarcado, enviado e removido).
- O envio de arquivos depende do Vercel Blob, o mesmo das fotos. Sem o Blob, a marcação funciona e o campo de envio mostra um aviso.

**Botão Baixar prontuário** (no topo do detalhe do veículo): abre a folha A4 em paisagem para imprimir ou salvar em PDF, com o brasão do Governo, nº de ordem, órgão, placa em destaque, os dados do cadastro, as caixas dos 8 documentos (marcadas com X quando o veículo possui o documento) e a data de emissão. A emissão fica registrada no log como exportação em PDF.

**Nº de ordem automático:** novo campo do veículo, preenchido pelo sistema. Ele aparece no detalhe, na primeira coluna da lista, no Excel e no prontuário.
- Na publicação, os veículos já cadastrados recebem a numeração pela ordem em que estão no banco (1, 2, 3…). Como a planilha foi importada na ordem das linhas, os números coincidem com a coluna "#" dela (no teste, o NOX-0679 recebeu o 76).
- Cada veículo novo, cadastrado pelo formulário ou pela importação, recebe o maior número já usado mais 1. O número não é digitado nem alterado no formulário.
- A exclusão de um veículo não renumera os outros, para que o número impresso no prontuário continue valendo.

**Órgão em uma linha no prontuário:** o nome do órgão (e também o nº de ordem e a placa) nunca quebra de linha. Quando o texto é maior que a caixa, a letra diminui até caber.

**Banco:** as colunas `veiculos.ordem` e `veiculos.documentos` e a tabela `veiculo_documentos` são criadas sozinhas no primeiro acesso. O registro está em `db/migracao_008_veiculos_documentos.sql`. Ao excluir um veículo, os arquivos dos documentos também são apagados do armazenamento.

**Arquivos alterados:** `js/veiculos.js`, `api/veiculos.js`, `lib/comum.js`, `index.html` (estilos), `js/base.js` (versão), `img/prontuario-cabecalho.png` e `img/prontuario-rodape.png` (novas), `db/migracao_008_veiculos_documentos.sql` (novo), `GUIA-DO-CODIGO.md`.

**Testes (local, com Postgres e simulador do Blob):** importação da planilha de 01/09/2026 (78 veículos); numeração automática dos já cadastrados pela ordem do banco (1 a 78, NOX-0679 = 76) e dos novos pelo formulário e pela importação (79, 80, 81); prontuário com órgão curto, SSP-AM e nome longo, sempre em uma linha; marcação e desmarcação de documentos; envio de PDF e JPG; recusa de arquivo falso e de documento inválido; bloqueio ao desmarcar documento com arquivo; exclusão do veículo apagando fotos e documentos; prontuário gerado em 1 página A4 paisagem; tela no celular sem rolagem lateral (só as abas rolam). O envio real ao Vercel Blob ainda não foi testado na Vercel.

## Versão 7.5: mensagens do sistema, troca obrigatória de senha e encerramento por inatividade

**Mensagens do próprio sistema:** as 42 janelas cinza do navegador (alert, confirm e prompt) foram trocadas por janelas com o visual do Hub.
- **Confirmações** dizem o que vai acontecer e trazem o botão com o nome da ação ("Excluir processo", "Remover foto"). Nas exclusões, o botão é vermelho, o texto avisa que a ação não pode ser desfeita e o foco começa em Cancelar. A tecla Esc cancela.
- **Avisos** de dados faltando aparecem por cima do formulário, sem fechá-lo ("Confira os dados").
- **Erros do servidor** aparecem com o título "Não foi possível concluir".

**Aviso de sucesso:** depois de salvar, aparece no canto da tela uma mensagem como "Processo atualizado", "Atendimento registrado", "Foto enviada" ou "Lista de Verificação registrada", que some em 3 segundos. No celular, ela ocupa a largura da tela.

**Troca obrigatória de senha:**
- Quando o administrador cadastra um usuário ou redefine a senha de alguém, a senha passa a ser provisória.
- No primeiro acesso, o servidor só consegue entrar depois de criar uma senha própria. Até lá, o servidor recusa qualquer outra operação, inclusive nas APIs de atendimentos, eventos e veículos.
- A tela de Usuários mostra "Aguardando troca da senha provisória" enquanto a troca não acontece.
- Os usuários que já existem não são afetados: ninguém será obrigado a trocar a senha por causa da atualização.

**Senhas fracas recusadas** ao cadastrar ou trocar: sequências (12345678, abcdefgh, qwertyui), um só caractere repetido, senhas comuns (como senha123) e senhas que contenham o login. A nova senha também precisa ser diferente da atual. Senhas antigas continuam valendo para entrar.

**Bloqueio de tentativas também por IP:** além do bloqueio de 15 minutos após 5 erros no mesmo login, agora há bloqueio de 15 minutos após 30 erros vindos do mesmo IP, com qualquer login. O limite é alto de propósito, porque todos os computadores de um órgão costumam sair na internet pelo mesmo IP. Quando um login é bloqueado, o Log de atividades registra "Login bloqueado por tentativas".

**Encerramento por inatividade:** depois de 55 minutos sem uso de teclado, mouse ou toque, o sistema pergunta "Você ainda está usando o sistema?". Sem resposta, a sessão é encerrada aos 60 minutos, a tela de login avisa o motivo e o log registra a saída "Por inatividade". O uso em qualquer aba do Hub conta como atividade. O tempo fica em `INATIVO_MIN`, em `js/base.js`, e pode ser ajustado.

**Banco:** a coluna `usuarios.trocar_senha` e um índice para a contagem de falhas por IP são criados sozinhos no primeiro acesso, sem script manual.

**Arquivos alterados:** `index.html` (estilos), `js/base.js`, `js/processos.js`, `js/atendimentos.js`, `js/calendario.js`, `js/veiculos.js`, `js/relatorios.js`, `js/usuarios.js`, `api/data.js`, `api/atendimentos.js`, `api/eventos.js`, `api/veiculos.js`, `lib/comum.js`, `GUIA-DO-CODIGO.md`.

**Testes:** 28 verificações de API (senha provisória, senhas fracas, bloqueios, log) e 21 de tela (confirmação, aviso, aviso de sucesso, troca de senha, inatividade, celular); todas as telas antigas rodadas de novo com os cabeçalhos de segurança, sem diferença; API com 20 e 39 verificações.

## Versão 7.4: cabeçalhos de segurança, atualização a cada 30 segundos e exportações no log

**Cabeçalhos de segurança:** o novo arquivo `vercel.json` faz a Vercel enviar, em todas as páginas e na API:
- `Content-Security-Policy`: só carrega scripts, estilos e imagens do próprio sistema (mais as fotos do Vercel Blob e o envio para `vercel.com/api/blob`) e proíbe que o Hub seja aberto dentro de outro site;
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `Permissions-Policy` (câmera, microfone e localização desligados) e `Strict-Transport-Security`.
Todas as telas, impressões, exportações e o envio de fotos foram testados com esses cabeçalhos ativos, sem nenhum bloqueio.

**Atualização automática:** passou de 4 para 30 segundos, e o sistema atualiza na hora quando o servidor volta para a aba do Hub. Isso reduz as consultas ao servidor em cerca de 7 vezes.

**Exportações no log:** cada exportação passa a aparecer no Log de atividades com a ação `exportacao`, o formato e o nome do relatório. Vale para a Planilha completa, o Backup (JSON), as exportações em Excel e PDF das telas, o Relatório Controle de Processos, o calendário e a Lista de Verificação dos veículos.

**Aviso no login:** "Acesso restrito a servidores autorizados. As ações realizadas no sistema ficam registradas com usuário, data, hora e IP."

**Nome Hub Patrimonial:** título da aba do navegador, nome da planilha completa (`hub_patrimonial_processos_...xlsx`), nome do backup (`hub_patrimonial_backup_...json`), `package.json` e este documento.

**Biblioteca de planilhas (pendente):** a atualização do SheetJS 0.18.5 para a 0.20.3 não entrou nesta versão, porque o ambiente onde o sistema é preparado não tem acesso ao site oficial (cdn.sheetjs.com). Para fazer manualmente: baixe `https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js`, salve com o nome `xlsx.min.js` no lugar do arquivo atual e teste uma importação e uma exportação antes de publicar.

**Arquivos alterados:** `vercel.json` (novo), `index.html`, `api/data.js` (operação `exportacao`), `js/base.js`, `js/processos.js`, `js/relatorios.js`, `js/calendario.js`, `js/veiculos.js`, `package.json`.

**Testes:** 17 verificações novas (título, aviso, intervalo, exportações no log, recusa sem sessão); todas as telas antigas rodadas com os cabeçalhos ativos, sem violação; API com 20 e 39 verificações.

## Versão 7.3: tela de abertura e troca de domínio

**Tela de abertura:** antes, ao abrir o sistema, a tela inicial aparecia vazia por um instante e só depois vinha o login. Agora o sistema fica oculto até a sessão ser confirmada. Nesse intervalo aparece uma tela de abertura com o mesmo fundo do login, o nome HUB PATRIMONIAL e "Carregando…".
- **Sem sessão:** a abertura passa direto para o login. Depois de entrar, o início aparece já com os dados.
- **Com sessão aberta:** a abertura passa direto para o início, sem mostrar o login.
- **Falha de conexão:** a abertura sai e aparece a mensagem "Não foi possível conectar ao banco".
- **Arquivos alterados:** `index.html` (classe `ini` no `<body>`, bloco `#ini` e estilos), `js/app.js` (retira a classe depois do primeiro carregamento) e `js/base.js` (versão 7.3).

**Troca de domínio (processos-dbm.vercel.app para hub-patrimonial.vercel.app):** não exige mudança no código. O sistema não tem endereço fixo: a API é chamada pelo caminho relativo (`/api/...`), o cookie de sessão não define domínio e a Lista de Verificação monta o endereço das imagens com o domínio que estiver em uso. A troca é feita no painel da Vercel:
1. Abra o projeto e vá em **Settings > Domains**.
2. Clique em **Add Domain**, digite `hub-patrimonial.vercel.app` e confirme. Se a Vercel informar que o nome já está em uso, ele pertence a outra conta e será preciso escolher outro.
3. No domínio antigo `processos-dbm.vercel.app`, use **Edit** e marque o redirecionamento para `hub-patrimonial.vercel.app` (código 308). Assim, links e favoritos antigos continuam funcionando.
4. Não é preciso alterar as variáveis de ambiente, o banco Neon nem o armazenamento Blob.

Depois da troca, cada servidor precisa entrar de novo uma vez, porque o navegador guarda a sessão separada para cada domínio. Se o endereço antigo estiver em algum documento, manual ou atalho do setor, vale atualizar.

**Testes:** abertura sem sessão, com sessão, com conexão lenta (1,5 s), com falha do servidor e no celular (10 verificações); regressão da API (20 e 39 verificações) e das telas sem diferenças.

## Versão 7.2: processo de Veículo, nova tela de login e cabeçalho do relatório

**Tipo de processo Veículo:** o campo Tipo do cadastro de processo agora tem Transferência, Alienação e Veículo.
- **Campos do processo de Veículo:** Nº do processo, Descrição, Data de Tramitação, Órgão, Nº do ofício (opcional), Data do ofício, Status, Responsável, Data de conclusão e Observação.
- **Campos que não aparecem nesse tipo:** quantidade de itens, órgão recebedor, motivo e setor atual. No detalhe, "Documento" aparece como "Ofício".
- **Onde aparecem:** os processos de Veículo ficam na tela **Gestão de Veículos > Processos**, junto com os processos informados no cadastro dos veículos. A tela também ganhou:
  - o botão **Novo processo de veículo**;
  - o filtro por tipo;
  - as colunas Data de Tramitação, Nº do ofício, Responsável e Conclusão.
- **Nas outras telas:**
  - continuam em Todos os Processos e Idade de Saldo, como os demais tipos;
  - o Dashboard ganhou o grupo "Processos de Veículo" (Total, Concluídos, Em aguardo), que aparece quando existe pelo menos um;
  - nos Gerenciais, entram no quadro Processos por tipo, sem contagem de bens.
- **Detalhe do processo:** de qualquer tipo, mostra os veículos vinculados a ele.

**Tela de login:** foi refeita.
- Ocupa a tela toda, com fundo em gradiente animado e o cartão de acesso com a marca do Hub Patrimonial.
- Tem botão para mostrar ou esconder a senha e aviso quando o Caps Lock está ligado.
- O rodapé mostra SEAD, CPAT, DBM e a versão do sistema.
- A animação é desligada para quem configurou o computador para reduzir movimento, e a tela funciona no tema escuro e no celular.

**Relatório Controle de Processos (PDF dos Gerenciais):** o cabeçalho passou a ter, nesta ordem:
- Secretaria de Administração e Gestão - SEAD
- Coordenadoria de Patrimônio - CPAT
- Departamento de Bens Móveis - DBM
- o título Relatório Controle de Processos.

Não há alteração no banco de dados.

| Arquivo | Situação |
|---|---|
| `index.html`, `js/base.js`, `js/processos.js`, `js/veiculos.js`, `js/relatorios.js`, `api/data.js`, `GUIA-DO-CODIGO.md`, `ENTREGA.md` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v7.2.patch` com `git am --keep-cr` sobre a v7.1), faça o push e recarregue com Ctrl + F5.

---

## Versão 7.1: importação da planilha de veículos

**Importar planilha** é um botão novo na tela Veículos, só para o administrador. Ele lê a planilha "VEÍCULOS DEPÓSITO" no formato atual, com as colunas UNIDADE, PROCESSO, PLACA, TOMBO, TIPO, MODELO, ANO, CHASSI, RENAVAM, ÚLTIMO LICENCIAMENTO e DESTINAÇÃO.

Antes de gravar, uma prévia mostra:
- quantos veículos são novos e quantos já estão no Hub;
- a contagem por órgão;
- quantos processos já estão cadastrados no Hub;
- como cada tipo foi convertido;
- as linhas com erro, ajuste ou aviso.

Com qualquer erro, nada é gravado. Importar o mesmo arquivo de novo não duplica, porque os veículos com mesma placa, chassi, RENAVAM ou tombo são ignorados.

**Resultado com a planilha de 01/09/2026 (teste local):** os 78 veículos foram lidos e importados, sem nenhuma linha com erro.

- **7 ajustes automáticos:**
  - na linha 34 (PHM-9193), o RENAVAM "baixa no DETRAN" foi para as observações;
  - nas linhas 44 a 49, o processo estava com "_" no lugar da barra e foi gravado com "/".
- **4 avisos, para conferir no documento do veículo:**
  - linha 69 (JXV-6062): o dígito verificador do RENAVAM não confere;
  - linhas 70 (OAI-9875) e 79 (NOX-0679): o chassi tem 16 caracteres;
  - linha 75 (NOY-5170): o chassi tem 18 caracteres e o dígito verificador do RENAVAM não confere.
- **Tipos convertidos para os nomes do Hub:**
  - CAMINHONETE e PICK´UP viraram Caminhonete;
  - AUTOMOVEL, PAS/AUTOMOVEL e PASSEIO viraram Automóvel;
  - CAMINHAO, ONIBUS, CAMIONETA e UTILITÁRIO ficaram com acento e inicial maiúscula.
- **Linha 67 (PHM-9273):** está sem processo e entra assim.
- **Órgãos:** "SSP" e "SSP-AM" aparecem separados na planilha e continuam separados no Hub. Se forem o mesmo órgão, padronize na planilha antes de importar, ou depois, no cadastro de cada veículo.

**Mudanças no cadastro do veículo para receber a planilha:**
- **Processo:** é gravado pelo número, mesmo que ainda não esteja cadastrado no Hub. Quando o número bate com um processo cadastrado (a comparação ignora pontos, barras e traços), o vínculo aparece sozinho, inclusive se o processo for cadastrado depois. A tela Processos (Gestão de Veículos) lista também os processos ainda não cadastrados, com a situação "Não cadastrado no Hub".
- **Pendências:** o quadro ganhou a linha "Processo ainda não cadastrado no Hub".
- **Ano:** aceita fabricação/modelo, como no documento (2010/2011), ou só o ano de fabricação.
- **RENAVAM:** é gravado com 11 números. Os antigos, de 9, recebem zeros à esquerda, porque é o formato atual e porque o Excel apaga esses zeros. Assim, o mesmo RENAVAM escrito com ou sem zeros é reconhecido como repetido.
- **Observações:** campo novo no cadastro do veículo, que também aparece no Excel.

**Banco de dados:** a alteração é feita sozinha na primeira requisição. Se a v7.0 já estava publicada, os veículos cadastrados mantêm o processo, que passa a ser guardado pelo número. O `db/migracao_007_veiculos_importacao.sql` serve de registro.

| Arquivo | Situação |
|---|---|
| `db/migracao_007_veiculos_importacao.sql` | novo |
| `js/veiculos.js`, `api/veiculos.js`, `lib/comum.js`, `js/base.js` (versão 7.1), `GUIA-DO-CODIGO.md`, `ENTREGA.md` | alterados |

Publicação: substitua os arquivos (ou aplique `hub-dbm-v7.1.patch` com `git am --keep-cr` sobre a v7.0), faça o push e recarregue com Ctrl + F5. Depois, entre como administrador, abra Veículos > Importar planilha e escolha o arquivo.

---

## Versão 7.0: Gestão de Veículos e novo menu

### Módulo Gestão de Veículos

**Veículos** (menu Gestão de Veículos > Veículos) substitui a planilha de controle do depósito.

- **Cadastro:** ID (automático), Órgão, Processo, Placa, Tombo, Tipo, Modelo, Ano, Chassi, RENAVAM, Último licenciamento e Destinação. Também tem Situação documental, Entrada no depósito e Saída do depósito.
- **Processo:** é opcional. Ao digitar o número, o sistema sugere os processos já cadastrados e só aceita um que exista.
- **Datas:** a entrada é opcional. Com a saída em branco, o veículo conta como "no depósito".
- **Conferências no servidor:**
  - placa no formato antigo (ABC1234) ou Mercosul (ABC1D23);
  - chassi e RENAVAM só com letras e números;
  - ano e licenciamento entre 1900 e o ano que vem;
  - pelo menos um identificador entre placa, chassi, RENAVAM e tombo;
  - bloqueio de veículo repetido pela placa, chassi, RENAVAM ou tombo.
- **Situação documental:** é marcada pelo usuário, com as opções Regularizado, Em regularização e Não regularizado. Os indicadores contam por ela.
- **Fotos:** cada foto leva a parte do veículo que mostra, com sugestões (Frontal, Traseira, Lateral direita, Painel e hodômetro, Chassi etc.), e aparece como "Foto 1 - Frontal", "Foto 2 - Traseira". Detalhes:
  - aceita JPG e PNG;
  - fotos grandes são reduzidas no navegador antes do envio, para no máximo 1920 px;
  - a parte pode ser trocada depois;
  - quem enviou a foto, ou o administrador, pode removê-la.
- **Lista de Verificação de Veículo:** é preenchida na tela, no mesmo formato do documento em papel. Inclui os 26 itens com S, N, I ou A, as avarias por vista do veículo (A, R, Q, F), as observações e os responsáveis pela entrega e pela vistoria.
- **Impressão da Lista de Verificação:** o botão Imprimir gera a folha A4 do modelo, com o brasão, o desenho do veículo com as avarias marcadas e o rodapé da SEAD. A folha cabe em uma página. Sem a lista preenchida, a folha sai com os dados do veículo e o restante em branco, para preencher à mão.
- **Topo da tela:**
  - indicadores: No depósito, Regularizados, Em regularização, Não regularizados e Saíram do depósito no ano;
  - destinação dos veículos no depósito;
  - veículos por tipo e por órgão;
  - quadro de **Pendências de cadastro**: sem Lista de Verificação, sem fotos, sem processo, sem destinação e sem situação informada. Cada linha abre a lista já filtrada.
- **Lista:** tem pesquisa, filtros, Excel e PDF. O Excel traz os campos na mesma ordem da planilha usada hoje, mais situação, datas e fotos.
- **Exclusão:** só o administrador exclui veículos, e as fotos são apagadas junto.

**Processos** (Gestão de Veículos > Processos) lista os processos com veículos vinculados e mostra a quantidade de veículos de cada um. A tela também tem Excel e PDF.

**Importar a planilha atual:** se o setor enviar a planilha de veículos usada hoje, dá para preparar a importação dela numa próxima versão.

### Menu, versão e Caixa do Setor

- O menu foi reorganizado:
  - Início;
  - Gestão de Processos: Dashboard, Alienações, Transferências, Todos os Processos e Idade de Saldo, o antigo Vida do Processo;
  - Gestão de Veículos;
  - Gestão de Atendimento;
  - Calendário;
  - Relatórios: Gerenciais;
  - Administração: Usuários, Log de atividades e Listas e Parâmetros.
- Usuários e Log de atividades viraram duas telas separadas.
- **Listas e Parâmetros** (prazos de criticidade e listas de cadastro) agora fica em Administração e é **somente para o administrador**, também no servidor. Ganhou as listas Tipos de veículo e Destinações de veículos.
- Os relatórios de processos que ficavam em "Listas e Relatórios" passaram para a tela Gerenciais, na aba **Relatórios de processos**.
- A versão do sistema aparece abaixo de "HUB PATRIMONIAL Gestão e Controle".
- **Caixa do Setor:**
  - saiu do menu e não aceita processos novos, nem pelo formulário nem pela importação;
  - os processos que já estavam nela continuam no banco e aparecem em Todos os Processos. Nada foi apagado;
  - para recategorizar, abra o processo e troque o tipo para Alienação ou Transferência.

### Atenção antes de usar

1. **Fotos dependem do Blob.** O envio de fotos usa o mesmo armazenamento dos anexos do calendário (Vercel Blob privado). Enquanto ele não for criado, a tela mostra um aviso e o resto do módulo funciona normalmente. O passo a passo está na versão 5, abaixo. O plano gratuito tem 1 GB, por isso as fotos são reduzidas antes do envio.
2. **Nomes de órgão.** Renomear um órgão em Listas e Parâmetros não altera os veículos já cadastrados com o nome antigo.
3. **Banco de dados.** As tabelas `veiculos` e `veiculo_fotos` são criadas sozinhas na primeira requisição. O `db/migracao_006_veiculos.sql` serve de registro, ou para rodar antes no Neon.

| Arquivo | Situação |
|---|---|
| `js/veiculos.js`, `api/veiculos.js`, `lib/arquivos.js`, `db/migracao_006_veiculos.sql`, `img/vistoria-cabecalho.png`, `img/vistoria-veiculo.png`, `img/vistoria-rodape.png` | novos |
| `index.html`, `js/base.js`, `js/processos.js`, `js/usuarios.js`, `js/relatorios.js`, `js/inicio.js`, `js/atendimentos.js`, `api/data.js`, `api/eventos.js`, `lib/comum.js`, `GUIA-DO-CODIGO.md` | alterados |

Publicação: copie a pasta inteira, incluindo a pasta nova `img/` (ou aplique `hub-dbm-v7.0.patch` com `git am --keep-cr` sobre a v6.9). Depois faça o push e recarregue com Ctrl + F5.

---

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
