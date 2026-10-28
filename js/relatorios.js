// Gerenciais: quadros por período, para apresentar a gestores e secretários.
// Tudo é calculado no navegador a partir dos processos e atendimentos já carregados; não há tabela própria.
const RG = {
    modo: 'mes',
    mes: TS().slice(0, 7),
    ano: +TS().slice(0, 4),
    tri: Math.floor((+TS().slice(5, 7) - 1) / 3) + 1,
    de: '',
    ate: '',
};
const RG_MODOS = [
    ['mes', 'Mês'],
    ['tri', 'Trimestre'],
    ['ano', 'Ano'],
    ['int', 'Intervalo'],
];

// Personalização do PDF e do Excel: o que for desmarcado fica fora do relatório (a tela continua mostrando tudo).
// Chaves: 'q:<quadro>' para os quadros e 'i:<indicador>' para as linhas do Resumo do período.
// A escolha fica guardada neste navegador, separada por usuário; RG_FORA mantém a escolha mesmo se o navegador bloquear o armazenamento.
let RG_FORA = null;
const rgChave = () => 'dbm_rg_fora_' + (ME ? ME.id : '');
function rgFora() {
    if (RG_FORA && RG_FORA.k == rgChave()) return new Set(RG_FORA.l);
    try {
        const l = JSON.parse(localStorage.getItem(rgChave()) || '[]');
        return new Set(Array.isArray(l) ? l : []);
    } catch (e) {
        return new Set();
    }
}
// Quadros que entram no PDF e no Excel. O Resumo perde os indicadores desmarcados e some se não sobrar nenhum.
function rgSel(Q) {
    const f = rgFora();
    return Q.filter(q => !f.has('q:' + q.k))
        .map(q => (q.k == 'resumo' ? { ...q, r: q.r.filter(x => !f.has('i:' + x[0])) } : q))
        .filter(q => q.k != 'resumo' || q.r.length);
}
// Janela Personalizar relatório: uma caixa de marcação por indicador do resumo e por quadro
function rgPers() {
    const { Q, res } = rgQuadros(),
        f = rgFora(),
        ck = (k, l) =>
            `<label><input type="checkbox" value="${esc(k)}" ${f.has(k) ? '' : 'checked'}> ${esc(l)}</label>`;
    $('#dd').innerHTML =
        `<h2><span>Personalizar relatório</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
<form class="fm" id="rgpf" onsubmit="event.preventDefault();rgPersSv()">
<div class="w"><span class="lb">Indicadores do Resumo do período</span><div class="evp" style="max-height:none">${res.map(x => ck('i:' + x[0], x[0])).join('')}</div></div>
<div class="w"><span class="lb">Quadros</span><div class="evp" style="max-height:none">${Q.filter(q => q.k != 'resumo')
            .map(q => ck('q:' + q.k, q.t))
            .join('')}</div></div>
<p class="nt w" style="margin:0">Vale para o PDF e o Excel. A tela continua mostrando tudo, com os itens fora do relatório marcados. A escolha fica guardada neste navegador.</p>
<div class="w" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p">${ic('ok', 15)} Salvar</button><button type="button" class="btn" onclick="rgPersTodos(true)">Marcar todos</button><button type="button" class="btn" onclick="rgPersTodos(false)">Desmarcar todos</button></div></form>`;
    if (!$('#dd').open) $('#dd').showModal();
}
// Marcar todos ou Desmarcar todos na janela Personalizar relatório
const rgPersTodos = v => document.querySelectorAll('#rgpf input[type=checkbox]').forEach(c => (c.checked = v));
// Grava a escolha. Itens que não aparecem no período atual (ex.: Entradas e conclusões por mês, que só existe em períodos
// de mais de um mês) mantêm a escolha anterior.
function rgPersSv() {
    const f = rgFora();
    document
        .querySelectorAll('#rgpf input[type=checkbox]')
        .forEach(c => (c.checked ? f.delete(c.value) : f.add(c.value)));
    RG_FORA = { k: rgChave(), l: [...f] };
    try {
        localStorage.setItem(rgChave(), JSON.stringify(RG_FORA.l));
    } catch (e) {}
    $('#dd').close();
    draw();
}
// Quadros escolhidos para exportar; avisa quando tudo foi desmarcado
function rgExp() {
    const { P, Q } = rgQuadros(),
        S = rgSel(Q);
    if (!S.length) {
        alert('Nenhum item marcado. Use Personalizar relatório para escolher o que entra no PDF e no Excel.');
        return null;
    }
    return { P, Q: S };
}

