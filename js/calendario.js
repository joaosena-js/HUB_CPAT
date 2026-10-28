// Calendário: reuniões, treinamentos, outros eventos, férias, agenda dos servidores, feriados e aniversários, com foto, ATA e lista de presença
const EV_FER = 'Feriado ou ponto facultativo',
    EV_ANIV = 'Aniversário',
    EV_TIPOS = ['Reunião', 'Treinamento', 'Outro evento', 'Férias', 'Agenda do servidor', EV_FER, EV_ANIV];
const EV_LETRA = {
    Reunião: 'R',
    Treinamento: 'T',
    'Outro evento': 'O',
    Férias: 'F',
    'Agenda do servidor': 'A',
    [EV_FER]: 'H',
    [EV_ANIV]: 'N',
};
const EV_CLASSES = ['Feriado nacional', 'Feriado estadual', 'Feriado municipal', 'Ponto facultativo'];
const EV_ROT = ['Ausente', 'Compromisso pessoal'],
    EV_CATS = ['Foto', 'ATA', 'Lista de presença', 'Outro documento'];
const EV_ARQ = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' },
    EV_MAX = 10 * 1024 * 1024;
const EV_DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    EV_MF = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ];
// EV = eventos carregados; EVU = usuários (para nomes e participantes); EVL = assinatura da última carga;
// EVP = carga em andamento; CA = visão escolhida (mês, semana ou dia), data de referência e filtros
let EV = [],
    EVU = [],
    EVL = '',
    EVP = null,
    EV_ANX = false;
const CA = { modo: 'mes', ref: TS(), tipo: '', serv: '' };

const evPess = e => e.tipo == 'Férias' || e.tipo == 'Agenda do servidor';
const evAniv = e => e.tipo == EV_ANIV;
const evNome = e =>
    e.tipo == 'Férias'
        ? 'Férias · ' + e.servidor
        : e.tipo == 'Agenda do servidor'
          ? e.titulo + ' · ' + e.servidor
          : evAniv(e)
            ? 'Aniversário · ' + (e.servidor || e.titulo)
            : e.titulo;
const evHora = e => (e.hora_inicio ? e.hora_inicio + (e.hora_fim ? ' às ' + e.hora_fim : '') : 'Dia inteiro');
const evPer = e =>
    evAniv(e)
        ? fmt(e.inicio).slice(0, 5) + ' (todo ano)'
        : e.inicio == e.fim
          ? fmt(e.inicio)
          : fmt(e.inicio) + ' a ' + fmt(e.fim);
// Aniversário guarda só dia e mês e se repete todo ano; nascido em 29/02 aparece em 28/02 nos anos que não são bissextos
const evOcorre = (e, d) => {
    if (!evAniv(e)) return e.inicio <= d && e.fim >= d;
    const md = e.inicio.slice(5),
        y = +d.slice(0, 4);
    return (
        d.slice(5) == md || (md == '02-29' && d.slice(5) == '02-28' && !(y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)))
    );
};
const evSit = e =>
    evAniv(e)
        ? evOcorre(e, TS())
            ? ['Hoje', 'y']
            : ['Todo ano', '']
        : e.tipo == EV_FER
          ? [e.classificacao, 'r']
          : e.cancelado
            ? ['Cancelado', 'r']
            : e.fim < TS()
              ? [evPess(e) ? 'Encerrado' : 'Realizado', 'g']
              : e.inicio > TS()
                ? ['Agendado', '']
                : ['Em andamento', 'y'];
const evPode = e =>
    adm() ||
    (ME && e.tipo != EV_FER && (e.criado_por == ME.id || ((evPess(e) || evAniv(e)) && e.servidor_id == ME.id)));
const evSemAnexo = e => evPess(e) || e.tipo == EV_FER || evAniv(e);
const evSemAta = e => e.tipo == 'Reunião' && !e.cancelado && e.fim < TS() && !(e.anexos || {}).ATA;
const evTipoBd = e => `<span class="bd ct${EV_LETRA[e.tipo]}">${esc(e.tipo)}</span>`;
const evDow = d => new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)).getDay();
// Eventos que ocorrem no dia d
const evNoDia = (l, d) =>
    l
        .filter(e => evOcorre(e, d))
        .sort(
            (x, y) =>
                (y.tipo == EV_FER) - (x.tipo == EV_FER) ||
                evAniv(y) - evAniv(x) ||
                (x.hora_inicio || '').localeCompare(y.hora_inicio || '') ||
                x.id - y.id
        );
// Feriados valem para todos: aparecem mesmo com o filtro de servidor
const evFiltro = () =>
    EV.filter(
        e =>
            (!CA.tipo || e.tipo == CA.tipo) &&
            (!CA.serv || e.tipo == EV_FER || e.servidor_id == CA.serv || e.participantes.includes(+CA.serv))
    );
const evNomes = ids => ids.map(i => (EVU.find(u => u.id == i) || { nome: 'Usuário inativo' }).nome).join(', ');
const evTam = t =>
    t < 1048576 ? Math.max(1, Math.round(t / 1024)) + ' KB' : (t / 1048576).toFixed(1).replace('.', ',') + ' MB';

// Busca no servidor. silencioso = chamada do intervalo automático: só redesenha se algo mudou e ninguém estiver digitando.
function evLoad(silencioso) {
    return (
        EVP ||
        (EVP = (async () => {
            try {
                const j = await api({ op: 'list' }, '/api/eventos'),
                    sg = JSON.stringify(j);
                EVU = j.usuarios;
                EV_ANX = j.anexos_ok;
                if (sg === EVL) return;
                EV = j.eventos;
                const vis = ['cal', 'relg', 'home'].includes(tab);
                if (vis && silencioso && !livre()) return;
                EVL = sg;
                if (vis) draw();
            } catch (e) {
                if (!silencioso) alert('Erro: ' + e.message);
            } finally {
                EVP = null;
            }
        })())
    );
}

