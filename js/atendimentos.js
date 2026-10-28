// Gestão de Atendimentos: registro dos atendimentos por e-mail, WhatsApp, presencial, Teams e ligação
const AT_CANAIS = ['E-mail', 'WhatsApp', 'Presencial', 'Teams', 'Ligação'],
    AT_CATS = ['Orientação', 'Suporte operacional'];
const AT_SIT = ['Em atendimento', 'Aguardando análise interna', 'Aguardando retorno do solicitante', 'Finalizado'],
    AT_FIM = 'Finalizado';
const AT_COR = {
    'Em atendimento': '',
    'Aguardando análise interna': 'y',
    'Aguardando retorno do solicitante': 'n',
    Finalizado: 'g',
};
// AT = atendimentos carregados; ATU = atendentes; ATL = assinatura da última carga; ATP = carga em andamento
// ATS = pesquisa, filtros e página da tela
let AT = [],
    ATU = [],
    ATL = '',
    ATP = null;
const ATS = { q: '', f: {}, page: 1, size: 25, open: true };
const atDias = a => Math.max(0, Math.round(day(a.data_finalizacao || TS()) - day(a.data)));
const atSit = a => `<span class="bd ${AT_COR[a.situacao] ?? ''}">${esc(a.situacao)}</span>`;
const atPode = a => adm() || (ME && a.atendente_id == ME.id);
// Lista de atendimentos com dias em aberto calculados
const atView = () =>
    AT.map(a => ({ ...a, andamento: a.situacao == AT_FIM ? 'Finalizado' : 'Em aberto', dias: atDias(a) }));
const AT_FD = [
    ['andamento', 'Andamento'],
    ['situacao', 'Situação'],
    ['atendente', 'Atendente'],
    ['orgao', 'Órgão'],
    ['canal', 'Canal'],
    ['categoria', 'Categoria'],
    ['assunto', 'Assunto'],
];
// Verdadeiro quando o atendimento atende aos filtros (skip ignora um campo)
const atOk = (x, f, skip) =>
    AT_FD.every(([c]) => c == skip || !f[c] || x[c] == f[c]) && (!f.d1 || x.data >= f.d1) && (!f.d2 || x.data <= f.d2);
// Atendimentos que atendem à pesquisa digitada
const atBusca = () => {
    const q = nz(ATS.q);
    return atView().filter(
        x =>
            !q ||
            nz(
                [
                    x.solicitante,
                    x.contato,
                    x.orgao,
                    x.assunto,
                    x.descricao,
                    x.canal,
                    x.categoria,
                    x.atendente,
                    x.situacao,
                    x.processo_numero,
                ].join(' ')
            ).includes(q)
    );
};
// Atendimentos depois da pesquisa e dos filtros
const atRows = () => atBusca().filter(x => atOk(x, ATS.f));
// Colunas: título, valor para exportação, HTML opcional para a tela
const AT_C = [
    ['Data', a => fmt(a.data)],
    ['Hora', a => a.hora || ''],
    ['Solicitante', a => a.solicitante],
    ['Órgão', a => a.orgao],
    ['Assunto', a => a.assunto],
    ['Canal', a => a.canal],
    ['Categoria', a => a.categoria],
    ['Atendente', a => a.atendente],
    ['Situação', a => a.situacao, atSit],
    ['Dias', a => a.dias],
];
const AT_X = [
    ...AT_C,
    ['Descrição', a => a.descricao],
    ['Contato', a => a.contato],
    ['Data de finalização', a => (a.data_finalizacao ? fmt(a.data_finalizacao) : '')],
    ['Processo vinculado', a => a.processo_numero || ''],
];