const ymd = d =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const ultimoDia = (a, m) => ymd(new Date(a, m, 0)); // m = 1..12
const dDias = (x, y) => Math.round(day(y) - day(x));
const addDias = (s, n) => ymd(new Date(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + n) + 432e5));

// Período escolhido [a, b] e o período anterior de mesma duração, para comparação
function rgPer() {
    let a, b, nome;
    if (RG.modo == 'mes') {
        const [y, m] = RG.mes.split('-').map(Number);
        a = RG.mes + '-01';
        b = ultimoDia(y, m);
        nome = MS[m - 1] + '/' + y;
    } else if (RG.modo == 'tri') {
        const m = (RG.tri - 1) * 3 + 1;
        a = `${RG.ano}-${String(m).padStart(2, '0')}-01`;
        b = ultimoDia(RG.ano, m + 2);
        nome = RG.tri + 'º trimestre de ' + RG.ano;
    } else if (RG.modo == 'ano') {
        a = RG.ano + '-01-01';
        b = RG.ano + '-12-31';
        nome = 'ano de ' + RG.ano;
    } else {
        a = RG.de || TS().slice(0, 8) + '01';
        b = RG.ate || TS();
        if (b < a) [a, b] = [b, a];
        nome = fmt(a) + ' a ' + fmt(b);
    }
    // Período em curso vai só até hoje e é comparado com o mesmo número de dias do período anterior (ex.: 1 a 21/out contra 1 a 21/set).
    // Período já encerrado é comparado com o mês, trimestre ou ano anterior inteiro.
    const corte = b > TS();
    if (corte) b = TS();
    if (a > b) a = b;
    const [y, m] = a.split('-').map(Number);
    const pa =
        RG.modo == 'mes'
            ? ymd(new Date(y, m - 2, 1))
            : RG.modo == 'tri'
              ? ymd(new Date(y, m - 4, 1))
              : RG.modo == 'ano'
                ? y - 1 + '-01-01'
                : addDias(a, -(dDias(a, b) + 1));
    const pb = corte || RG.modo == 'int' ? [addDias(pa, dDias(a, b)), addDias(a, -1)].sort()[0] : addDias(a, -1);
    return { a, b, nome: RG.modo == 'int' ? nome : nome + ' (' + fmt(a) + ' a ' + fmt(b) + ')', pa, pb };
}
const em = (d, a, b) => !!d && d >= a && d <= b;
// Situação de cada item no último dia de um período
const pAberto = (r, b) => !!r.tram && r.tram <= b && !(done(r) && r.concl && r.concl <= b);
const pConcl = (r, a, b) => done(r) && em(r.concl, a, b);
const aAberto = (x, b) => x.data <= b && !(x.situacao == AT_FIM && x.data_finalizacao && x.data_finalizacao <= b);
const aFim = (x, a, b) => x.situacao == AT_FIM && em(x.data_finalizacao, a, b);
const media = l => (l.length ? Math.round(l.reduce((s, x) => s + x, 0) / l.length) : '—');
const pct = (x, t) => (t ? Math.round((x / t) * 100) + '%' : '—');
const grupo = (l, f) => {
    const g = {};
    l.forEach(x => {
        const k = f(x) || '(não informado)';
        (g[k] = g[k] || []).push(x);
    });
    return g;
};