// Tela Calendário (mês, semana ou dia)
function caScr() {
    const h = TS(),
        l = EV.filter(e => !e.cancelado),
        hj = evNoDia(l, h),
        prox = l.filter(e =>
            evAniv(e)
                ? [1, 2, 3, 4, 5, 6, 7].some(i => evOcorre(e, addDias(h, i)))
                : e.inicio > h && e.inicio <= addDias(h, 7)
        ),
        fora = hj.filter(evPess),
        sa = EV.filter(evSemAta);
    const [y, m] = CA.ref.split('-').map(Number),
        s = addDias(CA.ref, -evDow(CA.ref));
    const tit = CA.modo == 'mes' ? EV_MF[m - 1] + ' de ' + y : fmt(s) + ' a ' + fmt(addDias(s, 6)),
        sel = (v, ops, on, t) =>
            `<select onchange="${on}" aria-label="${t}"><option value="">${t}</option>${ops.map(([k, n]) => `<option value="${esc(k)}" ${v == k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    return (
        head(
            'Calendário da equipe',
            'Reuniões, treinamentos, férias, agenda dos servidores, feriados e aniversários',
            `<button class="btn" onclick="evExp()">${ic('xls', 16)} Exportar</button><button class="btn p" onclick="evEd(0)">${ic('plus', 16)} Novo evento</button>`
        ) +
        `<div class="kp">${kc('cal', '', 'Hoje', hj.length, { c: '', t: hj.length ? 'evento(s) na agenda de hoje' : 'nenhum evento hoje' }, `CA.modo='sem';CA.ref=TS();draw()`)}${kc('clock', 'v', 'Próximos 7 dias', prox.length, { c: '', t: 'eventos que começam na semana' })}${kc('user', 'y', 'Fora do setor hoje', fora.length, { c: '', t: fora.length ? esc(fora.map(e => e.servidor.split(' ')[0]).join(', ')) : 'equipe completa' })}${kc('warn', sa.length ? 'r' : 'g', 'Reuniões sem ATA', sa.length, { c: '', t: 'realizadas e sem ATA anexada' }, sa.length ? 'evSemAtaLista()' : '')}</div>` +
        `<div class="cd"><div class="tb"><span class="sg2" style="margin:0">${[
            ['mes', 'Mês'],
            ['sem', 'Semana'],
        ]
            .map(
                ([k, n]) => `<button class="${CA.modo == k ? 'on' : ''}" onclick="CA.modo='${k}';draw()">${n}</button>`
            )
            .join('')}</span>` +
        `<button class="btn s" onclick="caNav(-1)" title="Anterior">${ic('cl', 16)}</button><b class="cat">${tit}</b><button class="btn s" onclick="caNav(1)" title="Próximo">${ic('cr', 16)}</button><button class="btn" onclick="CA.ref=TS();draw()">Hoje</button><span class="sp"></span>` +
        sel(
            CA.tipo,
            EV_TIPOS.map(t => [t, t]),
            'CA.tipo=this.value;draw()',
            'Todos os tipos'
        ) +
        sel(
            CA.serv,
            EVU.map(u => [u.id, u.nome]),
            'CA.serv=this.value;draw()',
            'Todos os servidores'
        ) +
        `</div>` +
        `<div class="clg">${EV_TIPOS.map(t => `<span><i class="ct${EV_LETRA[t]}"></i>${t}</span>`).join('')}</div>${CA.modo == 'mes' ? caMes() : caSem(s)}</div>`
    );
}
// Avança ou volta o período mostrado
function caNav(n) {
    const [y, m] = CA.ref.split('-').map(Number);
    CA.ref = CA.modo == 'mes' ? ymd(new Date(y, m - 1 + n, 1)) : addDias(CA.ref, 7 * n);
    draw();
}
const evChip = e =>
    `<div class="cev ct${EV_LETRA[e.tipo]}${e.cancelado ? ' cx' : ''}" title="${esc(evNome(e) + ' · ' + evHora(e) + (e.cancelado ? ' · Cancelado' : ''))}" onclick="event.stopPropagation();evDet(${e.id})">${e.hora_inicio ? `<b>${e.hora_inicio}</b> ` : ''}${esc(evNome(e))}</div>`;
// Visão do mês
function caMes() {
    const [y, m] = CA.ref.split('-').map(Number),
        p = ymd(new Date(y, m - 1, 1)),
        u = ultimoDia(y, m),
        ini = addDias(p, -evDow(p)),
        fim = addDias(u, 6 - evDow(u)),
        l = evFiltro();
    let c = '';
    for (let d = ini; d <= fim; d = addDias(d, 1)) {
        const es = evNoDia(l, d);
        c += `<div class="cdia${d.slice(0, 7) != p.slice(0, 7) ? ' fo' : ''}${d == TS() ? ' hj' : ''}${es.some(e => e.tipo == EV_FER) ? ' fer' : ''}" onclick="caDia('${d}')" title="Ver o dia ${fmt(d)}"><span class="cn">${+d.slice(8)}</span>${es.slice(0, 3).map(evChip).join('')}${es.length > 3 ? `<span class="cmais">+${es.length - 3} mais</span>` : ''}</div>`;
    }
    return `<div class="cgrid">${EV_DS.map(x => `<div class="cds">${x}</div>`).join('')}${c}</div>`;
}
const evLinha = e => {
    const [st, sc] = evSit(e);
    return `<div class="pi ce ct${EV_LETRA[e.tipo]}" onclick="evDet(${e.id})"><div class="pd">
        <div>${e.hora_inicio || 'Dia'}<small>${e.hora_inicio ? (e.hora_fim ? 'até ' + e.hora_fim : '') : 'inteiro'}</small></div>
        </div>
        <div class="pm"><b>${esc(evNome(e))}</b><div class="evb">${evTipoBd(e)}<span class="bd ${sc}">${st}</span></div><span>${esc(evSemAnexo(e) ? evPer(e) : [e.local, e.inicio != e.fim ? evPer(e) : ''].filter(Boolean).join(' · '))}</span></div>
        </div>`;
};
// Visão da semana
function caSem(s) {
    const l = evFiltro();
    let c = '';
    for (let i = 0; i < 7; i++) {
        const d = addDias(s, i),
            es = evNoDia(l, d);
        c += `<div class="csd${d == TS() ? ' hj' : ''}"><h4>${EV_DS[i]}, ${fmt(d).slice(0, 5)}${d == TS() ? ' · hoje' : ''}<button class="btn s" onclick="evEd(0,'${d}')" title="Novo evento neste dia">${ic('plus', 14)}</button></h4>${es.map(evLinha).join('') || '<p class="nt">Sem eventos.</p>'}</div>`;
    }
    return `<div class="csem">${c}</div>`;
}
// Visão do dia
function caDia(d) {
    const l = evNoDia(evFiltro(), d);
    $('#dd').innerHTML =
        `<h2><span>${EV_DS[evDow(d)]}, ${fmt(d)}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div class="pl" style="margin:14px 20px;max-height:60vh">${l.map(evLinha).join('') || '<p class="nt">Nenhum evento neste dia.</p>'}</div>
            <div class="ac"><button class="btn p" onclick="evEd(0,'${d}')">${ic('plus', 15)} Novo evento neste dia</button></div>`;
    if (!$('#dd').open) $('#dd').showModal();
}
// Janela com as reuniões já realizadas que ainda estão sem ATA
function evSemAtaLista() {
    const l = EV.filter(evSemAta).sort((x, y) => y.fim.localeCompare(x.fim));
    $('#dd').innerHTML =
        `<h2><span>Reuniões realizadas sem ATA</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <p class="nt" style="margin:14px 20px 0">Abra a reunião e anexe a ATA para manter o registro completo.</p>
            <div class="pl" style="margin:10px 20px 18px;max-height:60vh">${l.map(evLinha).join('')}</div>`;
    if (!$('#dd').open) $('#dd').showModal();
}

// Detalhe do evento. avisos = mensagens devolvidas pelo servidor ao salvar (férias coincidentes, participantes fora do setor).
function evDet(id, avisos) {
    const e = EV.find(x => x.id == id);
    if (!e) return;
    const f = (l, v) => `<div>${l}<b>${esc(v) || '—'}</b></div>`,
        [st, sc] = evSit(e),
        pode = evPode(e),
        sb = (a, b) => a.inicio <= b.fim && a.fim >= b.inicio;
    const av =
        avisos ||
        (e.cancelado
            ? []
            : e.tipo == 'Férias'
              ? EV.filter(x => x.tipo == 'Férias' && x.id != e.id && x.servidor_id != e.servidor_id && sb(x, e)).map(
                    x => `As férias coincidem com as de ${x.servidor} (${evPer(x)}).`
                )
              : evSemAnexo(e)
                ? []
                : [
                      ...EV.filter(x => x.tipo == EV_FER && sb(x, e)).map(
                          x => `${evPer(x)}: ${x.classificacao} (${x.titulo}).`
                      ),
                      ...EV.filter(x => evPess(x) && e.participantes.includes(x.servidor_id) && sb(x, e)).map(
                          x => `${x.servidor} estará ${x.tipo == 'Férias' ? 'de férias' : 'ausente'} em ${evPer(x)}.`
                      ),
                  ]);
    const local = /^https?:\/\//i.test(e.local)
        ? `<div>Local ou link<b><a href="${esc(e.local)}" target="_blank" rel="noopener noreferrer">${esc(e.local)}</a></b></div>`
        : f('Local ou link', e.local);
    $('#dd').innerHTML =
        `<h2><span>${esc(evNome(e))}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div style="margin:12px 20px 0;display:flex;gap:6px;flex-wrap:wrap">${evTipoBd(e)}<span class="bd ${sc}">${st}</span></div>` +
        (av.length
            ? `<div class="ib" style="margin:12px 20px 0;border-left-color:var(--wn);background:var(--wn2)">${ic('warn', 15)} ${av.map(esc).join('<br>')}</div>`
            : '') +
        (e.pauta
            ? `<div class="ds" style="margin-top:14px">${e.tipo == 'Treinamento' ? 'Conteúdo' : e.tipo == EV_FER ? 'Ato ou observação' : e.tipo == 'Outro evento' ? 'Descrição' : 'Pauta'}<b>${esc(e.pauta)}</b></div>`
            : '') +
        `<div class="dl">${evAniv(e) ? f('Aniversariante', e.servidor || e.titulo) + f('Data', evPer(e)) : f('Período', evPer(e)) + (e.tipo == EV_FER ? f('Classificação', e.classificacao) : f('Horário', evHora(e))) + (e.tipo == EV_FER ? '' : evPess(e) ? f('Servidor', e.servidor) : local + f('Participantes da equipe', evNomes(e.participantes)) + f('Participantes externos', e.participantes_externos) + (e.tipo == 'Treinamento' ? f('Carga horária', e.carga_horaria ? String(e.carga_horaria).replace('.', ',') + ' h' : '') : ''))}${f('Lançado por', e.criado_por_nome)}` +
        (e.tipo == 'Agenda do servidor' && !e.reservado
            ? `<div style="grid-column:1/-1">Motivo (reservado)<b style="font-weight:500">${esc(e.motivo) || '—'}</b><small>Visível somente para o servidor e para o administrador.</small></div>`
            : '') +
        `</div>` +
        (evSemAnexo(e)
            ? ''
            : `<h3 class="kt" style="margin:0 20px 8px">${ic('clip', 16)} ${e.tipo == 'Outro evento' ? 'Fotos e documentos' : 'Foto, ATA e lista de presença'}</h3>` +
              (pode
                  ? EV_ANX
                      ? `<form class="tb" style="margin:0 20px 6px" onsubmit="event.preventDefault();evUp(${e.id})"><select id="ev_cat" aria-label="Tipo do anexo">${EV_CATS.map(c => `<option ${c == (e.tipo == 'Treinamento' ? 'Lista de presença' : e.tipo == 'Outro evento' ? 'Foto' : 'ATA') ? 'selected' : ''}>${c}</option>`).join('')}</select><input type="file" id="ev_arq" accept=".pdf,.jpg,.jpeg,.png" multiple style="flex:1;min-width:200px" aria-label="Arquivos"><button class="btn p s" id="ev_env">${ic('up', 14)} Enviar</button></form><p class="nt" id="ev_st" style="margin:0 20px 10px">PDF, JPG ou PNG, até 10 MB cada. Dá para escolher vários de uma vez.</p>`
                      : `<p class="nt" style="margin:0 20px 10px">O envio de arquivos será liberado quando o armazenamento de anexos for configurado na Vercel.</p>`
                  : '') +
              `<div class="ax" id="ev_ax"><p class="nt">Carregando anexos…</p></div>`) +
        `<div class="ac">${pode ? `<button class="btn p" onclick="evEd(${e.id})">${ic('pen', 15)} Editar</button>` : `<span class="nt">${e.tipo == EV_FER ? 'Somente o administrador altera feriados e pontos facultativos.' : `Somente quem lançou o evento${evPess(e) || evAniv(e) ? ', o próprio servidor' : ''} ou o administrador pode alterá-lo.`}</span>`}<span class="sp"></span>${pode ? `<button class="btn d" onclick="evRm(${e.id})">${ic('trash', 15)} Excluir</button>` : ''}</div>`;
    if (!$('#dd').open) $('#dd').showModal();
    $('#dd').scrollTop = 0;
    if (!evSemAnexo(e)) evAnexos(e.id);
}
// Carrega e mostra os anexos (fotos, ATA, lista de presença) de um evento
async function evAnexos(id) {
    const el = $('#ev_ax');
    if (!el) return;
    let a;
    try {
        a = (await api({ op: 'anexos', id }, '/api/eventos')).anexos;
    } catch (er) {
        el.innerHTML = '<p class="nt">Não foi possível carregar os anexos.</p>';
        return;
    }
    const e = EV.find(x => x.id == id),
        pode = e && evPode(e);
    el.innerHTML = a.length
        ? a
              .map(
                  x =>
                      `<div><span class="bd ${x.categoria == 'ATA' || x.categoria == 'Lista de presença' ? 'g' : 'n'}">${esc(x.categoria)}</span><span class="axn"><b>${esc(x.nome)}</b><small>${evTam(x.tamanho)} · enviado por ${esc(x.enviado_por_nome)} em ${esc(x.enviado_em)}</small></span><button class="btn s" onclick="evAbrir(${x.id})" title="Abrir">${ic('eye', 15)}</button>${pode || (ME && x.enviado_por == ME.id) ? `<button class="btn s" onclick="evRmAnexo(${x.id},${id})" title="Remover">${ic('trash', 15)}</button>` : ''}</div>`
              )
              .join('')
        : '<p class="nt">Nenhum arquivo anexado.</p>';
}
// Envio direto do navegador para o armazenamento, com link liberado pelo servidor; depois o servidor confere o arquivo recebido
const evArqErro = f =>
    !EV_ARQ[(f.name.split('.').pop() || '').toLowerCase()]
        ? f.name + ': envie somente PDF, JPG ou PNG.'
        : f.size > EV_MAX
          ? f.name + ': o arquivo passa de 10 MB.'
          : '';
async function evEnviar(id, f, categoria) {
    const j = await api(
        {
            op: 'anexo_preparar',
            id,
            categoria,
            nome: f.name,
            tipo: EV_ARQ[f.name.split('.').pop().toLowerCase()],
            tamanho: f.size,
        },
        '/api/eventos'
    );
    const r = await fetch(j.url, { method: 'PUT', headers: j.headers, body: f }).catch(() => null);
    if (!r || !r.ok)
        throw new Error(
            'o arquivo não foi enviado ao armazenamento' + (r ? ` (código ${r.status})` : '. Verifique a conexão.')
        );
    await api({ op: 'anexo_confirmar', anexo_id: j.anexo_id }, '/api/eventos');
}
// l = lista de [arquivo, categoria]; envia um por vez e informa o andamento no detalhe do evento
async function evEnviarVarios(id, l) {
    const st = () => $('#ev_st'),
        erros = [];
    for (let i = 0; i < l.length; i++) {
        if (st()) st().textContent = `Enviando ${l.length > 1 ? i + 1 + ' de ' + l.length + ': ' : ''}${l[i][0].name}…`;
        try {
            await evEnviar(id, ...l[i]);
        } catch (e) {
            erros.push(l[i][0].name + ': ' + e.message);
        }
    }
    if (st())
        st().textContent =
            l.length - erros.length
                ? `${l.length - erros.length} arquivo(s) anexado(s).`
                : 'PDF, JPG ou PNG, até 10 MB.';
    evAnexos(id);
    evLoad(1);
    if (erros.length) alert('Não foi possível anexar:\n' + erros.join('\n'));
}
// Escolha de arquivos para anexar ao evento
async function evUp(id) {
    const fs = [...$('#ev_arq').files],
        bt = $('#ev_env');
    if (!fs.length) return alert('Escolha o arquivo.');
    const er = fs.map(evArqErro).filter(Boolean);
    if (er.length) return alert(er.join('\n'));
    bt.disabled = true;
    try {
        await evEnviarVarios(
            id,
            fs.map(f => [f, $('#ev_cat').value])
        );
        const a = $('#ev_arq');
        if (a) a.value = '';
    } finally {
        bt.disabled = false;
    }
}
// A janela é aberta antes da consulta para não ser barrada pelo bloqueador de pop-ups; o link vale por 5 minutos
async function evAbrir(aid) {
    const w = open('', '_blank');
    try {
        const j = await api({ op: 'anexo_abrir', anexo_id: aid }, '/api/eventos');
        if (w) {
            w.opener = null;
            w.location.href = j.url;
        } else location.href = j.url;
    } catch (e) {
        if (w) w.close();
        alert('Erro: ' + e.message);
    }
}
// Exclui um anexo do evento
function evRmAnexo(aid, id) {
    if (confirm('Remover este arquivo? Ele será apagado do armazenamento.'))
        run(async () => {
            await api({ op: 'anexo_remover', anexo_id: aid }, '/api/eventos');
            evAnexos(id);
            evLoad(1);
        });
}

// Formulário de evento (id 0 = novo evento; data opcional já preenchida)
function evEd(id, data) {
    const e = id
        ? EV.find(x => x.id == id)
        : {
              id: 0,
              tipo: CA.tipo || 'Reunião',
              titulo: '',
              inicio: data || TS(),
              fim: data || TS(),
              hora_inicio: '',
              hora_fim: '',
              local: '',
              pauta: '',
              participantes_externos: '',
              carga_horaria: '',
              servidor_id: ME ? ME.id : 0,
              motivo: '',
              classificacao: '',
              cancelado: false,
              participantes: [],
          };
    if (!e) return;
    if (e.tipo == EV_FER && !adm()) e.tipo = 'Reunião';
    const us = EVU.map(u => [u.id, u.nome]);
    e.participantes.filter(i => !EVU.some(u => u.id == i)).forEach(i => us.push([i, 'Usuário inativo']));
    if (e.servidor_id && !us.some(u => u[0] == e.servidor_id))
        us.push([e.servidor_id, (e.servidor || 'Usuário') + ' (inativo)']);
    const op = (l, v) =>
            l.map(([k, n]) => `<option value="${esc(k)}" ${v == k ? 'selected' : ''}>${esc(n)}</option>`).join(''),
        gr = t => (evPess({ tipo: t }) ? 'P' : t == EV_FER ? 'H' : t == EV_ANIV ? 'N' : 'E'),
        ok = EV_TIPOS.filter(t => (id ? gr(t) == gr(e.tipo) : true) && (t != EV_FER || adm()));
    $('#dd').innerHTML =
        `<h2><span>${id ? 'Editar evento' : 'Novo evento'}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><form class="fm" id="evf" onsubmit="event.preventDefault();evSv(${e.id})">
<label>Tipo<select id="e_tipo" onchange="evTipo()">${op(
            ok.map(t => [t, t]),
            e.tipo
        )}</select></label>
<label data-t="RTOH"><span id="e_tl">Título</span><input id="e_titulo" value="${esc(evPess(e) || evAniv(e) ? '' : e.titulo)}" maxlength="200" placeholder="Ex.: Reunião de alinhamento com a SEAD"></label>
<label data-t="H">Classificação<select id="e_classificacao"><option value="">Selecione…</option>${op(
            EV_CLASSES.map(t => [t, t]),
            e.classificacao
        )}</select></label>
<label data-t="FA">Servidor<select id="e_servidor_id" ${adm() ? '' : 'disabled'}>${op(us, e.servidor_id)}</select></label>
<label data-t="N">Aniversariante<select id="e_aniv" onchange="evTipo()" ${adm() ? '' : 'disabled'}>${op([...us, ...(adm() ? [['', 'Pessoa de fora da equipe']] : [])], evAniv(e) ? e.servidor_id || '' : ME ? ME.id : '')}</select></label>
<label data-t="N" id="e_anl">Nome do aniversariante<input id="e_aniv_nome" value="${esc(evAniv(e) && !e.servidor_id ? e.titulo : '')}" maxlength="200"></label>
<label data-t="N">Dia<select id="e_dia">${op(
            Array.from({ length: 31 }, (_, i) => [String(i + 1).padStart(2, '0'), i + 1]),
            e.inicio.slice(8)
        )}</select></label><label data-t="N">Mês<select id="e_mes">${op(
            EV_MF.map((n, i) => [String(i + 1).padStart(2, '0'), n]),
            e.inicio.slice(5, 7)
        )}</select></label>
<p class="nt w" data-t="N" style="margin:0">Registramos só o dia e o mês, sem o ano de nascimento. O aniversário aparece no calendário todos os anos.</p>
<label data-t="A">A equipe verá como<select id="e_rotulo">${op(
            EV_ROT.map(t => [t, t]),
            e.titulo
        )}</select></label>
<label data-t="RTOFAH">Início<input type="date" id="e_inicio" value="${evAniv(e) ? TS() : e.inicio}" onchange="if($('#e_fim').value<this.value)$('#e_fim').value=this.value"></label><label data-t="RTOFAH">Fim<input type="date" id="e_fim" value="${evAniv(e) ? TS() : e.fim}"></label>
<label data-t="RTOA">Hora de início<input type="time" id="e_hora_inicio" value="${e.hora_inicio || ''}"></label><label data-t="RTOA">Hora de fim<input type="time" id="e_hora_fim" value="${e.hora_fim || ''}"></label>
<p class="nt w" data-t="RTOA" style="margin:0">Deixe a hora em branco para compromisso de dia inteiro.</p>
<label class="w" data-t="RTO">Local ou link<input id="e_local" value="${esc(e.local)}" maxlength="300" placeholder="Sala, endereço ou link do Teams"></label>
<label data-t="T">Carga horária (horas)<input id="e_carga_horaria" value="${e.carga_horaria ? String(e.carga_horaria).replace('.', ',') : ''}" inputmode="decimal" placeholder="Ex.: 4"></label>
<div class="w" data-t="RTO"><span class="lb">Participantes da equipe</span><div class="evp" id="e_part">${us.map(([k, n]) => `<label><input type="checkbox" value="${k}" ${e.participantes.includes(+k) ? 'checked' : ''}> ${esc(n)}</label>`).join('')}</div>
    </div>
<label class="w" data-t="RTO">Participantes externos<input id="e_participantes_externos" value="${esc(e.participantes_externos)}" maxlength="1000" placeholder="Nome e órgão, separados por vírgula"></label>
<label class="w" data-t="RTOH"><span id="e_pl">Pauta</span><textarea id="e_pauta" rows="3" maxlength="4000">${esc(e.pauta)}</textarea></label>
<label class="w" data-t="A">Motivo (reservado)<textarea id="e_motivo" rows="2" maxlength="500" placeholder="Ex.: consulta, curso, assunto particular">${esc(e.motivo)}</textarea></label>
<p class="nt w" data-t="A" style="margin:0">O motivo fica visível somente para você e para o administrador. A equipe vê apenas "Ausente" ou "Compromisso pessoal". Não informe diagnóstico nem detalhes de saúde.</p>
<div class="w" data-t="RTO"><span class="lb">Anexos (opcional)</span>${
            EV_ANX
                ? `<div class="evx"><label><span id="e_al">ATA</span><input type="file" id="e_ata" accept=".pdf,.jpg,.jpeg,.png"></label><label>Fotos<input type="file" id="e_fotos" accept=".jpg,.jpeg,.png" multiple></label></div>
    <p class="nt" style="margin:4px 0 0">PDF, JPG ou PNG, até 10 MB cada. Os arquivos são enviados logo depois de salvar o evento.</p>`
                : '<p class="nt" style="margin:4px 0 0">O envio de ATA e fotos será liberado quando o armazenamento de anexos for configurado na Vercel.</p>'
        }</div>
${id ? `<label class="w ck" data-t="RTO"><input type="checkbox" id="e_cancelado" ${e.cancelado ? 'checked' : ''}> Evento cancelado</label>` : ''}
<div class="w" style="display:flex;gap:8px"><button class="btn p">${ic('ok', 15)} Salvar</button><button type="button" class="btn" onclick="${id ? `evDet(${id})` : `$('#dd').close()`}">Cancelar</button></div></form>`;
    evTipo();
    if (!$('#dd').open) $('#dd').showModal();
    $('#dd').scrollTop = 0;
}
// Mostra ou esconde campos do formulário conforme o tipo de evento
function evTipo() {
    const t = EV_LETRA[$('#e_tipo').value];
    $('#evf')
        .querySelectorAll('[data-t]')
        .forEach(x => (x.hidden = !x.dataset.t.includes(t)));
    $('#e_titulo').required = 'RTOH'.includes(t);
    $('#e_classificacao').required = t == 'H';
    $('#e_inicio').required = $('#e_fim').required = t != 'N';
    $('#e_anl').hidden = t != 'N' || $('#e_aniv').value != '';
    $('#e_aniv_nome').required = !$('#e_anl').hidden;
    $('#e_pl').textContent =
        t == 'T'
            ? 'Conteúdo do treinamento'
            : t == 'H'
              ? 'Ato ou observação (opcional)'
              : t == 'O'
                ? 'Descrição'
                : 'Pauta';
    $('#e_tl').textContent = t == 'H' ? 'Nome' : 'Título';
    if ($('#e_al')) $('#e_al').textContent = t == 'T' ? 'Lista de presença' : t == 'O' ? 'Documento' : 'ATA';
    $('#e_titulo').placeholder =
        t == 'H'
            ? 'Ex.: Proclamação da República'
            : t == 'O'
              ? 'Ex.: Confraternização de fim de ano'
              : 'Ex.: Reunião de alinhamento com a SEAD';
    $('#e_pauta').placeholder = t == 'H' ? 'Ex.: Decreto que estabeleceu o ponto facultativo' : '';
}
// Botão Salvar do formulário: valida e grava o evento
function evSv(id) {
    const t = $('#e_tipo').value,
        g = k => ($('#e_' + k) ? $('#e_' + k).value : '').trim(),
        L_ = EV_LETRA[t];
    const ani = L_ == 'N',
        dn = ani ? `2000-${g('mes')}-${g('dia')}` : '';
    if (ani && new Date(dn + 'T12:00').getDate() != +g('dia')) return alert('Este dia não existe no mês escolhido.');
    const b = {
        id,
        tipo: t,
        titulo: L_ == 'A' ? g('rotulo') : ani ? (g('aniv') ? '' : g('aniv_nome')) : g('titulo'),
        inicio: ani ? dn : g('inicio'),
        fim: ani ? dn : g('fim'),
        hora_inicio: 'FHN'.includes(L_) ? '' : g('hora_inicio'),
        hora_fim: 'FHN'.includes(L_) ? '' : g('hora_fim'),
        classificacao: L_ == 'H' ? g('classificacao') : '',
        local: g('local'),
        pauta: g('pauta'),
        participantes_externos: g('participantes_externos'),
        carga_horaria: L_ == 'T' ? g('carga_horaria') : '',
        servidor_id: ani ? g('aniv') : g('servidor_id'),
        motivo: L_ == 'A' ? g('motivo') : '',
        cancelado: !!($('#e_cancelado') && $('#e_cancelado').checked),
        participantes: [...document.querySelectorAll('#e_part input:checked')].map(x => +x.value),
    };
    if (b.fim < b.inicio) return alert('A data de fim não pode ser anterior à de início.');
    const arq =
        'RTO'.includes(L_) && $('#e_ata')
            ? [
                  ...[...$('#e_ata').files].map(f => [
                      f,
                      L_ == 'T' ? 'Lista de presença' : L_ == 'O' ? 'Outro documento' : 'ATA',
                  ]),
                  ...[...$('#e_fotos').files].map(f => [f, 'Foto']),
              ]
            : [];
    const er = arq.map(x => evArqErro(x[0])).filter(Boolean);
    if (er.length) return alert(er.join('\n'));
    umaVez(async () => {
        const j = await api({ op: 'save', item: b }, '/api/eventos');
        await evLoad(1);
        evDet(j.id, j.avisos);
        if (tab == 'cal') draw();
        if (arq.length) await evEnviarVarios(j.id, arq);
    });
}
// Exclui um evento
function evRm(id) {
    const e = EV.find(x => x.id == id),
        n = e ? Object.values(e.anexos || {}).reduce((s, x) => s + x, 0) : 0;
    if (
        confirm(
            'Excluir este evento' + (n ? ` e os ${n} arquivo(s) anexado(s)` : '') + '? Esta ação não pode ser desfeita.'
        )
    )
        run(async () => {
            await api({ op: 'del', id }, '/api/eventos');
            $('#dd').close();
            await evLoad(1);
            if (tab == 'cal') draw();
        });
}

// Exportação do calendário (Excel ou PDF) por período, tipo e servidor. Com "Todos os tipos", cada tipo sai em uma aba (Excel) ou seção (PDF),
// com as colunas próprias do tipo. O motivo reservado da agenda do servidor nunca é exportado.
function evExp() {
    const [y, m] = CA.ref.split('-').map(Number),
        s = addDias(CA.ref, -evDow(CA.ref)),
        a = CA.modo == 'mes' ? ymd(new Date(y, m - 1, 1)) : s,
        b = CA.modo == 'mes' ? ultimoDia(y, m) : addDias(s, 6);
    const op = (l, v) =>
        l.map(([k, n]) => `<option value="${esc(k)}" ${v == k ? 'selected' : ''}>${esc(n)}</option>`).join('');
    $('#dd').innerHTML =
        `<h2><span>Exportar calendário</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><form class="fm" onsubmit="event.preventDefault()">
<label>De<input type="date" id="x_a" value="${a}"></label><label>Até<input type="date" id="x_b" value="${b}"></label>
<label>Tipo<select id="x_t"><option value="">Todos os tipos (um por aba ou seção)</option>${op(
            EV_TIPOS.map(t => [t, t]),
            CA.tipo
        )}</select></label>
<label>Servidor<select id="x_s"><option value="">Todos os servidores</option>${op(
            EVU.map(u => [u.id, u.nome]),
            CA.serv
        )}</select></label>
<label class="w ck"><input type="checkbox" id="x_c" checked> Incluir eventos cancelados</label>
<p class="nt w" style="margin:0">Entram os eventos que acontecem em pelo menos um dia do período. O motivo da agenda do servidor não é exportado.</p>
<div class="w" style="display:flex;gap:8px"><button type="button" class="btn p" onclick="evExpGo('x')">${ic('xls', 15)} Excel</button><button type="button" class="btn" onclick="evExpGo('p')">${ic('pdf', 15)} PDF</button></div></form>`;
    if (!$('#dd').open) $('#dd').showModal();
}
const evAnxTxt = e =>
    Object.entries(e.anexos || {})
        .map(([k, n]) => `${k}: ${n}`)
        .join(' · ') || 'Nenhum';
// Colunas por tipo: [cabeçalho, valor]
function evExpCols(t) {
    const L = EV_LETRA[t],
        dia = e => fmt(e.inicio).slice(0, 5);
    if (L == 'N')
        return [
            ['Aniversariante', e => e.servidor || e.titulo],
            ['Dia', dia],
            ['Lançado por', e => e.criado_por_nome],
        ];
    const base = [
        ['Evento', evNome],
        ['Início', e => fmt(e.inicio)],
        ['Fim', e => fmt(e.fim)],
    ];
    if (L == 'H')
        return [
            ...base,
            ['Classificação', e => e.classificacao],
            ['Ato ou observação', e => e.pauta],
            ['Lançado por', e => e.criado_por_nome],
        ];
    if (L == 'F')
        return [
            ['Servidor', e => e.servidor],
            ['Início', e => fmt(e.inicio)],
            ['Fim', e => fmt(e.fim)],
            ['Dias', e => dDias(e.inicio, e.fim) + 1],
            ['Situação', e => evSit(e)[0]],
            ['Lançado por', e => e.criado_por_nome],
        ];
    if (L == 'A')
        return [
            ['Servidor', e => e.servidor],
            ['Como a equipe vê', e => e.titulo],
            ['Início', e => fmt(e.inicio)],
            ['Fim', e => fmt(e.fim)],
            ['Horário', evHora],
            ['Situação', e => evSit(e)[0]],
        ];
    return [
        ...base,
        ['Horário', evHora],
        ['Situação', e => evSit(e)[0]],
        ['Local ou link', e => e.local],
        ['Participantes da equipe', e => evNomes(e.participantes)],
        ['Participantes externos', e => e.participantes_externos],
        [L == 'T' ? 'Conteúdo' : L == 'O' ? 'Descrição' : 'Pauta', e => e.pauta],
        ...(L == 'T'
            ? [['Carga horária (h)', e => (e.carga_horaria ? String(e.carga_horaria).replace('.', ',') : '')]]
            : []),
        ['Anexos', evAnxTxt],
        ['Lançado por', e => e.criado_por_nome],
    ];
}
function evExpGo(kind) {
    const a = $('#x_a').value,
        b = $('#x_b').value,
        t = $('#x_t').value,
        sv = $('#x_s').value,
        canc = $('#x_c').checked;
    if (!a || !b || b < a) return alert('Informe um período válido.');
    if (dDias(a, b) > 731) return alert('Escolha um período de até 2 anos.');
    const noPer = e => {
        if (!evAniv(e)) return e.inicio <= b && e.fim >= a;
        for (let d = a; d <= b; d = addDias(d, 1)) if (evOcorre(e, d)) return true;
        return false;
    };
    const l = EV.filter(
        e =>
            (!t || e.tipo == t) &&
            (canc || !e.cancelado) &&
            (!sv || e.tipo == EV_FER || e.servidor_id == sv || e.participantes.includes(+sv)) &&
            noPer(e)
    ).sort(
        (x, y) =>
            (evAniv(x) && evAniv(y)
                ? x.inicio.slice(5).localeCompare(y.inicio.slice(5))
                : x.inicio.localeCompare(y.inicio)) ||
            (x.hora_inicio || '').localeCompare(y.hora_inicio || '') ||
            x.id - y.id
    );
    if (!l.length) return alert('Nenhum evento no período com esses filtros.');
    const tipos = (t ? [t] : EV_TIPOS).filter(x => l.some(e => e.tipo == x)),
        sec = tipos.map(x => {
            const c = evExpCols(x),
                r = l.filter(e => e.tipo == x);
            return { t: x, h: c.map(z => z[0]), r: r.map(e => c.map(z => String(z[1](e) ?? ''))) };
        });
    const per = `${fmt(a)} a ${fmt(b)}`,
        sn = sv ? ' · ' + (EVU.find(u => u.id == sv) || {}).nome : '',
        tit = 'Calendário da equipe' + (t ? ' · ' + t : '');
    if (kind == 'x') {
        const wb = XLSX.utils.book_new();
        if (sec.length > 1)
            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.aoa_to_sheet([
                    [tit],
                    ['Período: ' + per + sn],
                    [],
                    ['Tipo', 'Eventos', 'Cancelados'],
                    ...sec.map(x => [
                        x.t,
                        l.filter(e => e.tipo == x.t).length,
                        l.filter(e => e.tipo == x.t && e.cancelado).length,
                    ]),
                    ['Total', l.length, l.filter(e => e.cancelado).length],
                ]),
                'Resumo'
            );
        // Cada aba: resumo quantitativo (total e por situação), datas como data e filtro no cabeçalho
        sec.forEach(x =>
            XLSX.utils.book_append_sheet(
                wb,
                xlsRel('Calendário da equipe · ' + x.t, x.h, x.r, 'Período: ' + per + sn),
                x.t.replace(/[\\/?*[\]:]/g, '').slice(0, 31)
            )
        );
        XLSX.writeFile(
            wb,
            ('calendario_' + (t || 'todos') + '_' + a + '_a_' + b)
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/\W+/g, '_') + '.xlsx'
        );
        return;
    }
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const w = f.contentWindow;
    w.document.open();
    w.document.write(
        `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(tit)}</title><style>body{font:11px Arial;margin:16px}h1{font-size:16px;margin:0}h2{font-size:13px;margin:16px 0 6px;color:#0f2a4a}p{color:#555;margin:2px 0 10px}table{border-collapse:collapse;width:100%;page-break-inside:auto}tr{page-break-inside:avoid}th{background:#0f2a4a;color:#fff;text-align:left}th,td{border:1px solid #ccc;padding:4px 6px;vertical-align:top}td{white-space:pre-wrap}tr:nth-child(even){background:#f3f5f9}@page{size:landscape;margin:10mm}</style></head><body><h1>${esc(tit)}</h1>
            <p>Coordenadoria de Patrimônio · DBM · Período: ${per}${esc(sn)} · emitido em ${fmt(TS())} · ${l.length} evento(s)</p>` +
            sec
                .map(
                    x =>
                        `${sec.length > 1 ? `<h2>${esc(x.t)} (${x.r.length})</h2>` : ''}<table>
                            <thead>
                            <tr>${x.h.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
                            </thead>
                            <tbody>${x.r.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
                            </table>`
                )
                .join('') +
            `</body></html>`
    );
    w.document.close();
    setTimeout(() => {
        w.focus();
        w.print();
        setTimeout(() => f.remove(), 3000);
    }, 300);
}
