// Início: resumo do Hub com atalhos para os módulos, agenda da semana e os itens do usuário aguardando providência
function inScr() {
    const h = TS(),
        hr = new Date().getHours(),
        v = view(),
        ab = v.filter(r => !done(r)),
        n = t => ab.filter(r => r.tipo == t).length;
    const mp = meusProc(),
        atA = atView().filter(a => a.situacao != AT_FIM),
        ma = atA.filter(a => ME && a.atendente_id == ME.id).sort((x, y) => y.dias - x.dias);
    // Evento de vários dias (férias, por exemplo) aparece uma vez só, no primeiro dia dentro da semana
    const ev = EV.filter(e => !e.cancelado),
        hj = evNoDia(ev, h).length,
        sem = [],
        ja = new Set();
    for (let i = 0; i < 7; i++) {
        const d = addDias(h, i),
            l = evNoDia(ev, d).filter(e => !ja.has(e.id));
        l.forEach(e => ja.add(e.id));
        if (l.length) sem.push([d, l]);
    }
    const nd = sem.reduce((s, x) => s + x[1].length, 0),
        rep = adm() ? inRepetidos() : [];
    const md = [
        ['dash', 'dash', 'Dashboard de processos', `${ab.length} em andamento`],
        ['transf', 'swap', 'Transferências', `${n('Transferência')} em andamento`],
        ['alien', 'archive', 'Alienações', `${n('Alienação')} em andamento`],
        ['veic', 'car', 'Veículos', `${VE.filter(v => !v.saida).length} no depósito`],
        ['aten', 'chat', 'Atendimentos', `${atA.length} em aberto`],
        ['cal', 'cal', 'Calendário da equipe', hj ? `${hj} evento(s) hoje` : 'nenhum evento hoje'],
        ['relg', 'pie', 'Gerenciais', 'indicadores por período'],
        ...(adm() ? [['usu', 'user', 'Usuários', 'acessos ao sistema']] : []),
    ];
    const dia = d => (d == h ? 'Hoje' : d == addDias(h, 1) ? 'Amanhã' : EV_DS[evDow(d)] + ', ' + fmt(d).slice(0, 5));
    const card = (i, t, sub, corpo, rod) =>
        `<div class="cd">
            <h3 class="kt" style="margin-top:0">${ic(i, 17)} ${t}<span class="sp"></span><small class="nt">${sub}</small></h3>${corpo}${rod ? `<div style="margin-top:10px">${rod}</div>` : ''}</div>`;
    return (
        head(
            `${hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite'}${ME ? ', ' + esc(ME.nome.split(' ')[0]) : ''}`,
            `Hoje é ${EV_DS[evDow(h)]}, ${fmt(h)}. Resumo do Hub Patrimonial.`
        ) +
        (rep.length
            ? `<div class="ib" style="border-left-color:var(--wn);background:var(--wn2)">${ic('warn', 15)} Há <b>${rep.length}</b> número(s) de processo cadastrado(s) mais de uma vez, de antes do bloqueio de duplicados. <a href="#" onclick="event.preventDefault();inRepLista()">Ver a lista</a></div>`
            : '') +
        `<div class="hm">${md.map(([k, i, t, s]) => `<button onclick="go('${k}')"><span class="ki">${ic(i, 22)}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div>` +
        `<div class="hg">` +
        card(
            'cal',
            'Agenda da semana',
            `${nd} evento(s) nos próximos 7 dias`,
            sem.length
                ? `<div class="pl" style="max-height:none">${sem.map(([d, l]) => `<div class="pdia">${dia(d)}</div>` + l.map(evLinha).join('')).join('')}</div>`
                : '<p class="nt">Nenhum evento nos próximos 7 dias.</p>',
            `<button class="btn" onclick="go('cal')">Abrir calendário</button>`
        ) +
        card(
            'files',
            'Meus processos em andamento',
            mp.length ? `${Math.min(5, mp.length)} de ${mp.length}, do mais antigo` : '',
            !ME || !ME.responsavel
                ? '<p class="nt">Seu usuário ainda não está vinculado a um responsável da lista de processos. Peça ao administrador para fazer o vínculo em Administração > Usuários.</p>'
                : mp.length
                  ? `<div class="pl" style="max-height:none">${mp.slice(0, 5).map(pItem).join('')}</div>`
                  : '<p class="nt">Nenhum processo seu aguardando providência.</p>',
            mp.length > 5 ? `<button class="btn" onclick="go('vida')">Ver todos</button>` : ''
        ) +
        card(
            'chat',
            'Meus atendimentos em aberto',
            ma.length ? `${Math.min(5, ma.length)} de ${ma.length}, do mais antigo` : '',
            ma.length
                ? `<div class="pl" style="max-height:none">${ma.slice(0, 5).map(aItem).join('')}</div>`
                : '<p class="nt">Nenhum atendimento seu em aberto.</p>',
            `<button class="btn" onclick="${ma.length ? 'atMeus()' : 'atEd(0)'}">${ma.length > 5 ? 'Ver todos' : ma.length ? 'Abrir atendimentos' : 'Registrar atendimento'}</button>`
        ) +
        `</div>`
    );
}
// Números de processo repetidos que já estavam no banco (só o administrador vê o aviso)
function inRepetidos() {
    const g = {};
    D.forEach(r => {
        const k = chNum(r.numero);
        if (k) (g[k] = g[k] || []).push(r);
    });
    return Object.values(g).filter(l => l.length > 1);
}
// Janela com a lista dos números de processo repetidos
function inRepLista() {
    const l = inRepetidos();
    $('#dd').innerHTML =
        `<h2><span>Números de processo repetidos</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <p class="nt" style="margin:14px 20px 0">Confira cada grupo e exclua ou corrija o cadastro que estiver sobrando. Novos cadastros com número repetido já são bloqueados.</p>
            <div class="pl" style="margin:10px 20px 18px;max-height:65vh">${l.map(g => `<div class="pdia">Nº ${esc(g[0].numero)}</div>` + g.map(r => pItem(view().find(x => x.id == r.id))).join('')).join('')}</div>`;
    if (!$('#dd').open) $('#dd').showModal();
}