// Cada quadro: t = título, h = colunas, r = linhas, bar = coluna que ganha barra, lim = linhas exibidas na tela e no PDF (o Excel leva todas)
function rgQuadros() {
    const P = rgPer(),
        { a, b, pa, pb } = P,
        v = D.filter(r => r.tipo),
        A = AT;
    const rec = v.filter(r => em(r.tram, a, b)),
        con = v.filter(r => pConcl(r, a, b)),
        abt = v.filter(r => pAberto(r, b));
    const atR = A.filter(x => em(x.data, a, b)),
        atF = A.filter(x => aFim(x, a, b)),
        atA = A.filter(x => aAberto(x, b));
    const ant = {
        rec: v.filter(r => em(r.tram, pa, pb)).length,
        con: v.filter(r => pConcl(r, pa, pb)).length,
        abt: v.filter(r => pAberto(r, pb)).length,
        atR: A.filter(x => em(x.data, pa, pb)).length,
        atF: A.filter(x => aFim(x, pa, pb)).length,
        atA: A.filter(x => aAberto(x, pb)).length,
    };
    const vr = (x, y) => (y ? (x >= y ? '+' : '') + Math.round(((x - y) / y) * 100) + '%' : x ? 'novo' : '0%');
    const res = [
        ['Processos recebidos', rec.length, ant.rec],
        ['Processos concluídos', con.length, ant.con],
        ['Processos em aguardo no fim do período', abt.length, ant.abt],
        ['Atendimentos registrados', atR.length, ant.atR],
        ['Atendimentos finalizados', atF.length, ant.atF],
        ['Atendimentos em aberto no fim do período', atA.length, ant.atA],
    ].map(x => [...x, vr(x[1], x[2])]);
    const idade = r => dDias(r.tram, b),
        C = cfg();
    const Q = [];
    Q.push({
        k: 'resumo',
        t: 'Resumo do período',
        h: ['Indicador', 'Período', 'Período anterior', 'Variação'],
        r: res,
        nota: 'Período anterior: ' + fmt(pa) + ' a ' + fmt(pb) + '.',
    });
    Q.push({
        k: 'tipo',
        t: 'Processos por tipo',
        h: [
            'Tipo',
            'Recebidos',
            'Concluídos',
            'Em aguardo no fim',
            'Tempo médio até concluir (dias)',
            'Bens nos processos concluídos',
        ],
        r: [
            ...TIPOS.map(t => {
                const c = con.filter(r => r.tipo == t);
                return [
                    t,
                    rec.filter(r => r.tipo == t).length,
                    c.length,
                    abt.filter(r => r.tipo == t).length,
                    media(c.filter(r => r.tram).map(r => dDias(r.tram, r.concl))),
                    t == 'Caixa do setor' ? '—' : c.reduce((s, r) => s + (+r.itens || 0), 0),
                ];
            }),
            [
                'Total',
                rec.length,
                con.length,
                abt.length,
                media(con.filter(r => r.tram).map(r => dDias(r.tram, r.concl))),
                con.filter(r => r.tipo != 'Caixa do setor').reduce((s, r) => s + (+r.itens || 0), 0),
            ],
        ],
        total: 1,
        nota: 'Bens: soma da quantidade de itens das transferências e alienações concluídas no período.',
    });
    const ms = [];
    for (let d = a.slice(0, 7); d <= b.slice(0, 7); d = ymd(new Date(+d.slice(0, 4), +d.slice(5, 7), 1)).slice(0, 7))
        ms.push(d);
    if (ms.length > 1)
        Q.push({
            k: 'mes',
            t: 'Entradas e conclusões por mês',
            h: ['Mês', 'Recebidos', 'Concluídos'],
            r: ms.map(m => [
                MS[+m.slice(5) - 1] + '/' + m.slice(0, 4),
                rec.filter(r => r.tram.startsWith(m)).length,
                con.filter(r => r.concl.startsWith(m)).length,
            ]),
            bar: 1,
        });
    const gr = grupo(abt, r => r.resp);
    Q.push({
        k: 'prazo',
        t: 'Processos em aguardo por responsável',
        h: [
            'Responsável',
            'Em aguardo',
            `Acima de ${C.atencao} dias`,
            `Acima de ${C.critico} dias`,
            'Mais antigo (dias)',
        ],
        r: Object.entries(gr)
            .map(([k, l]) => [
                k,
                l.length,
                l.filter(r => idade(r) > C.atencao).length,
                l.filter(r => idade(r) > C.critico).length,
                Math.max(...l.map(idade)),
            ])
            .sort((x, y) => y[1] - x[1]),
        bar: 1,
        nota: 'Situação no último dia do período. Prazos conforme os parâmetros de criticidade do sistema.',
    });
    const atr = abt.filter(r => idade(r) > C.critico).sort((x, y) => idade(y) - idade(x));
    Q.push({
        k: 'atraso',
        t: `Processos acima de ${C.critico} dias no setor`,
        h: ['Nº do processo', 'Tipo', 'Interessado', 'Responsável', 'Status', 'Dias'],
        r: atr.map(r => [r.numero, r.tipo, r.orgao, r.resp || '—', r.status, idade(r)]),
        lim: 25,
        vazio: 'Nenhum processo acima do prazo crítico.',
    });
    const go_ = grupo(rec, r => r.orgao);
    Q.push({
        k: 'orgaos',
        t: 'Interessados com mais processos recebidos',
        h: ['Interessado', 'Recebidos', 'Concluídos no período', 'Em aguardo no fim'],
        r: Object.entries(go_)
            .map(([k, l]) => [k, l.length, l.filter(r => pConcl(r, a, b)).length, l.filter(r => pAberto(r, b)).length])
            .sort((x, y) => y[1] - x[1]),
        bar: 1,
        lim: 10,
    });
    const ag = (f, nome) =>
        Object.entries(grupo(atR, f))
            .map(([k, l]) => {
                const fz = l.filter(x => aFim(x, a, b));
                return [k, l.length, fz.length, pct(fz.length, l.length)];
            })
            .sort((x, y) => y[1] - x[1]);
    Q.push({
        k: 'canal',
        t: 'Atendimentos por canal',
        h: ['Canal', 'Registrados', 'Finalizados', '% finalizados'],
        r: ag(x => x.canal),
        bar: 1,
        vazio: 'Nenhum atendimento registrado no período.',
    });
    Q.push({
        k: 'categoria',
        t: 'Atendimentos por categoria',
        h: ['Categoria', 'Registrados', 'Finalizados', '% finalizados'],
        r: ag(x => x.categoria),
        bar: 1,
        vazio: 'Nenhum atendimento registrado no período.',
    });
    const ga = grupo([...new Set([...atR, ...atA, ...atF])], x => x.atendente);
    Q.push({
        k: 'atendente',
        t: 'Atendimentos por atendente',
        h: [
            'Atendente',
            'Registrados',
            'Finalizados no período',
            'Em aberto no fim',
            'Tempo médio até finalizar (dias)',
        ],
        r: Object.entries(ga)
            .map(([k, l]) => {
                const fz = atF.filter(x => (x.atendente || '(não informado)') == k);
                return [
                    k,
                    l.filter(x => em(x.data, a, b)).length,
                    fz.length,
                    l.filter(x => aAberto(x, b)).length,
                    media(fz.map(x => dDias(x.data, x.data_finalizacao))),
                ];
            })
            .sort((x, y) => y[1] - x[1]),
        bar: 1,
        vazio: 'Nenhum atendimento no período.',
    });
    Q.push({
        k: 'orgat',
        t: 'Órgãos com mais atendimentos',
        h: ['Órgão', 'Registrados', 'Orientação', 'Suporte operacional'],
        r: Object.entries(grupo(atR, x => x.orgao))
            .map(([k, l]) => [
                k,
                l.length,
                l.filter(x => x.categoria == 'Orientação').length,
                l.filter(x => x.categoria == 'Suporte operacional').length,
            ])
            .sort((x, y) => y[1] - x[1]),
        bar: 1,
        lim: 10,
        vazio: 'Nenhum atendimento registrado no período.',
    });
    // Agenda da equipe: reuniões, treinamentos e outros eventos encerrados no período (não cancelados) e o registro anexado de cada um
    const evr = EV.filter(e => !evPess(e) && em(e.fim, a, b)),
        lin = t => {
            const l = evr.filter(e => e.tipo == t),
                ok = l.filter(e => !e.cancelado && e.fim <= TS()),
                c = ok.filter(e =>
                    t == 'Outro evento'
                        ? Object.keys(e.anexos || {}).length
                        : (e.anexos || {})[t == 'Reunião' ? 'ATA' : 'Lista de presença']
                ).length;
            return [
                t,
                ok.length,
                l.filter(e => e.cancelado).length,
                c,
                ok.length - c,
                ok.reduce((s, e) => s + e.participantes.length, 0),
                t == 'Treinamento'
                    ? String(Math.round(ok.reduce((s, e) => s + (e.carga_horaria || 0), 0) * 10) / 10).replace('.', ',')
                    : '—',
            ];
        };
    Q.push({
        k: 'agenda',
        t: 'Agenda da equipe',
        h: [
            'Tipo',
            'Realizados',
            'Cancelados',
            'Com ATA ou lista',
            'Sem registro',
            'Participações',
            'Horas de treinamento',
        ],
        r: [lin('Reunião'), lin('Treinamento'), lin('Outro evento')],
        nota: 'Reuniões contam a ATA anexada; treinamentos, a lista de presença; outros eventos, qualquer arquivo anexado. Participações: soma dos servidores marcados em cada evento.',
    });
    return { P, Q, res, tm: media(atF.map(x => dDias(x.data, x.data_finalizacao))) };
}

