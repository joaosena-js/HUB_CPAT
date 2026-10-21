// Gestão de Atendimentos: registro dos atendimentos por e-mail, WhatsApp, presencial, Teams e ligação
const AT_CANAIS = ['E-mail', 'WhatsApp', 'Presencial', 'Teams', 'Ligação'], AT_CATS = ['Orientação', 'Suporte operacional'];
const AT_SIT = ['Em atendimento', 'Aguardando análise interna', 'Aguardando retorno do solicitante', 'Finalizado'], AT_FIM = 'Finalizado';
const AT_COR = { 'Em atendimento': '', 'Aguardando análise interna': 'y', 'Aguardando retorno do solicitante': 'n', 'Finalizado': 'g' };
let AT = [], ATU = [], ATL = '', ATP = null;
const ATS = { q: '', f: {}, page: 1, size: 25, open: true };
const atDias = a => Math.max(0, Math.round(day(a.data_finalizacao || TS()) - day(a.data)));
const atSit = a => `<span class="bd ${AT_COR[a.situacao] ?? ''}">${esc(a.situacao)}</span>`;
const atPode = a => adm() || (ME && a.atendente_id == ME.id);
const atView = () => AT.map(a => ({ ...a, andamento: a.situacao == AT_FIM ? 'Finalizado' : 'Em aberto', dias: atDias(a) }));
const AT_FD = [['andamento', 'Andamento'], ['situacao', 'Situação'], ['atendente', 'Atendente'], ['orgao', 'Órgão'], ['canal', 'Canal'], ['categoria', 'Categoria'], ['assunto', 'Assunto']];
const atOk = (x, f, skip) => AT_FD.every(([c]) => c == skip || !f[c] || x[c] == f[c]) && (!f.d1 || x.data >= f.d1) && (!f.d2 || x.data <= f.d2);
const atBusca = () => { const q = nz(ATS.q); return atView().filter(x => !q || nz([x.solicitante, x.contato, x.orgao, x.assunto, x.descricao, x.canal, x.categoria, x.atendente, x.situacao, x.processo_numero].join(' ')).includes(q)) };
const atRows = () => atBusca().filter(x => atOk(x, ATS.f));
// Colunas: título, valor para exportação, HTML opcional para a tela
const AT_C = [['Data', a => fmt(a.data)], ['Hora', a => a.hora || ''], ['Solicitante', a => a.solicitante], ['Órgão', a => a.orgao], ['Assunto', a => a.assunto], ['Canal', a => a.canal], ['Categoria', a => a.categoria], ['Atendente', a => a.atendente], ['Situação', a => a.situacao, atSit], ['Dias', a => a.dias]];
const AT_X = [...AT_C, ['Descrição', a => a.descricao], ['Contato', a => a.contato], ['Data de finalização', a => a.data_finalizacao ? fmt(a.data_finalizacao) : ''], ['Processo vinculado', a => a.processo_numero || '']];

