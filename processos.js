// Gestão de Processos: telas, filtros, detalhe com histórico, formulário, relatórios, listas e importação
const dsc = r => `<span style="white-space:normal">${esc(r.descricao) || '—'}</span>`;
const CT = [['Nº do processo', r => r.numero], ['Descrição', r => r.descricao, dsc], ['Tipo', r => r.tipo], ['Interessado', r => r.orgao], ['Assunto', r => r.assunto, r => `<span style="white-space:normal">${esc(r.assunto)}</span>`], ['Recebedor', r => r.recebedor], ['Responsável', r => r.resp], ['Entrada', r => fmt(r.tram)], ['Movimentação', r => fmt(r.mov)], ['Status', r => r.status, stc], ['Prioridade', r => CL[r.crit], cb], ['Dias', r => r.age ?? '']];
// Telas e relatórios que podem ter processos concluídos ganham a coluna Conclusão (traço enquanto não concluir)
const CCONC = ['Conclusão', r => done(r) ? fmt(r.concl) : '—'], CTC = CT.flatMap(c => c[0] == 'Movimentação' ? [c, CCONC] : [c]);
const act = r => `<button class="btn s" title="Detalhes" onclick="event.stopPropagation();det(${r.id})">${ic('eye', 15)}</button>`;
const VD = {
    todos: { t: 'Todos os Processos', s: 'Consulta geral com pesquisa, filtros combináveis e exportação', base: () => true, c: [...CTC, ['Ações', () => '', act]] },
    caixa: {
        t: 'Caixa do Setor', s: 'Processos recebidos e em posse do setor', base: r => r.tipo == 'Caixa do setor' && !done(r), row: r => r.crit == 'c' ? 'r' : venc(r) ? 'w' : '',
        c: [['Nº Processo', r => r.numero], ['Assunto', r => r.assunto], ['Interessado', r => r.orgao], ['Recebedor', r => r.recebedor], ['Data de Entrada', r => fmt(r.tram)], ['Tempo em Espera', r => r.age == null ? '' : r.age + ' dias', r => `<b>${r.age ?? '—'}</b> dias`], ['Situação', r => r.status + ' · ' + CL[r.crit], r => stc(r) + ' ' + cb(r) + ' ' + venc(r)], ['Ações', () => '', act]]
    },
    alien: {
        t: 'Alienações', s: 'Baixa e desfazimento de bens', base: r => r.tipo == 'Alienação', kp: v => [['Total de Alienações', v.length, 'archive', ''], ['Em Análise', v.filter(r => !done(r) && !apr(r)).length, 'search', 'y'], ['Em Tramitação', v.filter(apr).length, 'clock', 'v'], ['Concluídas', v.filter(done).length, 'ok', 'g']],
        c: [['Bem', bem], ['Órgão', r => r.orgao], ['Processo', r => r.numero], ['Motivo', r => r.detalhe], ['Situação', r => r.status, stc], ['Data', r => fmt(r.tram)], CCONC, ['Ações', () => '', act]]
    },
    transf: {
        t: 'Transferências', s: 'Transferência de bens entre órgãos', base: r => r.tipo == 'Transferência', fo: 1, fd: ['assunto', 'orgao', 'recebedor', 'resp', 'setor', 'status', 'crit'], dt: ['e1', 'e2'],
        kp: v => [['Total de Processos', v.filter(r => !done(r)).length, 'swap', '', { c: '', t: 'não inclui os concluídos' }], ['Em Análise', v.filter(pend).length, 'clock', 'y'], ['Em Tramitação', v.filter(r => !done(r) && !pend(r)).length, 'history', 'v'], ['Concluídos', v.filter(done).length, 'ok', 'g']],
        c: [['Nº do Processo', r => r.numero], ['Descrição', r => r.descricao, dsc], ['Qtde. de Bens', bem], ['Órgão Cedente', r => r.orgao], ['Órgão Destino', r => r.destino], ['Responsável', r => r.resp], ['Status', r => r.status, stc], ['Entrada', r => fmt(r.tram)], CCONC, ['Ações', () => '', act]]
    },
    vida: { t: 'Vida do Processo', s: 'Dias que cada processo está no setor, do mais antigo ao mais novo', base: r => !done(r), card: 1, c: CT }
};
const FD = [['assunto', 'Assunto'], ['orgao', 'Interessado'], ['recebedor', 'Recebedor'], ['resp', 'Responsável'], ['setor', 'Setor atual'], ['destino', 'Setor destino'], ['tipo', 'Tipo de processo'], ['status', 'Status'], ['crit', 'Prioridade']];
const FT = [['e1', 'Entrada de'], ['e2', 'Entrada até'], ['m1', 'Movimentação de'], ['m2', 'Movimentação até']];
const LS = {}, gs = k => LS[k] || (LS[k] = { q: '', sort: 'asc', page: 1, size: 10, f: {}, open: !!(VD[k] && VD[k].fo) });
// Cada tela pode limitar quais filtros aparecem (fd/dt). skip ignora um campo para montar as opções dependentes dos demais filtros.
const okF = (x, f, skip) => FD.every(([c]) => c == skip || !f[c] || x[c] == f[c]) && (!f.e1 || x.tram >= f.e1) && (!f.e2 || x.tram && x.tram <= f.e2) && (!f.m1 || x.mov >= f.m1) && (!f.m2 || x.mov && x.mov <= f.m2);
const busca = (k, s = gs(k), q = nz(s.q)) => view().filter(VD[k].base).filter(x => !q || hay(x).includes(q));
function rows(k) {
    const s = gs(k); return busca(k).filter(x => okF(x, s.f))
        .sort((a, b) => !a.tram ? 1 : !b.tram ? -1 : (s.sort == 'asc' ? 1 : -1) * a.tram.localeCompare(b.tram))
}
function dash() {
    const v = view(), ab = v.filter(r => !done(r)), ok = v.filter(done), old = ab.filter(r => r.age != null).sort((a, b) => b.age - a.age),
        B = [['até ' + cfg().atencao + ' dias', 'o', '#16a34a'], ['até ' + cfg().critico + ' dias', 'a', '#d97706'], ['acima de ' + cfg().critico + ' dias', 'c', '#dc2626']], tp = ['#1d4ed8', '#16a34a', '#d97706'];
    // Em análise / Em tramitação seguem a mesma regra das telas de Alienações e Transferências, para os números baterem
    const A = v.filter(r => r.tipo == 'Alienação'), T = v.filter(r => r.tipo == 'Transferência'),
        grp = (t, i, x, k, an, tr) => `<h3 class="kt">${ic(i, 18)} ${t}</h3><div class="kp">${kc(i, 'v', 'Total', x.length, dv(x, r => r.tram), `go('${k}')`)}${kc('ok', 'g', 'Concluídos', x.filter(done).length, dv(x.filter(done), r => r.concl), `go('${k}')`)}${kc('search', 'y', 'Em análise', x.filter(an).length, null, `go('${k}')`)}${kc('clock', '', 'Em tramitação', x.filter(tr).length, null, `go('${k}')`)}</div>`;
    return head('Dashboard Executivo', 'Visão gerencial dos processos do setor') + `<div class="kp">${kc('files', '', 'Total de Processos', v.length, dv(v, r => r.tram), "go('todos')")}${kc('clock', 'y', 'Processos em aguardo', ab.length, { c: '', t: 'todos os não concluídos' }, "go('vida')")}</div>`
        + grp('Processos de Alienação', 'archive', A, 'alien', r => !done(r) && !apr(r), apr) + grp('Processos de Transferência', 'swap', T, 'transf', pend, r => !done(r) && !pend(r)) + `
<div class="dg"><div><div class="cd"><h3>${ic('chart', 18)} Entradas e conclusões por mês</h3>${mon(v)}</div><div class="g2"><div class="cd"><h3>${ic('clock', 18)} Em aguardo por prazo</h3>${bars(B.map(b => [b[0], ab.filter(r => r.crit == b[1]).length, b[2]]))}</div>
<div class="cd"><h3>${ic('list', 18)} Em aguardo por tipo</h3>${dn(TIPOS.map((t, i) => [t, ab.filter(r => r.tipo == t).length, tp[i]]))}</div></div>
<div class="cd"><h3>${ic('bank', 18)} Interessados com mais processos em aguardo</h3>${bars(Object.entries(ab.reduce((o, r) => { const k = r.orgao || '(não informado)'; o[k] = (o[k] || 0) + 1; return o }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => [x[0], x[1], '#1d4ed8']))}</div></div>
<aside class="cd side"><h3>Mais Antigos</h3><div class="pl">${old.slice(0, 10).map(r => `<div class="pi ${r.crit}" onclick="det(${r.id})"><div class="pd"><div>${r.age}<small>dias</small></div></div><div class="pm"><b>${esc(r.numero)}</b><span>${esc(r.orgao || '—')}</span><span>${esc(r.assunto)}</span>${cb(r)}</div></div>`).join('') || '<p class="nt">Nenhum processo em aguardo.</p>'}</div><p style="margin:12px 0 0"><button class="btn s" onclick="go('vida')">Ver fila completa ${ic('cr', 14)}</button></p></aside></div>`
}
function screen(k) {
    const s = gs(k), V = VD[k], kp = V.kp ? V.kp(view().filter(V.base)) : null;
    return head(V.t, V.s, k == 'todos' || k == 'caixa' ? `<button class="btn p" onclick="edit(0)">${ic('plus', 16)} Novo processo</button>` : '') + (kp ? `<div class="kp">${kp.map(x => kc(x[2], x[3], x[0], x[1], x[4])).join('')}</div>` : '') + `<div class="cd"><div class="tb"><div class="sr">${ic('search')}<input value="${esc(s.q)}" placeholder="Pesquisar por nº, interessado, assunto, recebedor, setor, status, responsável…" oninput="gs('${k}').q=this.value;gs('${k}').page=1;list('${k}')"></div>
<select onchange="gs('${k}').sort=this.value;list('${k}')"><option value="asc" ${s.sort == 'asc' ? 'selected' : ''}>Mais antigo → mais novo</option><option value="desc" ${s.sort == 'desc' ? 'selected' : ''}>Mais novo → mais antigo</option></select>
<button class="btn" onclick="tgF('${k}')">${ic('filter', 16)} Filtros <span class="cnt" id="fc"></span></button><button class="btn" onclick="ex('${k}','x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="ex('${k}','p')">${ic('pdf', 16)} PDF</button></div><div id="fp">${s.open ? fpan(k) : ''}</div><div id="res"></div></div>`
}
// Filtros automáticos: aplicam ao escolher, e cada lista mostra só as opções que existem com os demais filtros, com a quantidade.
function fpan(k) {
    const s = gs(k), V = VD[k], b = busca(k), fd = V.fd ? FD.filter(x => V.fd.includes(x[0])) : FD, ft = V.dt ? FT.filter(x => V.dt.includes(x[0])) : FT,
        o = f => { const c = {}; b.filter(x => okF(x, s.f, f)).forEach(x => { const v = x[f]; if (v) c[v] = (c[v] || 0) + 1 }); if (s.f[f] && !c[s.f[f]]) c[s.f[f]] = 0; return (f == 'crit' ? Object.keys(CL).filter(x => x in c) : Object.keys(c).sort((x, y) => x.localeCompare(y, 'pt'))).map(v => [v, (f == 'crit' ? CL[v] : v) + ' (' + c[v] + ')']) };
    return `<div class="fg">${fd.map(([f, l]) => `<label>${l}<select onchange="sF('${k}','${f}',this.value)"><option value="">Todos</option>${o(f).map(([v, t]) => `<option value="${esc(v)}" ${s.f[f] == v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}${ft.map(([f, l]) => `<label>${l}<input type="date" value="${s.f[f] || ''}" onchange="sF('${k}','${f}',this.value)"></label>`).join('')}<button class="btn" onclick="clF('${k}')">Limpar filtros</button></div>`
}
const sF = (k, f, v) => { const s = gs(k); s.f[f] = v; s.page = 1; list(k) }, clF = k => { gs(k).f = {}; gs(k).page = 1; list(k) }, tgF = k => { const s = gs(k); s.open = !s.open; $('#fp').innerHTML = s.open ? fpan(k) : '' }, pp = (k, d) => { gs(k).page += d; list(k) };
function list(k) {
    const el = $('#res'); if (!el) return; const s = gs(k), V = VD[k], r = rows(k), n = r.length, P = Math.max(1, Math.ceil(n / s.size)); s.page = Math.min(s.page, P); const pg = r.slice((s.page - 1) * s.size, s.page * s.size), nf = Object.values(s.f).filter(Boolean).length;
    $('#fc').textContent = nf || ''; if (s.open && $('#fp')) $('#fp').innerHTML = fpan(k); const m = Math.max(1, ...r.map(x => x.age || 0));
    el.innerHTML = (V.card ? pg.map(x => `<div class="vc" onclick="det(${x.id})"><div class="pd" style="${''}"><div>${x.age ?? '?'}<small>dias</small></div></div><div class="pm" style="font-size:13px"><div><b style="display:inline">${esc(x.numero)}</b> <span class="bd">${esc(x.tipo)}</span> ${stc(x)} ${cb(x)}</div><div>${esc(x.orgao)}${x.recebedor ? ' → ' + esc(x.recebedor) : ''} · ${esc(x.assunto)}</div><div>Entrada em ${fmt(x.tram)}${x.resp ? ' · ' + esc(x.resp) : ''}</div><div class="bar"><i style="width:${(x.age || 0) / m * 100}%;background:${x.crit == 'c' ? 'var(--er)' : x.crit == 'a' ? 'var(--wn)' : 'var(--ok)'}"></i></div></div><button class="btn p s" onclick="event.stopPropagation();fin(${x.id})">${ic('ok', 15)} Concluir</button></div>`).join('') :
        `<div class="tw"><table><thead><tr>${V.c.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${pg.map(x => `<tr class="${V.row ? V.row(x) : ''}" onclick="det(${x.id})">${V.c.map(c => `<td>${c[2] ? c[2](x) : esc(c[1](x)) || '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`) + (n ? '' : '<p class="nt" style="text-align:center;padding:24px">Nenhum processo encontrado.</p>') +
        `<div class="pgr"><span>${n ? (s.page - 1) * s.size + 1 : 0}–${Math.min(n, s.page * s.size)} de ${n}</span><select onchange="gs('${k}').size=+this.value;gs('${k}').page=1;list('${k}')">${[10, 25, 50, 100].map(x => `<option ${s.size == x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="btn s" ${s.page < 2 ? 'disabled' : ''} onclick="pp('${k}',-1)">${ic('cl', 16)}</button><b>${s.page}/${P}</b><button class="btn s" ${s.page >= P ? 'disabled' : ''} onclick="pp('${k}',1)">${ic('cr', 16)}</button></div>`
}
function ex(k, kind) { const V = VD[k], c = V.c.filter(x => x[0] != 'Ações'); xp(V.t, c.map(x => x[0]), rows(k).map(x => c.map(y => y[1](x))), kind) }
function det(id) {
    const r = view().find(x => x.id == id); if (!r) return; const f = (l, v) => `<div>${l}<b>${esc(v) || '—'}</b></div>`;
    $('#dd').innerHTML = `<h2><span>Processo ${esc(r.numero)}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>${r.descricao ? `<div class="ds" style="margin-top:14px">Descrição<b>${esc(r.descricao)}</b></div>` : ''}<div class="dl">${f('Tipo', r.tipo)}${f('Status', r.status)}${f('Interessado', r.orgao)}${f('Recebedor / Destino', r.destino)}${f('Assunto', r.assunto)}${f('Responsável', r.resp)}${f('Documento', r.doc)}${f('Qtde. de Bens', r.itens)}${f('Setor atual', r.setor)}<div>Prioridade<b>${cb(r)}</b></div></div>${r.obs ? `<div class="ds">Observação<b>${esc(r.obs)}</b></div>` : ''}
<div class="tl">${r.datadoc ? `<div><b>Documento emitido</b><small>${fmt(r.datadoc)} · ${esc(r.doc)}</small></div>` : ''}<div><b>Entrada no setor</b><small>${fmt(r.tram)}</small></div>${r.mov && r.mov != r.tram && r.mov != r.concl ? `<div><b>Última movimentação</b><small>${fmt(r.mov)}</small></div>` : ''}<div><b>${done(r) ? 'Concluído' : 'Em andamento'}</b><small>${done(r) ? fmt(r.concl) + ' · ' + r.age + ' dias no setor' : (r.age ?? '?') + ' dias aguardando'}</small></div></div>
<div id="hpa"></div><h3 class="kt" style="margin:0 20px 8px">${ic('history', 16)} Histórico do processo</h3><form class="tb" style="margin:0 20px 10px" onsubmit="event.preventDefault();hAdd(${r.id})"><input type="date" id="hd" value="${TS()}" max="${TS()}" aria-label="Data"><input id="hx" maxlength="2000" placeholder="O que aconteceu? Ex.: Anexado ofício de resposta do órgão" style="flex:1;min-width:200px" aria-label="Descrição"><button class="btn p s">${ic('plus', 14)} Registrar</button></form><div class="tl" id="hl"><p class="nt">Carregando histórico…</p></div>
<div class="ac"><button class="btn p" onclick="$('#dd').close();edit(${r.id})">${ic('pen', 15)} Editar</button>${done(r) ? '' : `<button class="btn" onclick="fin(${r.id})">${ic('ok', 15)} Concluir</button>`}<span class="sp"></span>${adm() ? `<button class="btn d" onclick="rm(${r.id})">${ic('trash', 15)} Excluir</button>` : ''}</div>`; $('#dd').showModal(); hist(r.id)
}
async function hist(id) {
    const e = $('#hl'); if (!e) return; let h;
    try { h = (await api({ op: 'hist_list', id })).historico } catch (er) { e.innerHTML = '<p class="nt">Não foi possível carregar o histórico.</p>'; return }
    e.innerHTML = h.length ? h.map(x => `<div><b style="font-weight:${x.automatico ? 500 : 600}">${esc(x.descricao)}</b><small>${fmt(x.data)} · registrado por ${esc(x.usuario_nome)}${x.automatico ? ' (automático)' : ''} em ${esc(x.registrado_em)}</small></div>`).join('') : '<p class="nt">Nenhum registro ainda. Use o campo acima para anotar andamentos, mesmo que o processo não tenha terminado.</p>'
    // Atendimentos ligados a este processo
    try { const a = (await api({ op: 'do_processo', id }, '/api/atendimentos')).atendimentos, p = $('#hpa'); if (p && a.length) p.innerHTML = `<h3 class="kt" style="margin:0 20px 8px">${ic('chat', 16)} Atendimentos vinculados (${a.length})</h3><div class="tl">${a.map(x => `<div><b><a href="#" onclick="event.preventDefault();atDet(${x.id})">${esc(x.solicitante)}${x.orgao ? ' · ' + esc(x.orgao) : ''}</a></b><small>${fmt(x.data)} · ${esc(x.canal)} · ${esc(x.situacao)} · ${esc(x.atendente)}</small></div>`).join('')}</div>` } catch (er) { }
}
function hAdd(id) { const d = $('#hd').value, t = $('#hx').value.trim(); if (!d || t.length < 3) return alert('Informe a data e a descrição do registro.'); run(async () => { await api({ op: 'hist_add', id, data: d, descricao: t }); $('#hx').value = ''; hist(id) }) }
function gq(v) { const b = $('#gd'), q = nz(v); if (!q) { b.hidden = true; return } const r = view().filter(x => hay(x).includes(q)); b.hidden = false; b.innerHTML = r.slice(0, 7).map(x => `<div onclick="det(${x.id});$('#gd').hidden=true"><b>${esc(x.numero)}</b><span>${esc(x.orgao || x.assunto)} · ${esc(x.status)}</span></div>`).join('') + `<a onclick="gall()">Ver todos os ${r.length} resultados</a>` }
function gall() { gs('todos').q = $('#gq').value; gs('todos').page = 1; $('#gd').hidden = true; go('todos') }
const RP = [['resp', 'Processos por responsável'], ['alien', 'Alienações por período'], ['transf', 'Transferências por período'], ['conc', 'Processos concluídos'], ['pend', 'Processos em andamento'], ['atraso', 'Processos em atraso']]; let RS = { t: 'resp', a: '', b: '', r: '' };
function rg() {
    const v = view(), dt = r => RS.t == 'conc' ? r.concl : r.tram, p = r => (!RS.a || dt(r) >= RS.a) && (!RS.b || dt(r) && dt(r) <= RS.b) && (!RS.r || r.resp == RS.r), ls = f => { const c = RS.t == 'pend' || RS.t == 'atraso' ? CT : CTC; return { h: c.map(x => x[0]), r: v.filter(r => f(r) && p(r)).sort((a, b) => (b.age ?? -1) - (a.age ?? -1)).map(r => c.map(x => x[1](r))) } };
    if (RS.t == 'resp') { const g = {}; v.filter(p).forEach(r => { const k = r.resp || '(sem responsável)'; (g[k] = g[k] || []).push(r) }); return { h: ['Responsável', 'Total', 'Em andamento', 'Concluídos', 'Idade média dos em andamento (dias)'], r: Object.entries(g).sort((a, b) => b[1].length - a[1].length).map(([k, a]) => { const o = a.filter(r => !done(r) && r.age != null); return [k, a.length, a.filter(r => !done(r)).length, a.filter(done).length, o.length ? Math.round(o.reduce((s, r) => s + r.age, 0) / o.length) : 0] }) } }
    return ls({ alien: r => r.tipo == 'Alienação', transf: r => r.tipo == 'Transferência', conc: done, pend: r => !done(r), atraso: r => !done(r) && r.crit == 'c' }[RS.t])
}
function relscr() {
    return head('Listas e Relatórios', 'Relatórios gerenciais e cadastros do sistema') + `<div class="sg2"><button class="${sub == 'rel' ? 'on' : ''}" onclick="sub='rel';draw()">Relatórios</button><button class="${sub == 'cad' ? 'on' : ''}" onclick="sub='cad';draw()">Cadastros e parâmetros</button></div>` + (sub == 'cad' ? listas() : `<div class="rp">${RP.map(([k, n]) => `<button class="${RS.t == k ? 'on' : ''}" onclick="RS.t='${k}';draw()">${ic(k == 'resp' ? 'user' : 'chart', 16)} ${n}</button>`).join('')}</div>
<div class="cd"><div class="tb"><label class="nt">${RS.t == 'conc' ? 'Conclusão' : 'Entrada'} de <input type="date" value="${RS.a}" onchange="RS.a=this.value;rl()"></label><label class="nt">até <input type="date" value="${RS.b}" onchange="RS.b=this.value;rl()"></label><label class="nt">Responsável <select onchange="RS.r=this.value;rl()"><option value="">Todos</option>${L.resp.map(x => `<option ${RS.r == x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label><span class="sp"></span><button class="btn" onclick="rx('x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="rx('p')">${ic('pdf', 16)} PDF</button></div><div id="rr"></div></div>`)
}
function rl() { const e = $('#rr'); if (!e) return; const g = rg(); e.innerHTML = `<p class="nt">${g.r.length} registro(s)</p><div class="tw" style="max-height:60vh"><table><thead><tr>${g.h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${g.r.slice(0, 500).map(x => `<tr>${x.map(c => `<td>${esc(c) || '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` + (g.r.length > 500 ? '<p class="nt">Exibindo 500; a exportação inclui todos.</p>' : '') }
const rx = k => { const g = rg(); xp(RP.find(x => x[0] == RS.t)[1], g.h, g.r, k) };
const LN = [['status', 'Status dos processos'], ['resp', 'Responsáveis (servidores)'], ['orgaos', 'Órgãos'], ['motivos', 'Motivos da baixa (alienação)'], ['assuntos', 'Assuntos (caixa do setor)'], ['assuntos_at', 'Assuntos (atendimentos)']];
function listas() { const c = cfg(); return `<div class="ib"><b>Prazos de criticidade:</b> define Dentro do prazo, Atenção e Crítico pelos dias no setor. Status que começam com “CONCLU” contam como concluídos.<div class="tb" style="margin:10px 0 0"><label>Atenção após <input type="number" min="1" style="width:90px" value="${c.atencao}" onchange="L.cfg={...cfg(),atencao:+this.value};sl()"> dias</label><label>Crítico após <input type="number" min="1" style="width:90px" value="${c.critico}" onchange="L.cfg={...cfg(),critico:+this.value};sl()"> dias</label></div></div><div class="g2">` + LN.map(([k, n]) => `<div class="cd"><h3>${n} (${L[k].length})</h3><div class="tb"><input id="n_${k}" placeholder="Novo item…" onkeydown="if(event.key=='Enter')addL('${k}')" style="flex:1"><button class="btn p s" onclick="addL('${k}')">${ic('plus', 14)} Adicionar</button></div><div class="lst">${L[k].map((x, i) => `<div class="br2">${EL && EL.k == k && EL.i == i ? `<input id="el" value="${esc(x)}" onkeydown="if(event.key=='Enter')saveL();if(event.key=='Escape')cancelL()" style="flex:1;margin-right:6px"><span><button class="btn p s" title="Salvar" onclick="saveL()">${ic('ok', 14)}</button> <button class="btn s" title="Cancelar" onclick="cancelL()">${ic('x', 13)}</button></span>` : `<span>${esc(x)}</span><span><button class="btn s" title="Editar" onclick="editL('${k}',${i})">${ic('pen', 13)}</button> <button class="btn s" title="Remover" onclick="delL('${k}',${i})">${ic('x', 13)}</button></span>`}</div>`).join('')}</div></div>`).join('') + '</div>' }
function addL(k) { const v = $('#n_' + k).value.trim(); if (!v) return; if (L[k].includes(v)) return alert('Esse item já existe.'); L[k].push(v); if (k != 'status' && k != 'resp') L[k].sort((a, b) => a.localeCompare(b, 'pt')); sl() }
let EL = null;
function editL(k, i) { EL = { k, i }; draw(); const e = $('#el'); if (e) { e.focus(); e.select() } }
function cancelL() { EL = null; draw() }
function saveL() {
    const { k, i } = EL, o = L[k][i], n = $('#el').value.trim(); if (!n || n == o) return cancelL();
    if (L[k].includes(n)) return alert('Esse item já existe.');
    if (k == 'status' && o.startsWith('CONCLU') && !n.startsWith('CONCLU')) return alert('O status de conclusão precisa continuar começando com "CONCLU".');
    const M = { status: r => r.status == o && (r.status = n), resp: r => r.resp == o && (r.resp = n), orgaos: r => { let c = 0; if (r.orgao == o) { r.orgao = n; c = 1 } if (r.recebedor == o) { r.recebedor = n; c = 1 } return c }, motivos: r => r.tipo == 'Alienação' && r.detalhe == o && (r.detalhe = n), assuntos: r => r.tipo == 'Caixa do setor' && r.detalhe == o && (r.detalhe = n), assuntos_at: () => 0 }, ch = [];
    D.forEach(r => { const c = { ...r }; if (M[k](c)) ch.push(c) });
    if (ch.length && !confirm(ch.length + ' processo(s) usam "' + o + '" e serão atualizados para "' + n + '". Continuar?')) return;
    run(async () => { L[k][i] = n; if (k != 'status' && k != 'resp') L[k].sort((a, b) => a.localeCompare(b, 'pt')); await api({ op: 'listas', listas: L }); await Promise.all(ch.map(put)); EL = null; draw() })
}
function delL(k, i) { if (confirm('Remover "' + L[k][i] + '" da lista?')) { L[k].splice(i, 1); sl() } }
function sl() { run(async () => { await api({ op: 'listas', listas: L }); draw() }) }
function seed() { run(async () => { await api({ op: 'bulk', items: SEED.processos }); await api({ op: 'listas', listas: L }); await load() }) }
let cur = {}; const KS = ['numero', 'descricao', 'setor', 'tipo', 'tram', 'orgao', 'recebedor', 'detalhe', 'itens', 'doc', 'datadoc', 'status', 'resp', 'concl', 'obs', 'bem'];
function edit(id) {
    cur = id ? { ...D.find(r => r.id == id) } : { id: 0, numero: '', descricao: '', setor: '', tipo: TIPOS[0], tram: TS(), orgao: '', recebedor: '', detalhe: '', itens: '', doc: '', datadoc: '', status: L.status[0] || '', resp: '', concl: '', obs: '', bem: '' };
    $('#dt').textContent = id ? 'Processo ' + cur.numero : 'Novo processo'; form();
    $('#ac').innerHTML = `<button class="btn p" onclick="sv()">${ic('ok', 15)} Salvar</button>${id ? `<button class="btn" onclick="fin(${id})">Concluir hoje</button>` : ''}<span class="sp"></span>${id && adm() ? `<button class="btn d" onclick="rm(${id})">Excluir</button>` : ''}<button class="btn" onclick="$('#dg').close()">Cancelar</button>`; $('#dg').showModal()
}
function collect() { KS.forEach(k => { const e = $('#f_' + k); if (e) cur[k] = e.value.trim() }) }
function rt() { const o = cur.tipo; collect(); if (cur.tipo != o) cur.detalhe = ''; form() }
function form() {
    const f = (k, l, t = 'text', w = '', ls = '') => `<label class="${w}">${l}<input type="${t}" id="f_${k}" value="${esc(cur[k])}" ${ls ? 'list="' + ls + '"' : ''}></label>`,
        s = (k, l, a) => { a = [...new Set(['', ...a, cur[k] || ''])]; return `<label>${l}<select id="f_${k}">${a.map(x => `<option ${cur[k] == x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>` },
        dl = (id, a) => `<datalist id="${id}">${a.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`, T = cur.tipo;
    const ex = T == 'Transferência' ? f('orgao', 'Órgão cedente (origem)', 'text', '', 'dl_o') + f('recebedor', 'Órgão recebedor (destino)', 'text', '', 'dl_o') + f('itens', 'Quantidade de itens', 'number')  :
        T == 'Alienação' ? f('orgao', 'Órgão', 'text', '', 'dl_o') + s('detalhe', 'Motivo da baixa', L.motivos) + f('itens', 'Quantidade de itens', 'number') :
            f('orgao', 'Interessado', 'text', '', 'dl_o') + f('detalhe', 'Assunto / marcador', 'text', '', 'dl_a');
    $('#fm').innerHTML = f('numero', 'Nº do processo', 'text', 'w') + `<label class="w">Descrição<textarea id="f_descricao" rows="2" maxlength="4000" placeholder="Resumo do que trata o processo">${esc(cur.descricao)}</textarea></label><label>Tipo<select id="f_tipo" onchange="rt()">${TIPOS.map(x => `<option ${T == x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>` + f('tram', 'Data de Tramitação', 'date') + ex + f('doc', 'Nº do documento') + f('datadoc', 'Data do documento', 'date') + s('status', 'Status', L.status) + s('resp', 'Responsável', L.resp) + f('setor', 'Setor atual (vazio = DBM)', 'text', '', 'dl_o') + f('concl', 'Data de conclusão', 'date') + `<label class="w">Observação<textarea id="f_obs" rows="2" maxlength="4000">${esc(cur.obs)}</textarea></label>` + dl('dl_o', L.orgaos) + dl('dl_a', L.assuntos)
}
async function put(r) { const j = await api({ op: 'save', item: r }); r.id = j.id; const i = D.findIndex(x => x.id == r.id); i < 0 ? D.push(r) : D[i] = r }
// Nº comparado sem pontos, barras, traços e espaços (mesma regra do servidor)
const chNum = n => String(n || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
function sv() {
    collect(); const r = { ...cur }; if (!r.numero || !r.tram) return alert('Informe o nº do processo e a data de entrada.');
    r.itens = r.itens === '' ? '' : +r.itens; if (r.tipo != 'Transferência') r.recebedor = ''; if (r.tipo == 'Caixa do setor') r.itens = ''; r.status = r.status || L.status[0] || '';
    const o = D.find(x => x.id == r.id); if (done(r) && !r.concl) r.concl = TS(); if (!done(r) && o && o.status != r.status) r.concl = ''; if (!o || o.status != r.status || o.resp != r.resp) r.mov = TS();
    const x = D.find(p => p.id != r.id && chNum(p.numero) == chNum(r.numero));
    if (x && (!o || chNum(o.numero) != chNum(r.numero))) { alert(`Já existe o processo nº ${x.numero} (${x.tipo}${x.orgao ? ', ' + x.orgao : ''}). Ele será aberto para você conferir.`); $('#dg').close(); det(x.id); return }
    umaVez(async () => { await put(r); $('#dg').close(); draw() })
}
function fin(id) { const r = { ...D.find(x => x.id == id) }; r.status = L.status.find(s => s.startsWith('CONCLU')) || 'CONCLUÍDO – DBM'; r.concl = r.mov = TS(); run(async () => { await put(r); $('#dg').close(); $('#dd').close(); draw() }) }
function rm(id) { if (confirm('Excluir este processo?')) run(async () => { await api({ op: 'del', id }); D = D.filter(x => x.id != id); $('#dg').close(); $('#dd').close(); draw() }) }
const H = ['Nº do processo', 'Descrição', 'Tipo', 'Órgão cedente / Órgão / Interessado', 'Órgão recebedor', 'Motivo da baixa / Assunto', 'Itens', 'Documento', 'Data do doc.', 'Data de tramitação', 'Status', 'Responsável', 'Conclusão', 'Observação', 'Bem', 'Setor atual'], K = ['numero', 'descricao', 'tipo', 'orgao', 'recebedor', 'detalhe', 'itens', 'doc', 'datadoc', 'tram', 'status', 'resp', 'concl', 'obs', 'bem', 'setor'];
function xl() {
    const rows = view().sort((a, b) => (b.age ?? -1) - (a.age ?? -1)).map(r => { const o = {}; K.forEach((k, i) => o[H[i]] = /^(tram|datadoc|concl)$/.test(k) ? fmt(r[k]).replace('—', '') : r[k]); o['Dias com o setor'] = r.age; return o });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'PROCESSOS'); XLSX.writeFile(wb, 'processos_dbm_' + TS() + '.xlsx')
}
function bk() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ processos: D, listas: L })], { type: 'application/json' })); a.download = 'backup_dbm_' + TS() + '.json'; a.click() }
const pd = v => { if (v instanceof Date) return new Date(v.getTime() + 432e5).toISOString().slice(0, 10); v = String(v ?? '').trim(); let m = v.match(/^(\d\d)\/(\d\d)\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : /^\d{4}-\d\d-\d\d/.test(v) ? v.slice(0, 10) : '' };
const nh = s => nz(s).replace(/[^a-z0-9]/g, '');
const EXT = { numero: ['numero', 'processo', 'nprocesso', 'nodoprocesso'], descricao: ['descricao', 'descricaodoprocesso'], setor: ['setor', 'setoratual'], orgao: ['orgao', 'interessado', 'orgaocedente', 'cedente'], recebedor: ['recebedor', 'orgaorecebedor', 'destino'], detalhe: ['motivo', 'motivodabaixa', 'assunto'], itens: ['itens', 'quantidade', 'qtd', 'qtdeitens'], doc: ['documento', 'ndocumento'], tram: ['entrada', 'dataentrada', 'datadeentrada', 'datadetramitacao'], status: ['status', 'situacao'], resp: ['responsavel'], concl: ['conclusao', 'dataconclusao'], obs: ['observacao', 'obs'], bem: ['bem', 'descricaodobem'], datadoc: ['datadodocumento'] };
let IMP = null;
function openImp() { IMP = null; $('#dd').innerHTML = `<h2><span>Importar dados</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><div class="fm"><label>Parte a importar<select id="ip" onchange="impPrev()"><option value="">Todos os tipos (conforme o arquivo)</option>${TIPOS.map(t => `<option>${t}</option>`).join('')}</select></label><label>Modo<select id="im" onchange="impPrev()"><option value="u">Adicionar e atualizar (não apaga nada)</option><option value="r">Substituir somente essa parte</option><option value="f">Substituir TUDO (restaurar backup)</option></select></label><label class="w">Arquivo (.xlsx ou backup .json)<input type="file" id="if" accept=".xlsx,.xlsm,.xls,.json" onchange="impRead()"></label><div class="w ib" id="ipv">Escolha o arquivo para ver a prévia antes de importar. Só a parte escolhida é alterada; as demais não são tocadas.</div></div><div class="ac"><button class="btn p" id="ig" disabled onclick="impGo()">${ic('up', 15)} Importar</button><button class="btn" onclick="$('#dd').close()">Cancelar</button></div>`; $('#dd').showModal() }
async function impRead() { const f = $('#if').files[0]; if (!f) return; try { if (/\.json$/i.test(f.name)) { const j = JSON.parse(await f.text()); IMP = { rows: Array.isArray(j) ? j : j.processos, ls: Array.isArray(j) ? null : j.listas }; if (!Array.isArray(IMP.rows)) throw 0 } else IMP = { wb: XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true }) } } catch (e) { IMP = null; $('#ig').disabled = true; $('#ipv').textContent = 'Arquivo inválido.'; return } impPrev() }
function rowsOf(p) {
    if (IMP.rows) return IMP.rows; const wb = IMP.wb, q = p ? nh(p).slice(0, 6) : '', sn = wb.SheetNames.find(n => q && nh(n).startsWith(q)) || wb.SheetNames.find(n => nh(n) == 'processos') || wb.SheetNames[0];
    return XLSX.utils.sheet_to_json(wb.Sheets[sn], { defval: '' }).map(o => { const m = {}; for (const h in o) m[nh(h)] = o[h]; const r = {}; K.forEach((c, j) => { const a = [nh(H[j]), ...(EXT[c] || [])].find(x => x in m), v = a ? m[a] : ''; r[c] = /^(tram|datadoc|concl)$/.test(c) ? pd(v) : String(v ?? '').trim() }); r.itens = r.itens === '' ? '' : +r.itens || ''; return r })
}
function impPrev() {
    if (!IMP) return; const m = $('#im').value, p = m == 'f' ? '' : $('#ip').value, all = rowsOf(p); let skip = 0; const rs = [];
    all.forEach(r => { if (!String(r.numero || '').trim()) return; const t = r.tipo ? TIPOS.find(x => nh(x).startsWith(nh(r.tipo).slice(0, 6))) : p; if (!t || (p && t != p)) { skip++; return } rs.push({ ...r, numero: String(r.numero).trim(), tipo: t }) });
    const key = r => r.numero + '|' + r.tipo, ex = new Set(D.map(r => r.numero.trim() + '|' + r.tipo)), ts = [...new Set(rs.map(r => r.tipo))]; let nw = 0, up = 0;[...new Map(rs.map(r => [key(r), r])).values()].forEach(r => ex.has(key(r)) ? up++ : nw++);
    const del = m == 'r' ? D.filter(r => ts.includes(r.tipo)).length : m == 'f' ? D.length : 0; IMP.rs = rs;
    $('#ipv').innerHTML = `<b>${rs.length}</b> linha(s) válida(s) ${ts.length ? 'de: ' + ts.join(', ') : ''}.<br>` + (m == 'u' ? `${nw} nova(s) · ${up} já existente(s), que serão atualizadas (pelo nº do processo + tipo).` : m == 'r' ? `Serão removidos ${del} processo(s) existente(s) de ${ts.join(', ') || '—'}, junto com o histórico deles, e inseridos ${rs.length}.` : `<b>Atenção:</b> apaga os ${del} processos atuais de todos os tipos, junto com todo o histórico registrado, e coloca ${rs.length}${IMP.ls ? ' (e restaura as listas do backup)' : ''}.`) + (m != 'f' ? '<br>As demais partes não serão alteradas.' : '') + (skip ? `<br>${skip} linha(s) ignorada(s) (sem nº ou de outro tipo).` : ''); $('#ig').disabled = !rs.length
}
function impGo() {
    const m = $('#im').value, p = m == 'f' ? '' : $('#ip').value, rs = IMP.rs; if (!rs.length) return;
    if (!confirm(m == 'f' ? 'Substituir TODOS os dados do banco? Vale para todos os usuários.' : 'Confirmar a importação' + (p ? ' de ' + p : '') + '?')) return;
    const st = L.status[0] || ''; rs.forEach(r => { if (!r.status) r.status = st; if (done(r) && !r.concl) r.concl = TS() });
    const ts = [...new Set(rs.map(r => r.tipo))], ex = new Map(D.map(r => [r.numero.trim() + '|' + r.tipo, r])), ups = [], news = [];
    if (m == 'u') { new Map(rs.map(r => [r.numero + '|' + r.tipo, r])).forEach((r, k) => { const o = ex.get(k); if (!o) return news.push(r); const { id, ...old } = o, d = { ...old }; for (const c in r) if (r[c] !== '' && r[c] != null) d[c] = r[c]; if (r.status && r.status != old.status) d.mov = TS(); ups.push({ id, data: d }) }) } else rs.forEach(r => news.push(r));
    run(async () => { if (m == 'f') { await api({ op: 'bulk', items: news }); if (IMP.ls) { L = Object.assign(L, IMP.ls); await api({ op: 'listas', listas: L }) } } else await api({ op: 'merge', deltipos: m == 'r' ? (p ? [p] : ts) : [], updates: ups, news }); $('#dd').close(); LAST = ''; await load() })
}