// Tabela de um quadro (mesma marcação na tela e no PDF)
function rgTab(q, lim = q.lim) {
    if (!q.r.length) return `<p class="nt">${q.vazio || 'Sem dados no período.'}</p>`;
    const m =
            q.bar != null
                ? Math.max(1, ...q.r.filter((x, i) => !(q.total && i == q.r.length - 1)).map(x => +x[q.bar] || 0))
                : 1,
        rs = lim ? q.r.slice(0, lim) : q.r;
    return `<table class="rgt">
        <thead>
        <tr>${q.h.map((h, i) => `<th${i ? ' class="n"' : ''}>${esc(h)}</th>`).join('')}</tr>
        </thead>
        <tbody>${rs
            .map(
                (x, j) =>
                    `<tr${q.total && j == q.r.length - 1 ? ' class="tot"' : ''}>${x
                        .map((c, i) =>
                            i && i == q.bar
                                ? `<td class="n">
        <div class="rb"><i style="width:${((+c || 0) / m) * 100}%"></i><span>${esc(c)}</span></div>
        </td>`
                                : `<td${i ? ' class="n"' : ''}>${esc(c)}</td>`
                        )
                        .join('')}</tr>`
            )
            .join('')}</tbody>
        </table>${lim && q.r.length > lim ? `<p class="nt">Exibindo ${lim} de ${q.r.length}. O Excel traz a lista completa.</p>` : ''}`;
}

