// Base do Hub DBM: ícones, acesso, comunicação com a API, navegação e funções de tela compartilhadas
const IC = { dash: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>', inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>', archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>', swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>', files: '<path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/>', history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>', chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>', search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>', up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>', xls: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>', pdf: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', filter: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>', cl: '<path d="m15 18-6-6 6-6"/>', cr: '<path d="m9 18 6-6-6-6"/>', clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>', ok: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>', tu: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>', td: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>', eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>', trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>', bank: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>', list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>', user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' };
IC.pie = '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>';
IC.chat = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
IC.home = '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
IC.cal = '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>';
IC.clip = '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>';
const ic = (n, s = 18) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const TIPOS = ['Transferência', 'Alienação', 'Caixa do setor'], MS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
let LAST = '', D = [], L = { status: [], resp: [], orgaos: [], motivos: [], assuntos: [] }, SEED = null, ready = false;
const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), nz = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
try { localStorage.removeItem('dbm_pw') } catch (e) { }
const HD = { 'content-type': 'application/json', 'x-hub': '1' };
let ME = null, AUTH = null;
// Tela de login (ou de configuração inicial, quando ainda não existe nenhum usuário). Uma única tela aberta por vez.
function auth(setup) {
    return AUTH || (AUTH = new Promise(ok => {
        const d = $('#lg'); $('#lgs').hidden = !setup; d.querySelectorAll('[data-s]').forEach(e => e.hidden = !setup);
        $('#lgt').textContent = setup ? 'Configuração inicial' : 'Acesso ao sistema'; $('#lge').textContent = ''; $('#lgp').value = ''; $('#lgp').autocomplete = setup ? 'new-password' : 'current-password';
        $('#lgf').onsubmit = async e => {
            e.preventDefault(); const b = { op: setup ? 'setup' : 'login', login: $('#lgl').value.trim(), senha: $('#lgp').value, chave: $('#lgk').value, nome: $('#lgn').value.trim() };
            if (!b.login || !b.senha) return $('#lge').textContent = 'Informe login e senha.';
            const r = await fetch('/api/data', { method: 'POST', headers: HD, body: JSON.stringify(b) }).catch(() => null), j = r ? await r.json().catch(() => ({})) : {};
            if (!r || !r.ok) { $('#lge').textContent = j.error || 'Não foi possível acessar. Verifique a conexão.'; return }
            $('#lgk').value = $('#lgp').value = ''; d.close(); AUTH = null; ok()
        };
        if (!d.open) d.showModal(); (setup ? $('#lgk') : $('#lgl')).focus()
    }))
}
async function api(body, url = '/api/data') {
    for (; ;) {
        const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: HD, body: body ? JSON.stringify(body) : undefined });
        if (r.status == 401) { const j = await r.json().catch(() => ({})); await auth(j.setup); continue }
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status); return r.json()
    }
}
const adm = () => ME && ME.perfil == 'admin';
function sair() { run(async () => { await fetch('/api/data', { method: 'POST', headers: HD, body: JSON.stringify({ op: 'logout' }) }); location.reload() }) }
const run = async f => { try { await f() } catch (e) { alert('Erro: ' + e.message) } };
// Salvar com proteção contra clique duplo: enquanto um salvamento está em andamento, os demais cliques são ignorados
let SALVANDO = false;
const umaVez = async f => { if (SALVANDO) return; SALVANDO = true; try { await run(f) } finally { SALVANDO = false } };
const livre = () => !$('#dg').open && !$('#dd').open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
async function load() {
    let sg; try {
        const j = await api(); ME = j.me || null; sg = JSON.stringify(j); if (ready && sg === LAST) return; D = j.processos || []; if (j.listas) L = Object.assign(L, j.listas); L.assuntos_at = L.assuntos_at || [];
        if (!j.listas || !D.length) { SEED = await (await fetch('/seed.json')).json(); if (!j.listas) L = SEED.listas } ready = true
    }
    catch (e) { $('#mn').innerHTML = '<div class="ib">Não foi possível conectar ao banco: ' + esc(e.message) + '</div>'; return }
    if (!$('#dg').open && !$('#dd').open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { LAST = sg; draw(); lembrete() }
}
// Itens de lista usados no pop-up de entrada e na tela Início
const pItem = r => `<div class="pi ${r.crit}" onclick="det(${r.id})"><div class="pd"><div>${r.age ?? '?'}<small>dias</small></div></div><div class="pm"><b>${esc(r.numero)}</b><span>${esc(r.tipo)} · ${esc(r.orgao || '—')}</span><span>${esc(r.descricao || r.assunto)}</span><div class="evb">${stc(r)}${cb(r)}</div></div></div>`;
const aItem = a => { const d = atDias(a); return `<div class="pi ${d > 30 ? 'c' : d > 7 ? 'a' : ''}" onclick="atDet(${a.id})"><div class="pd"><div>${d}<small>dias</small></div></div><div class="pm"><b>${esc(a.solicitante)}${a.orgao ? ' · ' + esc(a.orgao) : ''}</b><span>${esc(a.canal)} · ${esc(a.assunto || a.categoria)}</span><span>${esc(a.descricao)}</span><div class="evb">${atSit(a)}</div></div></div>` };
const meusProc = () => ME && ME.responsavel ? view().filter(r => !done(r) && r.resp == ME.responsavel).sort((a, b) => (b.age ?? -1) - (a.age ?? -1)) : [];
// Pop-up exibido uma vez a cada login: processos e atendimentos do usuário aguardando providência e a agenda de hoje e amanhã
let AVISO = null;
async function lembrete() {
    if (!ME || AVISO == ME.sessao || $('#dd').open) return; AVISO = ME.sessao; const k = 'dbm_aviso_' + ME.id;
    try { if (localStorage.getItem(k) == ME.sessao) return; localStorage.setItem(k, ME.sessao) } catch (e) { }
    const v = meusProc();
    let at = []; try { at = (await api({ op: 'meus' }, '/api/atendimentos')).atendimentos } catch (e) { }
    try { await evLoad(1) } catch (e) { }
    const h = TS(), hj = evNoDia(EV.filter(e => !e.cancelado), h), ag = [['Hoje', hj], ['Amanhã', evNoDia(EV.filter(e => !e.cancelado && !hj.includes(e)), addDias(h, 1))]].filter(x => x[1].length);
    if ((!v.length && !at.length && !ag.length) || $('#dd').open) return;
    const pt = [v.length ? `<b>${v.length}</b> processo(s)` : '', at.length ? `<b>${at.length}</b> atendimento(s)` : ''].filter(Boolean);
    $('#dd').innerHTML = `<h2><span>Resumo do dia</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><div style="padding:14px 20px 4px"><p class="nt" style="margin:0 0 10px">Olá, ${esc(ME.nome.split(' ')[0])}. ${pt.length ? `Há ${pt.join(' e ')} sob sua responsabilidade aguardando providência, do mais antigo para o mais novo.` : ''}${ag.length ? ' Confira também a agenda de hoje e amanhã.' : ''}</p>`
        + (ag.length ? `<h3 class="kt">${ic('cal', 16)} Agenda de hoje e amanhã</h3><div class="pl" style="max-height:34vh;margin-bottom:12px">${ag.map(([n, l]) => `<div class="pdia">${n}</div>` + l.map(evLinha).join('')).join('')}</div>` : '')
        + (v.length ? `<h3 class="kt">${ic('files', 16)} Processos</h3><div class="pl" style="max-height:40vh;margin-bottom:12px">${v.map(pItem).join('')}</div>` : '')
        + (at.length ? `<h3 class="kt">${ic('chat', 16)} Atendimentos</h3><div class="pl" style="max-height:40vh">${at.map(aItem).join('')}</div>` : '')
        + `</div><div class="ac" style="padding-top:12px"><button class="btn p" onclick="$('#dd').close()">Entendi</button><span class="sp"></span>${ag.length ? `<button class="btn" onclick="$('#dd').close();go('cal')">Ver calendário</button>` : ''}${v.length ? `<button class="btn" onclick="$('#dd').close();go('vida')">Ver fila de processos</button>` : ''}${at.length ? `<button class="btn" onclick="$('#dd').close();atMeus()">Ver meus atendimentos</button>` : ''}</div>`; $('#dd').showModal()
}
const day = s => s ? Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5 : null;
const TS = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0') };
const fmt = s => s ? s.split('-').reverse().join('/') : '—', done = r => r.status.startsWith('CONCLU');
const age = r => { if (!r.tram) return null; const e = done(r) && r.concl ? day(r.concl) : day(TS()); return Math.round(e - day(r.tram)) };
const cfg = () => L.cfg || { atencao: 180, critico: 365 }, CL = { c: 'Crítico', a: 'Atenção', o: 'Dentro do prazo', d: 'Concluído' }, CC = { c: 'r', a: 'y', o: 'g', d: 'g' };
const crit = a => a == null ? 'o' : a > cfg().critico ? 'c' : a > cfg().atencao ? 'a' : 'o';
const view = () => D.map(r => { const a = age(r), d = done(r); return { ...r, age: a, crit: d ? 'd' : crit(a), assunto: r.detalhe || r.descricao || r.tipo, setor: r.setor || (d ? 'Concluído' : 'DBM'), destino: r.destino || r.recebedor || '', mov: r.mov || r.concl || r.tram || '' } });
const apr = r => !done(r) && /AGUARD|DESPACH|ASSIN/.test(r.status), pend = r => !done(r) && /RECEBIDO|PEND|AN[AÁ]LISE/.test(r.status);
const cb = r => `<span class="bd ${CC[r.crit]}">${CL[r.crit]}</span>`, stc = r => `<span class="bd ${done(r) ? 'g' : apr(r) ? '' : pend(r) ? 'y' : ''}">${esc(r.status)}</span>`;
const brl = v => v === '' || v == null ? '—' : (+v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const bem = r => r.bem || (r.itens ? r.itens + ' ite' + (r.itens > 1 ? 'ns' : 'm') : '—');
const venc = r => { if (done(r) || r.age == null) return ''; const d = cfg().critico - r.age; return d < 0 ? `<span class="bd r">${ic('warn', 12)} Vencido há ${-d}d</span>` : d <= 30 ? `<span class="bd y">${ic('clock', 12)} Vence em ${d}d</span>` : '' };
const hay = x => nz([x.numero, x.descricao, x.obs, x.orgao, x.assunto, x.recebedor, x.setor, x.destino, x.status, x.resp, x.tipo, x.doc, x.bem].join(' '));
let tab = 'home', sub = 'rel';
// Itens com um único elemento são títulos de grupo do menu; o 4º elemento (1) indica tela só do administrador
const NAV = [['home', 'home', 'Início'], ['Gestão de Processos'], ['dash', 'dash', 'Dashboard'], ['caixa', 'inbox', 'Caixa do Setor'], ['alien', 'archive', 'Alienações'], ['transf', 'swap', 'Transferências'], ['todos', 'files', 'Todos os Processos'], ['vida', 'history', 'Vida do Processo'], ['rel', 'chart', 'Listas e Relatórios'], ['Gestão de Atendimentos'], ['aten', 'chat', 'Atendimentos'], ['Calendário'], ['cal', 'cal', 'Calendário da equipe'], ['Relatórios'], ['relg', 'pie', 'Relatórios gerenciais'], ['Administração', , , 1], ['usu', 'user', 'Usuários e Log', 1]];
const head = (t, s, x = '') => `<div class="ph"><div><h2>${t}</h2><p>${s}</p></div><div>${x}</div></div>`;
const kc = (i, c, l, v, d, o) => `<div class="k ${c}"${o ? ` onclick="${o}" title="Abrir a tela"` : ''}><div class="ki">${ic(i, 22)}</div><div><span>${l}</span><b>${v}</b>${d ? `<em class="${d.c}" title="Últimos 30 dias vs. 30 dias anteriores">${d.t}</em>` : ''}</div></div>`;
function dv(rs, f) {
    const t = day(TS()), n = (a, b) => rs.filter(r => { const x = f(r); if (!x) return 0; const d = day(x); return d > t - a && d <= t - b }).length, c = n(30, 0), p = n(60, 30);
    if (!p) return { c: '', t: c ? `+${c} nos últimos 30 dias` : 'sem variação em 30 dias' }; const v = Math.round((c - p) / p * 100); return { c: v >= 0 ? 'up' : 'dn', t: ic(v >= 0 ? 'tu' : 'td', 14) + ' ' + (v >= 0 ? '+' : '') + v + '% em 30 dias' }
}
const bars = l => { const m = Math.max(1, ...l.map(x => x[1])); return l.map(x => `<div class="br" title="${esc(x[0])}: ${x[1]}"><span>${esc(x[0])}</span><div><i style="width:${x[1] / m * 100}%;background:${x[2]}"></i></div><em>${x[1]}</em></div>`).join('') };
function dn(a) { const t = a.reduce((s, x) => s + x[1], 0), T = t || 1; let o = 0; return `<div class="dn"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--bd)" stroke-width="6"/>${a.map(x => { const p = x[1] / T * 100, s = `<circle class="sg" cx="21" cy="21" r="15.9155" fill="none" stroke="${x[2]}" stroke-width="6" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${25 - o}"><title>${x[0]}: ${x[1]}</title></circle>`; o += p; return s }).join('')}<text x="21" y="23" text-anchor="middle" class="dt">${t}</text></svg><div>${a.map(x => `<div><i style="background:${x[2]}"></i>${x[0]}: <b>${x[1]}</b></div>`).join('')}</div></div>` }
function mon(v) {
    const t = new Date(), M = []; for (let i = 11; i >= 0; i--) { const d = new Date(t.getFullYear(), t.getMonth() - i, 1); M.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')) }
    const e = M.map(m => v.filter(r => (r.tram || '').startsWith(m)).length), c = M.map(m => v.filter(r => (r.concl || '').startsWith(m)).length), mx = Math.max(1, ...e, ...c);
    return `<svg viewBox="0 0 600 190" class="ch">${M.map((m, i) => { const x = 10 + i * 48, a = e[i] / mx * 140, b = c[i] / mx * 140, l = m.slice(5) + '/' + m.slice(0, 4); return `<g class="bg"><rect class="b1" x="${x}" y="${160 - a}" width="18" height="${a}" rx="3"><title>${l} · ${e[i]} entradas</title></rect><rect class="b2" x="${x + 20}" y="${160 - b}" width="18" height="${b}" rx="3"><title>${l} · ${c[i]} concluídos</title></rect><text x="${x + 19}" y="177" text-anchor="middle">${MS[+m.slice(5) - 1]}</text></g>` }).join('')}</svg><div class="lgd"><span><i style="background:var(--pr)"></i>Entradas</span><span><i style="background:var(--ok)"></i>Concluídos</span></div>`
}
// Colunas de texto livre ficam alinhadas à esquerda; as demais, centralizadas
const TL = ['Descrição', 'Assunto', 'Motivo', 'Pauta', 'Observação'], tal = h => TL.includes(h) ? ' class="tl"' : '';
// Excel: datas dd/mm/aaaa viram data de verdade (permite filtrar e ordenar por data) e números em texto viram número
function xlsTipos(ws) {
    const R = XLSX.utils.decode_range(ws['!ref'] || 'A1'), b = Date.UTC(1899, 11, 30);
    for (let r = R.s.r; r <= R.e.r; r++) for (let c = R.s.c; c <= R.e.c; c++) {
        const k = XLSX.utils.encode_cell({ r, c }), x = ws[k]; if (!x || x.t != 's') continue; const v = x.v.trim(), m = v.match(/^(\d\d)\/(\d\d)\/(\d{4})$/);
        if (v == '—') { delete ws[k]; continue } // traço da tela vira célula vazia, para o filtro do Excel mostrar "(Vazias)"
        if (m && +m[2] >= 1 && +m[2] <= 12) ws[k] = { t: 'n', v: (Date.UTC(+m[3], +m[2] - 1, +m[1]) - b) / 864e5, z: 'dd/mm/yyyy' };
        else if (/^\d{1,9}$/.test(v) && !/^0\d/.test(v)) ws[k] = { t: 'n', v: +v }
    }
    return ws
}
// Planilha de relatório: título, resumo quantitativo (total e contagem pelas colunas de classificação) e a tabela com filtro no cabeçalho
// Coluna em que cada linha tem um valor diferente (por exemplo, o relatório por responsável) não entra no resumo
const XRES = ['Tipo', 'Status', 'Situação', 'Prioridade', 'Categoria', 'Canal', 'Responsável', 'Atendente', 'Classificação'];
function xlsRel(title, h, r, sub = '') {
    const cols = XRES.map(n => h.indexOf(n)).filter(i => i >= 0).slice(0, 5), conta = i => { const o = {}; r.forEach(x => { const v = String(x[i] ?? '').trim() || '(não informado)'; o[v] = (o[v] || 0) + 1 }); const l = Object.entries(o).sort((a, b) => b[1] - a[1]); return l.length > 12 ? [...l.slice(0, 11), ['Outros', l.slice(11).reduce((s, x) => s + x[1], 0)]] : l };
    const bl = cols.map(i => [h[i], conta(i)]).filter(([, l]) => r.length < 2 || l.length < r.length), alt = Math.max(0, ...bl.map(x => x[1].length)), res = [];
    if (bl.length) { res.push(bl.flatMap(([n]) => [n, 'Qtde.', ''])); for (let j = 0; j < alt; j++) res.push(bl.flatMap(([, l]) => l[j] ? [l[j][0], l[j][1], ''] : ['', '', ''])); res.push([]) }
    const topo = [[title], ['Coordenadoria de Patrimônio · DBM · emitido em ' + fmt(TS()) + (sub ? ' · ' + sub : '')], [], ['RESUMO'], ['Total de registros', r.length], [], ...res], ini = topo.length;
    const ws = xlsTipos(XLSX.utils.aoa_to_sheet([...topo, h, ...r]));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: ini, c: 0 }, e: { r: ini + r.length, c: Math.max(0, h.length - 1) } }) };
    ws['!cols'] = h.map((x, i) => ({ wch: Math.min(60, Math.max(10, String(x).length + 2, ...r.slice(0, 300).map(y => String(y[i] ?? '').split('\n')[0].length + 2), ...res.map(y => String(y[i] ?? '').length + 2))) }));
    return ws
}
const xlsNome = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '_');
function xp(title, h, r, kind, sub) {
    if (kind == 'x') { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, xlsRel(title, h, r, sub), 'RELATORIO'); XLSX.writeFile(wb, xlsNome(title) + '_' + TS() + '.xlsx'); return }
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f); const w = f.contentWindow; w.document.open();
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:11px Arial;margin:16px}h1{font-size:16px;margin:0}p{color:#555;margin:2px 0 10px}table{border-collapse:collapse;width:100%}th{background:#0f2a4a;color:#fff;text-align:left}th,td{border:1px solid #ccc;padding:4px 6px}tr:nth-child(even){background:#f3f5f9}@page{size:landscape;margin:10mm}</style></head><body><h1>${esc(title)}</h1><p>Coordenadoria de Patrimônio · DBM — emitido em ${fmt(TS())} · ${r.length} registro(s)</p><table><thead><tr>${h.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${r.map(x => `<tr>${x.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`); w.document.close(); setTimeout(() => { w.focus(); w.print(); setTimeout(() => f.remove(), 3000) }, 300)
}
function draw() {
    $('#nv').innerHTML = NAV.filter(x => !x[3] || adm()).map(([k, i, n]) => i ? `<button class="${tab == k ? 'on' : ''}" onclick="go('${k}')">${ic(i, 19)} ${n}</button>` : `<div class="ng">${k}</div>`).join('');
    $('#mn').innerHTML = !ready ? '<p class="nt">Carregando…</p>' : (D.length || !adm() ? '' : `<div class="ib">O banco está vazio. <button class="btn p s" onclick="seed()">Carregar os ${SEED ? SEED.processos.length : ''} processos da planilha</button></div>`) + (tab == 'dash' ? dash() : tab == 'rel' ? relscr() : tab == 'usu' ? usuScr() : tab == 'aten' ? atScr() : tab == 'relg' ? rgScr() : tab == 'cal' ? caScr() : tab == 'home' ? inScr() : screen(tab)); sf();
    if (ready) { if (tab == 'rel') rl(); else if (tab == 'aten') atList(); else if (tab != 'dash' && tab != 'usu' && tab != 'relg' && tab != 'cal' && tab != 'home') list(tab) }
}
function go(t) { tab = t; $('#sd').classList.remove('o'); draw(); scrollTo(0, 0); if (t == 'usu') usuLoad(); if (t == 'aten' || t == 'relg' || t == 'home') atLoad(); if (t == 'cal' || t == 'relg' || t == 'home') evLoad() }
function th() { const d = document.documentElement, n = d.dataset.t == 'dark' ? 'light' : 'dark'; d.dataset.t = n; localStorage.setItem('dbm_t', n); $('#bt').innerHTML = ic(n == 'dark' ? 'sun' : 'moon', 17) }
const sf = () => $('.sf').innerHTML = (ME ? `<div class="me"><b>${esc(ME.nome)}</b>${ME.perfil == 'admin' ? 'Administrador' : 'Servidor'}</div>` : '') + `<button onclick="xl()">${ic('xls', 17)} Planilha completa</button><button onclick="bk()">${ic('db', 17)} Backup (JSON)</button>${adm() ? `<button onclick="openImp()">${ic('up', 17)} Importar dados</button>` : ''}${ME ? `<button onclick="senha()">${ic('pen', 17)} Alterar minha senha</button><button onclick="sair()">${ic('x', 17)} Sair</button>` : ''}`; sf();
$('.lg i').innerHTML = ic('bank', 22); $('#mb').innerHTML = ic('menu', 22); $('#bn').innerHTML = ic('plus', 16) + ' <span class="tp-t">Novo processo</span>'; $('#ba').innerHTML = ic('chat', 16) + ' <span class="tp-t">Novo atendimento</span>';
$('#bt').innerHTML = ic(document.documentElement.dataset.t == 'dark' ? 'sun' : 'moon', 17);
document.addEventListener('click', e => { if (!e.target.closest('.gs')) $('#gd').hidden = true });
const poll = () => { if (ready && !document.hidden && !$('#dg').open && !$('#dd').open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { load(); if (tab == 'aten' || tab == 'relg' || tab == 'home') atLoad(1); if (tab == 'cal' || tab == 'relg' || tab == 'home') evLoad(1) } }; setInterval(poll, 4000); document.addEventListener('visibilitychange', poll); addEventListener('focus', poll);