// Busca no servidor. silencioso = chamada do intervalo automático: só redesenha se algo mudou e ninguém estiver digitando.
function atLoad(silencioso) {
    return ATP || (ATP = (async () => {
        try {
            const j = await api({ op: 'list' }, '/api/atendimentos'), sg = JSON.stringify(j); ATU = j.atendentes;
            if (sg === ATL) return; ATL = sg; AT = j.atendimentos;
            if ((tab == 'aten' || tab == 'relg') && (!silencioso || (!$('#dg').open && !$('#dd').open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))) draw()
        } catch (e) { if (!silencioso) alert('Erro: ' + e.message) } finally { ATP = null }
    })())
}
function atScr() {
    const v = atView(), ab = v.filter(a => a.situacao != AT_FIM), m = TS().slice(0, 7), fm = v.filter(a => a.situacao == AT_FIM && (a.data_finalizacao || '').startsWith(m)), fz = v.filter(a => a.situacao == AT_FIM);
    const med = fz.length ? Math.round(fz.reduce((s, a) => s + a.dias, 0) / fz.length) : 0;
    return head('Atendimentos', 'Atendimentos por e-mail, WhatsApp, presencial, Teams e ligação', `<button class="btn p" onclick="atEd(0)">${ic('plus', 16)} Novo atendimento</button>`)
        + `<div class="kp">${kc('chat', 'y', 'Em aberto', ab.length, { c: '', t: 'todos os atendentes' }, "atFiltra({andamento:'Em aberto'})")}${kc('user', '', 'Meus em aberto', ab.filter(a => ME && a.atendente_id == ME.id).length, null, 'atMeus()')}${kc('ok', 'g', 'Finalizados no mês', fm.length, null)}${kc('clock', 'v', 'Tempo médio até finalizar', med + ' dias', { c: '', t: fz.length + ' finalizado(s)' })}</div>`
        + `<div class="cd"><div class="tb"><div class="sr">${ic('search')}<input value="${esc(ATS.q)}" placeholder="Pesquisar por solicitante, órgão, assunto, descrição, atendente…" oninput="ATS.q=this.value;ATS.page=1;atList()"></div><button class="btn" onclick="ATS.open=!ATS.open;atList()">${ic('filter', 16)} Filtros <span class="cnt" id="fc"></span></button><button class="btn" onclick="atEx('x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="atEx('p')">${ic('pdf', 16)} PDF</button></div><div id="fp"></div><div id="res"></div></div>`
}
// Filtros automáticos, no mesmo padrão da tela de Transferências
function atFp() {
    const b = atBusca(), f = ATS.f, o = c => { const n = {}; b.filter(x => atOk(x, f, c)).forEach(x => { if (x[c]) n[x[c]] = (n[x[c]] || 0) + 1 }); if (f[c] && !n[f[c]]) n[f[c]] = 0; return Object.keys(n).sort((x, y) => x.localeCompare(y, 'pt')).map(v => [v, v + ' (' + n[v] + ')']) };
    return `<div class="fg">${AT_FD.map(([c, l]) => `<label>${l}<select onchange="atSF('${c}',this.value)"><option value="">Todos</option>${o(c).map(([v, t]) => `<option value="${esc(v)}" ${f[c] == v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`).join('')}${[['d1', 'Data de'], ['d2', 'Data até']].map(([c, l]) => `<label>${l}<input type="date" value="${f[c] || ''}" onchange="atSF('${c}',this.value)"></label>`).join('')}<button class="btn" onclick="ATS.f={};ATS.page=1;atList()">Limpar filtros</button></div>`
}
const atSF = (c, v) => { ATS.f[c] = v; ATS.page = 1; atList() };
function atFiltra(f) { ATS.f = f; ATS.q = ''; ATS.page = 1; ATS.open = true; if (tab != 'aten') go('aten'); else draw() }
function atMeus() { atFiltra({ andamento: 'Em aberto', atendente: ME ? ME.nome : '' }) }
function atList() {
    const el = $('#res'); if (!el) return; const r = atRows(), n = r.length, P = Math.max(1, Math.ceil(n / ATS.size)); ATS.page = Math.min(ATS.page, P);
    const pg = r.slice((ATS.page - 1) * ATS.size, ATS.page * ATS.size); $('#fc').textContent = Object.values(ATS.f).filter(Boolean).length || ''; $('#fp').innerHTML = ATS.open ? atFp() : '';
    el.innerHTML = `<div class="tw"><table><thead><tr>${AT_C.map(c => `<th>${c[0]}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${pg.map(a => `<tr class="${a.situacao != AT_FIM && a.dias > 30 ? 'r' : a.situacao != AT_FIM && a.dias > 7 ? 'w' : ''}" onclick="atDet(${a.id})">${AT_C.map(c => `<td>${c[2] ? c[2](a) : esc(c[1](a)) || '—'}</td>`).join('')}<td><button class="btn s" title="Detalhes" onclick="event.stopPropagation();atDet(${a.id})">${ic('eye', 15)}</button></td></tr>`).join('')}</tbody></table></div>`
        + (n ? '' : `<p class="nt" style="text-align:center;padding:24px">${AT.length ? 'Nenhum atendimento encontrado com esses filtros.' : 'Nenhum atendimento registrado ainda.'}</p>`)
        + `<div class="pgr"><span>${n ? (ATS.page - 1) * ATS.size + 1 : 0}–${Math.min(n, ATS.page * ATS.size)} de ${n}</span><select onchange="ATS.size=+this.value;ATS.page=1;atList()">${[25, 50, 100].map(x => `<option ${ATS.size == x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="btn s" ${ATS.page < 2 ? 'disabled' : ''} onclick="ATS.page--;atList()">${ic('cl', 16)}</button><b>${ATS.page}/${P}</b><button class="btn s" ${ATS.page >= P ? 'disabled' : ''} onclick="ATS.page++;atList()">${ic('cr', 16)}</button></div>`
}
const atEx = k => xp('Atendimentos', AT_X.map(c => c[0]), atRows().map(a => AT_X.map(c => c[1](a))), k);

async function atDet(id) {
    let a = atView().find(x => x.id == id); if (!a) { await atLoad(1); a = atView().find(x => x.id == id) } if (!a) return;
    const f = (l, v) => `<div>${l}<b>${esc(v) || '—'}</b></div>`, pode = atPode(a);
    $('#dd').innerHTML = `<h2><span>Atendimento de ${esc(a.solicitante)}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><div class="ds" style="margin-top:14px">Descrição<b>${esc(a.descricao)}</b></div><div class="dl">${f('Data e hora', fmt(a.data) + (a.hora ? ' às ' + a.hora : ''))}<div>Situação<b>${atSit(a)}</b></div>${f('Órgão', a.orgao)}${f('Solicitante', a.solicitante)}${f('Contato', a.contato)}${f('Canal', a.canal)}${f('Categoria', a.categoria)}${f('Assunto', a.assunto)}${f('Atendente', a.atendente)}${f(a.situacao == AT_FIM ? 'Finalizado em' : 'Dias em aberto', a.situacao == AT_FIM ? fmt(a.data_finalizacao) + ' (' + a.dias + ' dias)' : a.dias)}<div>Processo vinculado<b>${a.processo_id ? `<a href="#" onclick="event.preventDefault();det(${a.processo_id})">${esc(a.processo_numero)}</a>` : '—'}</b></div></div>
<h3 class="kt" style="margin:0 20px 8px">${ic('history', 16)} Histórico do atendimento</h3><form class="tb" style="margin:0 20px 10px" onsubmit="event.preventDefault();atHAdd(${a.id})"><input type="date" id="hd" value="${TS()}" max="${TS()}" aria-label="Data"><input id="hx" maxlength="2000" placeholder="O que foi feito? Ex.: Enviada orientação por e-mail" style="flex:1;min-width:200px" aria-label="Descrição"><button class="btn p s">${ic('plus', 14)} Registrar</button></form><div class="tl" id="hl"><p class="nt">Carregando histórico…</p></div>
<div class="ac">${pode ? `<button class="btn p" onclick="atEd(${a.id})">${ic('pen', 15)} Editar</button>${a.situacao != AT_FIM ? `<button class="btn" onclick="atFin(${a.id})">${ic('ok', 15)} Finalizar hoje</button>` : ''}` : '<span class="nt">Somente o atendente responsável ou o administrador pode alterar este atendimento.</span>'}<span class="sp"></span>${adm() ? `<button class="btn d" onclick="atRm(${a.id})">${ic('trash', 15)} Excluir</button>` : ''}</div>`;
    if (!$('#dd').open) $('#dd').showModal(); atHist(a.id)
}
async function atHist(id) {
    const e = $('#hl'); if (!e) return; let h;
    try { h = (await api({ op: 'hist_list', id }, '/api/atendimentos')).historico } catch (er) { e.innerHTML = '<p class="nt">Não foi possível carregar o histórico.</p>'; return }
    e.innerHTML = h.length ? h.map(x => `<div><b style="font-weight:${x.automatico ? 500 : 600}">${esc(x.descricao)}</b><small>${fmt(x.data)} · registrado por ${esc(x.usuario_nome)}${x.automatico ? ' (automático)' : ''} em ${esc(x.registrado_em)}</small></div>`).join('') : '<p class="nt">Nenhum registro ainda.</p>'
}
function atHAdd(id) { const d = $('#hd').value, t = $('#hx').value.trim(); if (!d || t.length < 3) return alert('Informe a data e a descrição do registro.'); run(async () => { await api({ op: 'hist_add', id, data: d, descricao: t }, '/api/atendimentos'); $('#hx').value = ''; atHist(id) }) }

function atEd(id) {
    const n = new Date(), a = id ? AT.find(x => x.id == id) : { id: 0, data: TS(), hora: String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'), orgao: '', solicitante: '', contato: '', categoria: '', assunto: '', descricao: '', canal: '', atendente_id: ME ? ME.id : 0, situacao: AT_SIT[0], data_finalizacao: '', processo_numero: '' };
    if (!a) return; const sel = (i, l, ops, v, req = 1) => `<label>${l}<select id="a_${i}" ${req ? 'required' : ''}><option value="">Selecione…</option>${ops.map(o => `<option value="${esc(o[0])}" ${v == o[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`, two = x => x.map(o => [o, o]);
    const us = [...ATU.map(u => [u.id, u.nome])]; if (a.atendente_id && !us.some(u => u[0] == a.atendente_id)) us.push([a.atendente_id, a.atendente + ' (inativo)']);
    $('#dd').innerHTML = `<h2><span>${id ? 'Editar atendimento' : 'Novo atendimento'}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><form class="fm" onsubmit="event.preventDefault();atSv(${a.id})">
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
    if (!$('#dd').open) $('#dd').showModal(); $('#dd').scrollTop = 0
}
function atSitMuda() { const f = $('#a_data_finalizacao'); if ($('#a_situacao').value == AT_FIM) { if (!f.value) f.value = TS() } else f.value = '' }
function atSv(id) {
    const g = k => $('#a_' + k).value.trim(), b = { id }; ['data', 'hora', 'canal', 'orgao', 'solicitante', 'contato', 'categoria', 'assunto', 'descricao', 'atendente_id', 'situacao', 'data_finalizacao', 'processo_numero'].forEach(k => b[k] = g(k));
    if (b.situacao == AT_FIM && !b.data_finalizacao) return alert('Informe a data de finalização.');
    run(async () => { const j = await api({ op: 'save', item: b }, '/api/atendimentos'); await atLoad(1); atDet(j.id); if (tab == 'aten') draw() })
}
function atFin(id) { const a = AT.find(x => x.id == id); if (!a) return; run(async () => { await api({ op: 'save', item: { ...a, situacao: AT_FIM, data_finalizacao: TS() } }, '/api/atendimentos'); await atLoad(1); atDet(id); if (tab == 'aten') draw() }) }
function atRm(id) { if (confirm('Excluir este atendimento e o histórico dele?')) run(async () => { await api({ op: 'del', id }, '/api/atendimentos'); $('#dd').close(); await atLoad(1); if (tab == 'aten') draw() }) }