// Tela Gerenciais
function rgScr() {
    const { P, Q, res, tm } = rgQuadros(),
        sel = (v, ops, on) =>
            `<select onchange="${on}">${ops.map(([k, l]) => `<option value="${k}" ${v == k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const anos = [];
    for (let y = +TS().slice(0, 4); y >= 2020; y--) anos.push([y, y]);
    const ctl =
        RG.modo == 'mes'
            ? `<input type="month" value="${RG.mes}" max="${TS().slice(0, 7)}" onchange="if(this.value&&anoOk(this.value)){RG.mes=this.value;draw()}">`
            : RG.modo == 'tri'
              ? sel(
                    RG.tri,
                    [
                        [1, '1º trimestre'],
                        [2, '2º trimestre'],
                        [3, '3º trimestre'],
                        [4, '4º trimestre'],
                    ],
                    'RG.tri=+this.value;draw()'
                ) + sel(RG.ano, anos, 'RG.ano=+this.value;draw()')
              : RG.modo == 'ano'
                ? sel(RG.ano, anos, 'RG.ano=+this.value;draw()')
                : `<label class="nt">De <input type="date" value="${RG.de}" onchange="if(anoOk(this.value)){RG.de=this.value;draw()}"></label><label class="nt">até <input type="date" value="${RG.ate}" onchange="if(anoOk(this.value)){RG.ate=this.value;draw()}"></label>`;
    const fo = rgFora(),
        nf = [...res.map(x => 'i:' + x[0]), ...Q.filter(q => q.k != 'resumo').map(q => 'q:' + q.k)].filter(k =>
            fo.has(k)
        ).length,
        // Classe do cartão de indicador: esmaecido quando o indicador está fora do relatório
        kf = (c, i) => c + (fo.has('i:' + res[i][0]) ? ' fora' : ''),
        tag = '<span class="bd fora-t">Fora do relatório</span>';
    const d = x => {
        const t = x[3];
        return {
            c: t.startsWith('+') && t != '+0%' ? 'up' : t.startsWith('-') ? 'dn' : '',
            t: t + ' vs. período anterior',
        };
    };
    return (
        head(
            'Gerenciais',
            'Indicadores do período para apresentação à gestão',
            `<button class="btn" onclick="rgPers()">${ic('list', 16)} Personalizar relatório</button> <button class="btn" onclick="rgXls()">${ic('xls', 16)} Excel</button> <button class="btn p" onclick="rgPdf()">${ic('pdf', 16)} Gerar PDF</button>`
        ) +
        `<div class="cd" style="margin-bottom:18px">
            <div class="tb" style="margin:0"><span class="sg2" style="margin:0">${RG_MODOS.map(([k, l]) => `<button class="${RG.modo == k ? 'on' : ''}" onclick="RG.modo='${k}';draw()">${l}</button>`).join('')}</span>${ctl}<span class="sp"></span><span class="nt">Período: <b>${esc(P.nome)}</b></span></div>
            ${nf ? `<p class="nt" style="margin:10px 0 0">Relatório personalizado: ${nf} item(ns) fora do PDF e do Excel. <a href="#" onclick="event.preventDefault();rgPers()">Alterar</a></p>` : ''}
            </div>` +
        `<div class="kp">${kc('files', kf('', 0), 'Processos recebidos', res[0][1], d(res[0]))}${kc('ok', kf('g', 1), 'Processos concluídos', res[1][1], d(res[1]))}${kc('clock', kf('y', 2), 'Em aguardo no fim do período', res[2][1], d(res[2]))}${kc('chat', kf('v', 3), 'Atendimentos registrados', res[3][1], d(res[3]))}${kc('ok', kf('g', 4), 'Atendimentos finalizados', res[4][1], { c: '', t: 'tempo médio: ' + tm + (tm == '—' ? '' : ' dias') })}</div>` +
        `<div class="rgg">${Q.filter(q => q.k != 'resumo')
            .map(
                q =>
                    `<div class="cd${q.h.length > 3 ? ' rgw' : ''}${fo.has('q:' + q.k) ? ' fora' : ''}"><h3>${esc(q.t)}${fo.has('q:' + q.k) ? tag : ''}</h3>
                        <div class="tw">${rgTab(q)}</div>${q.nota ? `<p class="nt" style="margin:8px 0 0">${esc(q.nota)}</p>` : ''}</div>`
            )
            .join('')}</div>` +
        `<p class="nt" style="margin-top:14px">Os números consideram a situação de cada processo e atendimento no último dia do período. Período anterior para comparação: ${fmt(P.pa)} a ${fmt(P.pb)}.</p>`
    );
}

// PDF: abre a impressão do navegador em A4, com cabeçalho institucional e os quadros escolhidos
function rgPdf() {
    const x = rgExp();
    if (!x) return;
    const { P, Q } = x,
        f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const n = new Date(),
        w = f.contentWindow;
    w.document.open();
    w.document
        .write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Controle de Processos ${esc(P.nome)}</title><style>body{font:10.5px Arial;color:#1e293b;margin:0}header{border-bottom:2px solid #0f2a4a;padding-bottom:8px;margin-bottom:12px}header small{color:#475569;font-size:11px;font-weight:bold}h1{font-size:17px;margin:2px 0;color:#0f2a4a}header p{margin:0;color:#475569}section{break-inside:avoid;margin-bottom:14px}h2{font-size:12.5px;margin:0 0 5px;color:#0f2a4a}table{border-collapse:collapse;width:100%}th{background:#0f2a4a;color:#fff;text-align:left;font-size:9.5px}th,td{border:1px solid #cbd5e1;padding:3px 6px}.n{text-align:right}tr:nth-child(even) td{background:#f3f5f9}tr.tot td{font-weight:bold;background:#e8eefc}.rb{display:flex;align-items:center;gap:6px;justify-content:flex-end}.rb i{display:block;height:8px;background:#1d4ed8;border-radius:2px;max-width:70%;-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}.nt{color:#64748b;margin:3px 0 0;font-size:9.5px}footer{margin-top:16px;border-top:1px solid #cbd5e1;padding-top:6px;color:#64748b;font-size:9px}@page{size:A4;margin:14mm 12mm}</style></head><body>
<header><small>Departamento de Bens Móveis - DBM</small><h1>Relatório Controle de Processos</h1>
    <p>Período: <b>${esc(P.nome)}</b></p></header>
${Q.map(q => `<section><h2>${esc(q.t)}</h2>${rgTab(q)}${q.nota ? `<p class="nt">${esc(q.nota)}</p>` : ''}</section>`).join('')}
<footer>Emitido em ${fmt(TS())} às ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}${ME ? ' por ' + esc(ME.nome) : ''}, a partir dos registros do Hub DBM. Números referentes à situação no último dia do período.</footer></body></html>`);
    w.document.close();
    setTimeout(() => {
        w.focus();
        w.print();
        setTimeout(() => f.remove(), 3000);
    }, 300);
}
// Excel: uma aba por quadro escolhido, com todas as linhas
function rgXls() {
    const x = rgExp();
    if (!x) return;
    const { P, Q } = x,
        wb = XLSX.utils.book_new();
    Q.forEach(q =>
        XLSX.utils.book_append_sheet(
            wb,
            xlsTipos(XLSX.utils.aoa_to_sheet([[q.t], ['Período: ' + P.nome], [], q.h, ...q.r])),
            q.t.replace(/[\\/?*[\]:]/g, '').slice(0, 31)
        )
    );
    XLSX.writeFile(wb, 'relatorio_gerencial_' + P.a + '_a_' + P.b + '.xlsx');
}