// Busca no servidor. silencioso = chamada do intervalo automático: só redesenha se algo mudou e ninguém estiver digitando.
function atLoad(silencioso) {
    return (
        ATP ||
        (ATP = (async () => {
            try {
                const j = await api({ op: 'list' }, '/api/atendimentos'),
                    sg = JSON.stringify(j);
                ATU = j.atendentes;
                if (sg === ATL) return;
                AT = j.atendimentos;
                const vis = ['aten', 'relg', 'home'].includes(tab);
                if (vis && silencioso && !livre()) return; // redesenha na próxima verificação, quando a tela estiver livre
                ATL = sg;
                if (vis) draw();
            } catch (e) {
                if (!silencioso) alert('Erro: ' + e.message);
            } finally {
                ATP = null;
            }
        })())
    );
}
// Tela Atendimentos
function atScr() {
    const v = atView(),
        ab = v.filter(a => a.situacao != AT_FIM),
        m = TS().slice(0, 7),
        fm = v.filter(a => a.situacao == AT_FIM && (a.data_finalizacao || '').startsWith(m)),
        fz = v.filter(a => a.situacao == AT_FIM);
    const med = fz.length ? Math.round(fz.reduce((s, a) => s + a.dias, 0) / fz.length) : 0;
    return (
        head(
            'Atendimentos',
            'Atendimentos por e-mail, WhatsApp, presencial, Teams e ligação',
            `${adm() ? `<button class="btn" onclick="atImp()">${ic('up', 16)} Importar planilha</button>` : ''}<button class="btn p" onclick="atEd(0)">${ic('plus', 16)} Novo atendimento</button>`
        ) +
        `<div class="kp">${kc('chat', 'y', 'Em aberto', ab.length, { c: '', t: 'todos os atendentes' }, "atFiltra({andamento:'Em aberto'})")}${kc('user', '', 'Meus em aberto', ab.filter(a => ME && a.atendente_id == ME.id).length, null, 'atMeus()')}${kc('ok', 'g', 'Finalizados no mês', fm.length, null)}${kc('clock', 'v', 'Tempo médio até finalizar', med + ' dias', { c: '', t: fz.length + ' finalizado(s)' })}</div>` +
        `<div class="cd">
            <div class="tb">
            <div class="sr">${ic('search')}<input value="${esc(ATS.q)}" placeholder="Pesquisar por solicitante, órgão, assunto, descrição, atendente…" oninput="ATS.q=this.value;ATS.page=1;atList()"></div><button class="btn" onclick="ATS.open=!ATS.open;atList()">${ic('filter', 16)} Filtros <span class="cnt" id="fc"></span></button><button class="btn" onclick="atEx('x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="atEx('p')">${ic('pdf', 16)} PDF</button></div>
            <div id="fp">
            </div>
            <div id="res">
            </div>
            </div>`
    );
}
// Filtros automáticos, no mesmo padrão da tela de Transferências
function atFp() {
    const b = atBusca(),
        f = ATS.f,
        o = c => {
            const n = {};
            b.filter(x => atOk(x, f, c)).forEach(x => {
                if (x[c]) n[x[c]] = (n[x[c]] || 0) + 1;
            });
            if (f[c] && !n[f[c]]) n[f[c]] = 0;
            return Object.keys(n)
                .sort((x, y) => x.localeCompare(y, 'pt'))
                .map(v => [v, v + ' (' + n[v] + ')']);
        };
    return `<div class="fg">${AT_FD.map(
        ([c, l]) =>
            `<label>${l}<select onchange="atSF('${c}',this.value)"><option value="">Todos</option>${o(c)
                .map(([v, t]) => `<option value="${esc(v)}" ${f[c] == v ? 'selected' : ''}>${esc(t)}</option>`)
                .join('')}</select></label>`
    ).join('')}${[
        ['d1', 'Data de'],
        ['d2', 'Data até'],
    ]
        .map(
            ([c, l]) =>
                `<label>${l}<input type="date" value="${f[c] || ''}" onchange="anoOk(this.value)&&atSF('${c}',this.value)"></label>`
        )
        .join('')}<button class="btn" onclick="ATS.f={};ATS.page=1;atList()">Limpar filtros</button></div>`;
}
// Aplica um filtro escolhido e redesenha a lista
const atSF = (c, v) => {
    ATS.f[c] = v;
    ATS.page = 1;
    atList();
};
// Aplica um conjunto de filtros pronto (usado pelos cartões de indicador e pelo atalho Meus em aberto)
function atFiltra(f) {
    ATS.f = f;
    ATS.q = '';
    ATS.page = 1;
    ATS.open = true;
    if (tab != 'aten') go('aten');
    else draw();
}
// Atalho: mostra só os atendimentos em aberto do usuário logado
function atMeus() {
    atFiltra({ andamento: 'Em aberto', atendente: ME ? ME.nome : '' });
}
// Redesenha só a tabela de atendimentos
function atList() {
    const el = $('#res');
    if (!el) return;
    const r = atRows(),
        n = r.length,
        P = Math.max(1, Math.ceil(n / ATS.size));
    ATS.page = Math.min(ATS.page, P);
    const pg = r.slice((ATS.page - 1) * ATS.size, ATS.page * ATS.size);
    $('#fc').textContent = Object.values(ATS.f).filter(Boolean).length || '';
    $('#fp').innerHTML = ATS.open ? atFp() : '';
    el.innerHTML =
        `<div class="tw">
            <table>
            <thead>
            <tr>${AT_C.map(c => `<th${tal(c[0])}>${c[0]}</th>`).join('')}<th>Ações</th>
            </tr>
            </thead>
            <tbody>${pg
                .map(
                    a => `<tr class="${a.situacao != AT_FIM && a.dias > 30 ? 'r' : a.situacao != AT_FIM && a.dias > 7 ? 'w' : ''}" onclick="atDet(${a.id})">${AT_C.map(c => `<td${tal(c[0])}>${c[2] ? c[2](a) : esc(c[1](a)) || '—'}</td>`).join('')}<td><button class="btn s" title="Detalhes" onclick="event.stopPropagation();atDet(${a.id})">${ic('eye', 15)}</button></td>
            </tr>`
                )
                .join('')}</tbody>
            </table>
            </div>` +
        (n
            ? ''
            : `<p class="nt" style="text-align:center;padding:24px">${AT.length ? 'Nenhum atendimento encontrado com esses filtros.' : 'Nenhum atendimento registrado ainda.'}</p>`) +
        `<div class="pgr"><span>${n ? (ATS.page - 1) * ATS.size + 1 : 0}–${Math.min(n, ATS.page * ATS.size)} de ${n}</span><select onchange="ATS.size=+this.value;ATS.page=1;atList()">${[25, 50, 100].map(x => `<option ${ATS.size == x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="btn s" ${ATS.page < 2 ? 'disabled' : ''} onclick="ATS.page--;atList()">${ic('cl', 16)}</button><b>${ATS.page}/${P}</b><button class="btn s" ${ATS.page >= P ? 'disabled' : ''} onclick="ATS.page++;atList()">${ic('cr', 16)}</button></div>`;
}
const atEx = k =>
    xp(
        'Atendimentos',
        AT_X.map(c => c[0]),
        atRows().map(a => AT_X.map(c => c[1](a))),
        k,
        ATS.q || Object.values(ATS.f).some(Boolean) ? 'com a pesquisa e os filtros aplicados na tela' : ''
    );

// Janela de detalhe de um atendimento
async function atDet(id) {
    let a = atView().find(x => x.id == id);
    if (!a) {
        await atLoad(1);
        a = atView().find(x => x.id == id);
    }
    if (!a) return;
    const f = (l, v) => `<div>${l}<b>${esc(v) || '—'}</b></div>`,
        pode = atPode(a);
    $('#dd').innerHTML =
        `<h2><span>Atendimento de ${esc(a.solicitante)}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div class="ds" style="margin-top:14px">Descrição<b>${esc(a.descricao)}</b></div>
            <div class="dl">${f('Data e hora', fmt(a.data) + (a.hora ? ' às ' + a.hora : ''))}<div>Situação<b>${atSit(a)}</b></div>${f('Órgão', a.orgao)}${f('Solicitante', a.solicitante)}${f('Contato', a.contato)}${f('Canal', a.canal)}${f('Categoria', a.categoria)}${f('Assunto', a.assunto)}${f('Atendente', a.atendente)}${f(a.situacao == AT_FIM ? 'Finalizado em' : 'Dias em aberto', a.situacao == AT_FIM ? fmt(a.data_finalizacao) + ' (' + a.dias + ' dias)' : a.dias)}<div>Processo vinculado<b>${a.processo_id ? `<a href="#" onclick="event.preventDefault();det(${a.processo_id})">${esc(a.processo_numero)}</a>` : '—'}</b></div>
            </div>
<h3 class="kt" style="margin:0 20px 8px">${ic('history', 16)} Histórico do atendimento</h3><form class="tb" style="margin:0 20px 10px" onsubmit="event.preventDefault();atHAdd(${a.id})"><input type="date" id="hd" value="${TS()}" max="${TS()}" aria-label="Data"><input id="hx" maxlength="2000" placeholder="O que foi feito? Ex.: Enviada orientação por e-mail" style="flex:1;min-width:200px" aria-label="Descrição"><button class="btn p s">${ic('plus', 14)} Registrar</button></form><div class="tl" id="hl">
    <p class="nt">Carregando histórico…</p>
    </div>
<div class="ac">${pode ? `<button class="btn p" onclick="atEd(${a.id})">${ic('pen', 15)} Editar</button>${a.situacao != AT_FIM ? `<button class="btn" onclick="atFin(${a.id})">${ic('ok', 15)} Finalizar hoje</button>` : ''}` : '<span class="nt">Somente o atendente responsável ou o administrador pode alterar este atendimento.</span>'}<span class="sp"></span>${adm() ? `<button class="btn d" onclick="atRm(${a.id})">${ic('trash', 15)} Excluir</button>` : ''}</div>`;
    if (!$('#dd').open) $('#dd').showModal();
    atHist(a.id);
}
// Carrega e mostra o histórico de um atendimento
async function atHist(id) {
    const e = $('#hl');
    if (!e) return;
    let h;
    try {
        h = (await api({ op: 'hist_list', id }, '/api/atendimentos')).historico;
    } catch (er) {
        e.innerHTML = '<p class="nt">Não foi possível carregar o histórico.</p>';
        return;
    }
    e.innerHTML = h.length
        ? h
              .map(
                  x =>
                      `<div><b style="font-weight:${x.automatico ? 500 : 600}">${esc(x.descricao)}</b><small>${fmt(x.data)} · registrado por ${esc(x.usuario_nome)}${x.automatico ? ' (automático)' : ''} em ${esc(x.registrado_em)}</small></div>`
              )
              .join('')
        : '<p class="nt">Nenhum registro ainda.</p>';
}
// Registra uma nova anotação no histórico do atendimento
function atHAdd(id) {
    const d = $('#hd').value,
        t = $('#hx').value.trim();
    if (!d || t.length < 3) return alert('Informe a data e a descrição do registro.');
    run(async () => {
        await api({ op: 'hist_add', id, data: d, descricao: t }, '/api/atendimentos');
        $('#hx').value = '';
        atHist(id);
    });
}

// Formulário de atendimento (id 0 = novo atendimento)
function atEd(id) {
    const n = new Date(),
        a = id
            ? AT.find(x => x.id == id)
            : {
                  id: 0,
                  data: TS(),
                  hora: String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'),
                  orgao: '',
                  solicitante: '',
                  contato: '',
                  categoria: '',
                  assunto: '',
                  descricao: '',
                  canal: '',
                  atendente_id: ME ? ME.id : 0,
                  situacao: AT_SIT[0],
                  data_finalizacao: '',
                  processo_numero: '',
              };
    if (!a) return;
    const sel = (i, l, ops, v, req = 1) =>
            `<label>${l}<select id="a_${i}" ${req ? 'required' : ''}><option value="">Selecione…</option>${ops.map(o => `<option value="${esc(o[0])}" ${v == o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`,
        two = x => x.map(o => [o, o]);
    const us = [...ATU.map(u => [u.id, u.nome])];
    if (a.atendente_id && !us.some(u => u[0] == a.atendente_id)) us.push([a.atendente_id, a.atendente + ' (inativo)']);
    $('#dd').innerHTML =
        `<h2><span>${id ? 'Editar atendimento' : 'Novo atendimento'}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><form class="fm" onsubmit="event.preventDefault();atSv(${a.id})">
<h3 class="kt w" style="margin:0">Solicitação</h3>
<label>Data<input type="date" id="a_data" value="${a.data}" max="${TS()}" required></label><label>Hora<input type="time" id="a_hora" value="${a.hora || ''}"></label>
${sel('canal', 'Canal', two(AT_CANAIS), a.canal)}<label>Órgão<input id="a_orgao" value="${esc(a.orgao)}" list="dl_ao" maxlength="200"></label>
<label>Solicitante<input id="a_solicitante" value="${esc(a.solicitante)}" required maxlength="150" placeholder="Nome de quem pediu"></label><label>Contato institucional<input id="a_contato" value="${esc(a.contato)}" maxlength="150" placeholder="E-mail ou telefone do órgão"></label>
<h3 class="kt w" style="margin:8px 0 0">Classificação</h3>
${sel('categoria', 'Categoria', two(AT_CATS), a.categoria)}<label>Assunto<input id="a_assunto" value="${esc(a.assunto)}" list="dl_aa" maxlength="200"></label>
<label class="w">Descrição<textarea id="a_descricao" rows="3" maxlength="4000" required placeholder="O que foi solicitado e o que foi feito">${esc(a.descricao)}</textarea></label>
<h3 class="kt w" style="margin:8px 0 0">Andamento</h3>
${sel('atendente_id', 'Atendente', us, a.atendente_id)}${sel('situacao', 'Situação', two(AT_SIT), a.situacao).replace('<select ', '<select onchange="atSitMuda()" ')}
<label>Data de finalização<input type="date" id="a_data_finalizacao" value="${a.data_finalizacao || ''}" max="${TS()}"></label><label>Processo vinculado (opcional)<input id="a_processo_numero" value="${esc(a.processo_numero || '')}" list="dl_ap" placeholder="Nº do processo"></label>
<p class="nt w" style="margin:0">Não registre CPF nem dados pessoais além do necessário para o retorno ao solicitante.</p>
<div class="w" style="display:flex;gap:8px"><button class="btn p">${ic('ok', 15)} Salvar</button><button type="button" class="btn" onclick="${id ? `atDet(${id})` : `$('#dd').close()`}">Cancelar</button></div></form>
<datalist id="dl_ao">${L.orgaos.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="dl_aa">${(L.assuntos_at || []).map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="dl_ap">${D.map(r => `<option value="${esc(r.numero)}">`).join('')}</datalist>`;
    if (!$('#dd').open) $('#dd').showModal();
    $('#dd').scrollTop = 0;
}
// Mostra o campo de data de finalização só quando a situação é Finalizado
function atSitMuda() {
    const f = $('#a_data_finalizacao');
    if ($('#a_situacao').value == AT_FIM) {
        if (!f.value) f.value = TS();
    } else f.value = '';
}
// Botão Salvar do formulário: valida e grava o atendimento
function atSv(id) {
    const g = k => $('#a_' + k).value.trim(),
        b = { id };
    [
        'data',
        'hora',
        'canal',
        'orgao',
        'solicitante',
        'contato',
        'categoria',
        'assunto',
        'descricao',
        'atendente_id',
        'situacao',
        'data_finalizacao',
        'processo_numero',
    ].forEach(k => (b[k] = g(k)));
    if (b.situacao == AT_FIM && !b.data_finalizacao) return alert('Informe a data de finalização.');
    umaVez(async () => {
        const j = await api({ op: 'save', item: b }, '/api/atendimentos');
        await atLoad(1);
        atDet(j.id);
        if (tab == 'aten') draw();
    });
}
// Finaliza um atendimento
function atFin(id) {
    const a = AT.find(x => x.id == id);
    if (!a) return;
    run(async () => {
        await api({ op: 'save', item: { ...a, situacao: AT_FIM, data_finalizacao: TS() } }, '/api/atendimentos');
        await atLoad(1);
        atDet(id);
        if (tab == 'aten') draw();
    });
}
// Exclui um atendimento
function atRm(id) {
    if (confirm('Excluir este atendimento e o histórico dele?'))
        run(async () => {
            await api({ op: 'del', id }, '/api/atendimentos');
            $('#dd').close();
            await atLoad(1);
            if (tab == 'aten') draw();
        });
}

// Importação de planilha de atendimentos (administrador). Colunas reconhecidas pelo nome do cabeçalho; os valores são convertidos para as listas do sistema
// e cada ajuste aparece na prévia antes de gravar. O servidor valida de novo e ignora o que já foi importado.
let ATI = null;
const AT_IMP_COL = {
    data: ['data', 'datadoatendimento'],
    hora: ['hora'],
    orgao: ['sigla', 'orgao', 'orgaosigla'],
    solicitante: ['solicitante', 'nome'],
    contato: ['contato', 'email', 'telefone'],
    categoria: ['categoria'],
    assunto: ['assunto'],
    descricao: ['descricao'],
    canal: ['tipodecontato', 'canal', 'meio'],
    atendente: ['responsavel', 'atendente'],
    data_finalizacao: ['datadefinalizacao', 'finalizacao', 'datafinalizacao'],
    situacao: ['status', 'situacao'],
    obs: ['observacao', 'obs'],
};
const atImpCanal = v =>
    ({
        email: 'E-mail',
        whatsapp: 'WhatsApp',
        zap: 'WhatsApp',
        teams: 'Teams',
        telefone: 'Ligação',
        ligacao: 'Ligação',
        presencial: 'Presencial',
    })[nh(v)] || '';
const atImpCat = v =>
    ({ orientacao: 'Orientação', suporte: 'Suporte operacional', suporteoperacional: 'Suporte operacional' })[nh(v)] ||
    '';
// Importação: converte a situação escrita na planilha para uma situação do Hub
const atImpSit = (v, fin) => {
    const n = nh(v);
    return !n
        ? fin
            ? AT_FIM
            : 'Em atendimento'
        : /^(finalizado|concluido|resolvido)$/.test(n)
          ? AT_FIM
          : /retorno/.test(n)
            ? 'Aguardando retorno do solicitante'
            : /analise/.test(n)
              ? 'Aguardando análise interna'
              : /^(emandamento|ematendimento|pendente|aberto)$/.test(n)
                ? 'Em atendimento'
                : '';
};
// Data e hora pelo número de série do Excel, sem depender do fuso do navegador
const atImpData = v => {
    if (typeof v == 'number' && v > 1) {
        const d = XLSX.SSF.parse_date_code(v);
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }
    return pd(v);
};
const atImpHora = v => {
    if (typeof v == 'number') {
        const m = Math.round((v % 1) * 1440) % 1440;
        return m ? `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : '';
    }
    const x = String(v ?? '')
        .trim()
        .match(/^(\d{1,2})[:h](\d\d)/);
    return x && +x[1] < 24 && +x[2] < 60 && (+x[1] || +x[2]) ? `${x[1].padStart(2, '0')}:${x[2]}` : '';
};
// Importação: abre a janela
function atImp() {
    ATI = null;
    $('#dd').innerHTML =
        `<h2><span>Importar atendimentos</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div class="fm"><label class="w">Planilha (.xlsx)<input type="file" id="ai_f" accept=".xlsx,.xls" onchange="atImpLer()"></label><div class="w ib" id="ai_pv">A primeira aba deve ter cabeçalho com as colunas DATA, HORA, SIGLA, SOLICITANTE, CATEGORIA, ASSUNTO, DESCRIÇÃO, TIPO DE CONTATO, RESPONSÁVEL, DATA DE FINALIZAÇÃO e STATUS. Nada é gravado antes de você conferir a prévia.</div>
            </div>
            <div class="ac"><button class="btn p" id="ai_go" disabled onclick="atImpGo()">${ic('up', 15)} Importar</button><button class="btn" onclick="$('#dd').close()">Cancelar</button></div>`;
    if (!$('#dd').open) $('#dd').showModal();
}
// Importação: lê a planilha e prepara cada linha
async function atImpLer() {
    const f = $('#ai_f').files[0];
    if (!f) return;
    try {
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }),
            m = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
        const hi = Math.max(
                0,
                m.slice(0, 40).findIndex(r => r.map(nh).includes('data') && r.map(nh).includes('solicitante'))
            ),
            h = (m[hi] || []).map(nh),
            ix = {};
        Object.entries(AT_IMP_COL).forEach(([c, ns]) => (ix[c] = h.findIndex(x => ns.includes(x))));
        const falta = ['data', 'solicitante', 'categoria', 'canal', 'atendente'].filter(c => ix[c] < 0);
        if (falta.length)
            throw new Error(
                'coluna não encontrada: ' +
                    falta
                        .map(c => ({ canal: 'TIPO DE CONTATO', atendente: 'RESPONSÁVEL' })[c] || c.toUpperCase())
                        .join(', ')
            );
        const g = (r, c) => (ix[c] < 0 ? '' : r[ix[c]]),
            t = (r, c) => {
                const v = String(g(r, c) ?? '').trim();
                return /^([-–—.]+|n\/?a)$/i.test(v) ? '' : v;
            }; // "-" e "N/A" contam como vazio
        ATI = {
            linhas: m
                .slice(hi + 1)
                .map((r, i) => [r, i + hi + 2])
                .filter(([r]) => r.some(v => String(v).trim() !== ''))
                .map(([r, n]) => {
                    const x = {
                        linha: n,
                        data: atImpData(g(r, 'data')),
                        hora: atImpHora(g(r, 'hora')),
                        orgao: t(r, 'orgao'),
                        solicitante: t(r, 'solicitante'),
                        contato: t(r, 'contato'),
                        assunto: t(r, 'assunto'),
                        descricao: t(r, 'descricao'),
                        nome: t(r, 'atendente'),
                        ajustes: [],
                        erros: [],
                        nota: '',
                    };
                    const cat = t(r, 'categoria'),
                        can = t(r, 'canal'),
                        st = t(r, 'situacao'),
                        fin = atImpData(g(r, 'data_finalizacao')),
                        obs = t(r, 'obs');
                    x.categoria = atImpCat(cat);
                    x.canal = atImpCanal(can);
                    x.situacao = atImpSit(st, fin);
                    x.data_finalizacao = x.situacao == AT_FIM ? fin : '';
                    if (!x.data) x.erros.push('data inválida');
                    else if (x.data > TS()) x.erros.push('data no futuro');
                    if (!x.categoria) x.erros.push(`categoria "${cat}" não reconhecida`);
                    if (!x.canal) x.erros.push(`tipo de contato "${can}" não reconhecido`);
                    if (!x.situacao) x.erros.push(`status "${st}" não reconhecido`);
                    if (!x.nome) x.erros.push('responsável vazio');
                    if (obs) x.descricao = (x.descricao ? x.descricao + '\n' : '') + 'Observação: ' + obs;
                    if (!x.solicitante) {
                        x.solicitante = 'Não informado';
                        x.ajustes.push('solicitante vazio, gravado como "Não informado"');
                    }
                    if (x.descricao.length < 3) {
                        x.descricao = x.assunto.length >= 3 ? x.assunto : 'Não informada';
                        x.ajustes.push(`descrição vazia, gravada como "${x.descricao}"`);
                    }
                    if (nh(st) == 'pendente') x.ajustes.push('status PENDENTE gravado como "Em atendimento"');
                    if (x.situacao == AT_FIM && !fin) {
                        if (x.data) {
                            x.data_finalizacao = x.data;
                            x.ajustes.push('finalizado sem data de finalização: usada a data do atendimento');
                        }
                    } else if (x.situacao == AT_FIM && x.data && fin < x.data) {
                        x.data_finalizacao = x.data;
                        x.nota = `A data de finalização da planilha (${fmt(fin)}) era anterior à do atendimento e foi substituída pela data do atendimento.`;
                        x.ajustes.push(`finalização em ${fmt(fin)}, antes do atendimento: usada a data do atendimento`);
                    }
                    if (fin && x.situacao != AT_FIM)
                        x.ajustes.push(`não está finalizado: a data de finalização ${fmt(fin)} foi desconsiderada`);
                    return x;
                }),
        };
        if (!ATI.linhas.length) throw new Error('a planilha não tem linhas preenchidas');
        // Responsável da planilha -> usuário do sistema, pelo nome (sem acento e sem diferenciar maiúsculas)
        ATI.map = {};
        [...new Set(ATI.linhas.map(x => x.nome).filter(Boolean))].forEach(n => {
            const k = nz(n).trim(),
                u = ATU.filter(u => nz(u.nome).startsWith(k + ' ') || nz(u.nome) == k);
            ATI.map[n] = u.length == 1 ? u[0].id : '';
        });
    } catch (e) {
        ATI = null;
        $('#ai_go').disabled = true;
        $('#ai_pv').textContent = 'Não foi possível ler a planilha: ' + (e.message || 'arquivo inválido') + '.';
        return;
    }
    atImpPrev();
}
// Importação: mostra a prévia com erros e ajustes
function atImpPrev() {
    const l = ATI.linhas,
        er = l.filter(x => x.erros.length),
        aj = l.filter(x => x.ajustes.length),
        sm = Object.values(ATI.map).some(v => !v),
        cont = k =>
            Object.entries(l.reduce((o, x) => ((o[x[k]] = (o[x[k]] || 0) + 1), o), {}))
                .map(([v, n]) => `${esc(v || '—')}: ${n}`)
                .join(' · ');
    const lista = (xs, f) =>
        `<div class="pl" style="max-height:180px;margin-top:6px;font-size:12.5px">${xs.map(x => `<div style="padding:4px 0;border-bottom:1px solid var(--bd)"><b>Linha ${x.linha}</b> (${esc(x.orgao)}, ${esc(x.solicitante)}): ${esc(f(x).join('; '))}</div>`).join('')}</div>`;
    $('#ai_pv').innerHTML =
        `<b>${l.length} linha(s) encontradas</b>, de ${fmt(
            l
                .map(x => x.data)
                .filter(Boolean)
                .sort()[0] || ''
        )} a ${fmt(
            l
                .map(x => x.data)
                .filter(Boolean)
                .sort()
                .pop() || ''
        )}.<br><small>Situação: ${cont('situacao')}<br>Categoria: ${cont('categoria')}<br>Canal: ${cont('canal')}</small>` +
        `<div style="margin-top:12px"><b>Responsável na planilha → usuário do Hub</b>${Object.keys(ATI.map)
            .map(
                n =>
                    `<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><span style="min-width:120px">${esc(n)} (${l.filter(x => x.nome == n).length})</span><select style="flex:1" onchange="ATI.map[${esc(JSON.stringify(n))}]=+this.value||'';atImpPrev()"><option value="">Escolha o usuário…</option>${ATU.map(u => `<option value="${u.id}" ${ATI.map[n] == u.id ? 'selected' : ''}>${esc(u.nome)}</option>`).join('')}</select></label>`
            )
            .join(
                ''
            )}${sm ? '<p class="nt" style="margin:6px 0 0">Se a pessoa ainda não tem usuário, cadastre em Administração > Usuários e abra a importação de novo.</p>' : ''}</div>` +
        (er.length
            ? `<div style="margin-top:12px;color:var(--er)"><b>${er.length} linha(s) com erro.</b> Corrija na planilha e escolha o arquivo de novo. Nada será importado enquanto houver erro.${lista(er, x => x.erros)}</div>`
            : '') +
        (aj.length
            ? `<div style="margin-top:12px"><b>${aj.length} linha(s) serão ajustadas</b> (o ajuste fica registrado no histórico de cada atendimento):${lista(aj, x => x.ajustes)}</div>`
            : '') +
        `<p class="nt" style="margin:12px 0 0">Atendimentos que já estiverem no Hub (mesma data, hora, órgão, solicitante, assunto, descrição e atendente) são ignorados, então importar o mesmo arquivo de novo não duplica.</p>`;
    $('#ai_go').disabled = !!(er.length || sm);
    $('#ai_go').innerHTML = `${ic('up', 15)} Importar ${l.length} atendimento(s)`;
}
// Importação: envia as linhas válidas ao servidor
function atImpGo() {
    if (!ATI || !confirm(`Importar ${ATI.linhas.length} atendimento(s)?`)) return;
    const itens = ATI.linhas.map(x => ({
        linha: x.linha,
        data: x.data,
        hora: x.hora,
        orgao: x.orgao,
        solicitante: x.solicitante,
        contato: x.contato,
        categoria: x.categoria,
        assunto: x.assunto,
        descricao: x.descricao,
        canal: x.canal,
        atendente_id: ATI.map[x.nome],
        situacao: x.situacao,
        data_finalizacao: x.data_finalizacao,
        nota: x.nota,
    }));
    umaVez(async () => {
        const j = await api({ op: 'importar', itens }, '/api/atendimentos');
        $('#dd').close();
        ATI = null;
        await atLoad();
        alert(
            `${j.importados} atendimento(s) importado(s).` +
                (j.ignorados ? ` ${j.ignorados} já estavam no Hub e foram ignorados.` : '')
        );
        draw();
    });
}
