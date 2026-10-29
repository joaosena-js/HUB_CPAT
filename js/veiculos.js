// Gestão de Veículos: veículos no depósito, com fotos por parte do veículo e Lista de Verificação de Veículo (vistoria)
const VE_SIT = ['Regularizado', 'Em regularização', 'Não regularizado'],
    VE_SIT_COR = { Regularizado: 'g', 'Em regularização': 'y', 'Não regularizado': 'r' };
// Sugestões iniciais dos campos Tipo e Destinação (o administrador ajusta em Listas e Parâmetros)
const VE_TIPOS_PAD = ['Automóvel', 'Caminhonete', 'Utilitário', 'Motocicleta', 'Caminhão', 'Micro-ônibus', 'Ônibus'],
    VE_DEST_PAD = ['A definir', 'Alienação (leilão)', 'Doação', 'Transferência', 'Baixa (sucata)'];
// Sugestões para a parte do veículo mostrada em cada foto
const VE_PARTES = [
    'Frontal',
    'Traseira',
    'Lateral direita',
    'Lateral esquerda',
    'Superior',
    'Interior',
    'Painel e hodômetro',
    'Motor',
    'Chassi (numeração)',
    'Placa',
    'Documento',
];
// Lista de Verificação: os 26 itens do modelo em papel e as 5 vistas do desenho do veículo.
// x e y = posição (em %) dos parênteses de cada vista na imagem img/vistoria-veiculo.png, onde a impressão escreve as avarias.
const VE_ITENS = [
    'Descaracterizado',
    'Motor',
    'Caixa de marcha',
    'Transmissão',
    'Pneu dianteiro direito',
    'Pneu dianteiro esquerdo',
    'Pneu traseiro direito',
    'Pneu traseiro esquerdo',
    'Retrovisor direito',
    'Retrovisor esquerdo',
    'Para-brisa dianteiro',
    'Para-brisa traseiro',
    'Vidros laterais direito',
    'Vidros laterais esquerdo',
    'Faróis dianteiros/piscas',
    'Lanternas/piscas traseiros',
    'Banco dianteiro (motorista)',
    'Banco dianteiro (carona)',
    'Banco traseiro',
    'Extintor de incêndio',
    'Estepe',
    'Giroflex',
    'Chaves do veículo',
    'CRV',
    'LCRV',
    'Macaco',
];
const VE_MARCAS = [
    ['S', 'Sim, existe ou OK'],
    ['N', 'Não existe'],
    ['I', 'Incompleto'],
    ['A', 'Avariado'],
];
const VE_VISTAS = [
    ['ld', 'Lateral direita', 47.1, 2.3],
    ['fr', 'Frente', 15.4, 36.2],
    ['su', 'Superior', 50.4, 49.8],
    ['tr', 'Traseira', 85, 36.2],
    ['le', 'Lateral esquerda', 47.1, 95],
];
const VE_AVARIAS = [
    ['A', 'Amassado'],
    ['R', 'Riscado'],
    ['Q', 'Quebrado'],
    ['F', 'Faltante'],
];

// VE = veículos carregados; VEL = assinatura da última carga; VEP = carga em andamento; VE_FOTOS_OK = Blob configurado
// VES = pesquisa, filtros e página da tela Veículos; VPS = pesquisa da tela Processos (de veículos)
let VE = [],
    VEL = '',
    VEP = null,
    VE_FOTOS_OK = false;
const VES = { q: '', f: {}, page: 1, size: 25, open: false },
    VPS = { q: '', t: '' };

// Lista de Verificação preenchida: tem data ou pelo menos um item marcado
const veVistOk = v => !!(v.vistoria && (v.vistoria.data || (v.vistoria.itens || []).some(Boolean)));
// Placa no formato de exibição: ABC-1234 (antiga) ou ABC1D23 (Mercosul)
const vePlaca = p => (/^[A-Z]{3}\d{4}$/.test(p || '') ? p.slice(0, 3) + '-' + p.slice(3) : p || '');
// Nome curto do veículo para títulos: modelo e placa (ou tombo)
const veNome = v => v.modelo + (v.placa ? ' · ' + vePlaca(v.placa) : v.tombo ? ' · tombo ' + v.tombo : '');
const veSit = v =>
    v.situacao_doc
        ? `<span class="bd ${VE_SIT_COR[v.situacao_doc] || ''}">${esc(v.situacao_doc)}</span>`
        : '<span class="nt">Não informada</span>';
const veDep = v =>
    v.saida ? `<span class="bd n">Saiu em ${fmt(v.saida)}</span>` : '<span class="bd">No depósito</span>';
// Lista de veículos com os campos calculados usados nos filtros
const veView = () =>
    VE.map(v => ({
        ...v,
        deposito: v.saida ? 'Saiu do depósito' : 'No depósito',
        doc: v.situacao_doc || 'Não informada',
        vist: veVistOk(v) ? 'Preenchida' : 'Não preenchida',
        temfoto: v.fotos ? 'Com fotos' : 'Sem fotos',
        temproc: v.processo_id
            ? 'Processo cadastrado no Hub'
            : v.processo_numero
              ? 'Processo não cadastrado no Hub'
              : 'Sem processo',
        dest: v.destinacao || 'Não informada',
    }));
const VE_FD = [
    ['deposito', 'Situação no depósito'],
    ['doc', 'Situação documental'],
    ['tipo', 'Tipo'],
    ['orgao', 'Órgão'],
    ['dest', 'Destinação'],
    ['vist', 'Lista de Verificação'],
    ['temfoto', 'Fotos'],
    ['temproc', 'Processo'],
];
// Verdadeiro quando o veículo atende aos filtros (skip ignora um campo)
const veOk = (x, f, skip) => VE_FD.every(([c]) => c == skip || !f[c] || x[c] == f[c]);
// Veículos que atendem à pesquisa digitada
const veBusca = () => {
    const q = nz(VES.q),
        qp = q.replace(/[^0-9a-z]/g, '');
    return veView().filter(
        x =>
            !q ||
            nz(
                [
                    x.placa,
                    vePlaca(x.placa),
                    x.tombo,
                    x.tipo,
                    x.modelo,
                    x.ano,
                    x.chassi,
                    x.renavam,
                    x.orgao,
                    x.processo_numero,
                    x.destinacao,
                ].join(' ')
            ).includes(q) ||
            (qp.length > 2 && nz(x.placa + ' ' + x.chassi + ' ' + x.renavam).includes(qp))
    );
};
// Veículos depois da pesquisa e dos filtros
const veRows = () => veBusca().filter(x => veOk(x, VES.f));
// Colunas: título, valor para exportação, HTML opcional para a tela
const VE_C = [
    ['Placa', v => vePlaca(v.placa), v => `<b>${esc(vePlaca(v.placa)) || '—'}</b>`],
    ['Tombo', v => v.tombo],
    ['Tipo', v => v.tipo],
    ['Modelo', v => v.modelo],
    ['Órgão', v => v.orgao],
    ['Processo', v => v.processo_numero || ''],
    ['Situação documental', v => v.situacao_doc || 'Não informada', veSit],
    ['Destinação', v => v.destinacao],
    ['Depósito', v => (v.saida ? 'Saiu em ' + fmt(v.saida) : 'No depósito'), veDep],
];
// Exportação: todas as colunas, começando pelos campos na mesma ordem da planilha usada pelo setor
const VE_X = (() => {
    const c = Object.fromEntries(VE_C.map(x => [x[0], x]));
    return [
        ['ID', v => v.id],
        c['Órgão'],
        c['Processo'],
        c['Placa'],
        c['Tombo'],
        c['Tipo'],
        c['Modelo'],
        ['Ano', v => v.ano || ''],
        ['Chassi', v => v.chassi],
        ['RENAVAM', v => v.renavam],
        ['Último licenciamento', v => v.ultimo_licenciamento || ''],
        c['Destinação'],
        c['Situação documental'],
        c['Depósito'],
        ['Entrada no depósito', v => (v.entrada ? fmt(v.entrada) : '')],
        ['Saída do depósito', v => (v.saida ? fmt(v.saida) : '')],
        ['Lista de Verificação', v => (veVistOk(v) ? 'Preenchida' : 'Não preenchida')],
        ['Fotos', v => v.fotos],
        ['Observações', v => v.obs],
    ];
})();

// Busca no servidor. silencioso = chamada do intervalo automático: só redesenha se algo mudou e ninguém estiver digitando.
function veLoad(silencioso) {
    return (
        VEP ||
        (VEP = (async () => {
            try {
                const j = await api({ op: 'list' }, '/api/veiculos'),
                    sg = JSON.stringify(j);
                VE_FOTOS_OK = j.fotos_ok;
                if (sg === VEL) return;
                VE = j.veiculos;
                const vis = ['veic', 'vproc', 'home'].includes(tab);
                if (vis && silencioso && !livre()) return; // redesenha na próxima verificação, quando a tela estiver livre
                VEL = sg;
                if (vis) draw();
            } catch (e) {
                if (!silencioso) alert('Erro: ' + e.message);
            } finally {
                VEP = null;
            }
        })())
    );
}

// Tabela simples com barra proporcional (mesma marcação dos quadros da tela Gerenciais)
const veQuadro = (t, h, l, vazio) =>
    `<div class="cd"><h3>${t}</h3><div class="tw">${rgTab({ h, r: l, bar: 1, vazio })}</div></div>`;
// Contagem por campo, do maior para o menor
const veConta = (l, f) =>
    Object.entries(grupo(l, f))
        .map(([k, x]) => [k, x.length])
        .sort((a, b) => b[1] - a[1]);

// Tela Veículos: indicadores, quadros de gestão e lista com pesquisa e filtros
function veScr() {
    const v = veView(),
        dep = v.filter(x => !x.saida),
        ano = TS().slice(0, 4),
        n = s => dep.filter(x => x.situacao_doc == s).length,
        ni = dep.filter(x => !x.situacao_doc).length,
        sai = v.filter(x => x.saida && x.saida.startsWith(ano)).length;
    // Pendências de cadastro dos veículos no depósito; cada linha abre a lista já filtrada
    const pend = [
        ['Sem Lista de Verificação', dep.filter(x => !veVistOk(x)).length, { vist: 'Não preenchida' }],
        ['Sem fotos', dep.filter(x => !x.fotos).length, { temfoto: 'Sem fotos' }],
        ['Sem nº de processo', dep.filter(x => !x.processo_numero).length, { temproc: 'Sem processo' }],
        [
            'Processo ainda não cadastrado no Hub',
            dep.filter(x => x.processo_numero && !x.processo_id).length,
            { temproc: 'Processo não cadastrado no Hub' },
        ],
        ['Sem destinação informada', dep.filter(x => !x.destinacao).length, { dest: 'Não informada' }],
        ['Situação documental não informada', ni, { doc: 'Não informada' }],
    ];
    const cores = ['#1d4ed8', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#64748b'];
    const dest = veConta(dep, x => x.destinacao || 'Não informada').map((x, i) => [
        esc(x[0]),
        x[1],
        cores[i % cores.length],
    ]);
    const f = o => `veFiltra(${esc(JSON.stringify(o))})`;
    return (
        head(
            'Veículos',
            'Veículos no depósito: cadastro, fotos e Lista de Verificação',
            (adm() ? `<button class="btn" onclick="veImp()">${ic('up', 16)} Importar planilha</button> ` : '') +
                `<button class="btn p" onclick="veEd(0)">${ic('plus', 16)} Novo veículo</button>`
        ) +
        `<div class="kp">${kc('car', '', 'No depósito', dep.length, { c: '', h: '', t: v.length + ' cadastrado(s) no total' }, f({ deposito: 'No depósito' }))}${kc('ok', 'g', 'Regularizados', n('Regularizado'), { c: '', h: '', t: 'no depósito' }, f({ deposito: 'No depósito', doc: 'Regularizado' }))}${kc('clock', 'y', 'Em regularização', n('Em regularização'), { c: '', h: '', t: 'no depósito' }, f({ deposito: 'No depósito', doc: 'Em regularização' }))}${kc('warn', 'r', 'Não regularizados', n('Não regularizado'), { c: '', h: '', t: ni ? ni + ' sem situação informada' : 'no depósito' }, f({ deposito: 'No depósito', doc: 'Não regularizado' }))}${kc('swap', 'v', 'Saíram do depósito em ' + ano, sai, null, f({ deposito: 'Saiu do depósito' }))}</div>` +
        (VE.length
            ? `<div class="vg">
    <div class="cd"><h3>Destinação dos veículos no depósito</h3>${dep.length ? dn(dest) : '<p class="nt">Nenhum veículo no depósito.</p>'}</div>
    ${veQuadro(
        'Veículos no depósito por tipo',
        ['Tipo', 'Veículos'],
        veConta(dep, x => x.tipo || 'Não informado'),
        'Nenhum veículo no depósito.'
    )}
    <div class="cd"><h3>Pendências de cadastro</h3><p class="nt" style="margin:-4px 0 8px">Veículos no depósito. Clique para ver a lista.</p><div class="vpd">${pend.map(([t, q, o]) => `<button onclick="${f({ deposito: 'No depósito', ...o })}" ${q ? '' : 'disabled'}><span>${t}</span><b class="${q ? '' : 'z'}">${q}</b></button>`).join('')}</div></div>
    ${veQuadro('Órgãos com mais veículos no depósito', ['Órgão', 'Veículos'], veConta(dep, x => x.orgao || 'Não informado').slice(0, 8), 'Nenhum veículo no depósito.')}
    </div>`
            : '') +
        `<div class="cd">
            <div class="tb">
            <div class="sr">${ic('search')}<input value="${esc(VES.q)}" placeholder="Pesquisar por placa, tombo, modelo, chassi, RENAVAM, órgão, processo…" oninput="VES.q=this.value;VES.page=1;veList()"></div><button class="btn" onclick="VES.open=!VES.open;veList()">${ic('filter', 16)} Filtros <span class="cnt" id="fc"></span></button><button class="btn" onclick="veEx('x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="veEx('p')">${ic('pdf', 16)} PDF</button></div>
            <div id="fp">
            </div>
            <div id="res">
            </div>
            </div>`
    );
}
// Filtros automáticos, no mesmo padrão das telas de Atendimentos e Transferências
function veFp() {
    const b = veBusca(),
        f = VES.f,
        o = c => {
            const n = {};
            b.filter(x => veOk(x, f, c)).forEach(x => {
                if (x[c]) n[x[c]] = (n[x[c]] || 0) + 1;
            });
            if (f[c] && !n[f[c]]) n[f[c]] = 0;
            return Object.keys(n)
                .sort((x, y) => x.localeCompare(y, 'pt'))
                .map(v => [v, v + ' (' + n[v] + ')']);
        };
    return `<div class="fg">${VE_FD.map(
        ([c, l]) =>
            `<label>${l}<select onchange="veSF('${c}',this.value)"><option value="">Todos</option>${o(c)
                .map(([v, t]) => `<option value="${esc(v)}" ${f[c] == v ? 'selected' : ''}>${esc(t)}</option>`)
                .join('')}</select></label>`
    ).join('')}<button class="btn" onclick="VES.f={};VES.page=1;veList()">Limpar filtros</button></div>`;
}
// Aplica um filtro escolhido e redesenha a lista
const veSF = (c, v) => {
    VES.f[c] = v;
    VES.page = 1;
    veList();
};
// Aplica um conjunto de filtros pronto (usado pelos indicadores e pelas pendências de cadastro)
function veFiltra(f) {
    VES.f = f;
    VES.q = '';
    VES.page = 1;
    VES.open = true;
    if (tab != 'veic') go('veic');
    else draw();
    const r = $('#res');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// Redesenha só a tabela de veículos
function veList() {
    const el = $('#res');
    if (!el) return;
    const r = veRows(),
        n = r.length,
        P = Math.max(1, Math.ceil(n / VES.size));
    VES.page = Math.min(VES.page, P);
    const pg = r.slice((VES.page - 1) * VES.size, VES.page * VES.size);
    $('#fc').textContent = Object.values(VES.f).filter(Boolean).length || '';
    $('#fp').innerHTML = VES.open ? veFp() : '';
    el.innerHTML =
        `<div class="tw">
            <table>
            <thead>
            <tr>${VE_C.map(c => `<th${tal(c[0])}>${c[0]}</th>`).join('')}<th>Ações</th>
            </tr>
            </thead>
            <tbody>${pg
                .map(
                    v =>
                        `<tr onclick="veDet(${v.id})">${VE_C.map(c => `<td${tal(c[0])}>${c[2] ? c[2](v) : esc(c[1](v)) || '—'}</td>`).join('')}<td><button class="btn s" title="Detalhes" onclick="event.stopPropagation();veDet(${v.id})">${ic('eye', 15)}</button></td>
            </tr>`
                )
                .join('')}</tbody>
            </table>
            </div>` +
        (n
            ? ''
            : `<p class="nt" style="text-align:center;padding:24px">${VE.length ? 'Nenhum veículo encontrado com essa pesquisa e esses filtros.' : 'Nenhum veículo cadastrado ainda. Use o botão Novo veículo.'}</p>`) +
        `<div class="pgr"><span>${n ? (VES.page - 1) * VES.size + 1 : 0}–${Math.min(n, VES.page * VES.size)} de ${n}</span><select onchange="VES.size=+this.value;VES.page=1;veList()">${[25, 50, 100].map(x => `<option ${VES.size == x ? 'selected' : ''}>${x}</option>`).join('')}</select><button class="btn s" ${VES.page < 2 ? 'disabled' : ''} onclick="VES.page--;veList()">${ic('cl', 16)}</button><b>${VES.page}/${P}</b><button class="btn s" ${VES.page >= P ? 'disabled' : ''} onclick="VES.page++;veList()">${ic('cr', 16)}</button></div>`;
}
// Exporta a lista de veículos (com a pesquisa e os filtros da tela) em Excel ou PDF
const veEx = k =>
    xp(
        'Veículos',
        VE_X.map(c => c[0]),
        veRows().map(v => VE_X.map(c => c[1](v))),
        k,
        VES.q || Object.values(VES.f).some(Boolean) ? 'com a pesquisa e os filtros aplicados na tela' : ''
    );

// Janela de detalhe de um veículo: dados, fotos e Lista de Verificação
async function veDet(id) {
    let v = VE.find(x => x.id == id);
    if (!v) {
        await veLoad(1);
        v = VE.find(x => x.id == id);
    }
    if (!v) return;
    const f = (l, x) => `<div>${l}<b>${esc(x) || '—'}</b></div>`,
        vs = v.vistoria || {};
    $('#dd').innerHTML =
        `<h2><span>${esc(veNome(v))}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div class="dl">${f('Placa', vePlaca(v.placa))}${f('Tombo', v.tombo)}${f('Tipo', v.tipo)}${f('Modelo', v.modelo)}${f('Ano', v.ano)}${f('Órgão', v.orgao)}${f('Chassi', v.chassi)}${f('RENAVAM', v.renavam)}${f('Último licenciamento', v.ultimo_licenciamento)}<div>Situação documental<b>${veSit(v)}</b></div>${f('Destinação', v.destinacao)}<div>Depósito<b>${veDep(v)}</b></div>${f('Entrada no depósito', v.entrada ? fmt(v.entrada) : '')}<div>Processo<b>${v.processo_id ? `<a href="#" onclick="event.preventDefault();det(${v.processo_id})">${esc(v.processo_numero)}</a>${v.processo_tipo ? ' · ' + esc(v.processo_tipo) : ''}` : v.processo_numero ? `${esc(v.processo_numero)} <small class="nt">(não cadastrado no Hub)</small>` : '—'}</b></div>${v.obs ? `<div class="w">Observações<b style="white-space:pre-wrap">${esc(v.obs)}</b></div>` : ''}
            </div>
<h3 class="kt" style="margin:0 20px 8px">${ic('clip', 16)} Lista de Verificação</h3>
<div class="vst">${veVistOk(v) ? `Preenchida${vs.data ? ' (vistoria em ' + fmt(vs.data) + ')' : ''} por ${esc(vs.registrado_por || '—')}.` : 'Ainda não preenchida. A impressão sai com os dados do veículo e o restante em branco, para preencher à mão.'}<span class="sp"></span><button class="btn s" onclick="veVist(${v.id})">${ic('pen', 14)} ${veVistOk(v) ? 'Editar' : 'Preencher'}</button><button class="btn s" onclick="veImprimir(${v.id})">${ic('print', 14)} Imprimir</button></div>
<h3 class="kt" style="margin:14px 20px 8px">${ic('cam', 16)} Fotos do veículo</h3>
<div id="vf" class="vf"><p class="nt">Carregando fotos…</p></div>
<div class="ac"><button class="btn p" onclick="veEd(${v.id})">${ic('pen', 15)} Editar</button><span class="nt">Atualizado em ${esc(v.atualizado_em)}${v.criado_por_nome ? ' · cadastrado por ' + esc(v.criado_por_nome) : ''}</span><span class="sp"></span>${adm() ? `<button class="btn d" onclick="veRm(${v.id})">${ic('trash', 15)} Excluir</button>` : ''}</div>`;
    if (!$('#dd').open) $('#dd').showModal();
    veFotos(v.id);
}

// Carrega e mostra as fotos do veículo (Foto 1 - Frontal, Foto 2 - Traseira…) e o envio de novas fotos
async function veFotos(id) {
    const e = $('#vf');
    if (!e) return;
    const envio = VE_FOTOS_OK
        ? `<form class="vfe" onsubmit="event.preventDefault();veUp(${id})"><label>Parte do veículo<input id="vf_parte" list="dl_vp" maxlength="60" placeholder="Ex.: Frontal" required></label><label>Foto (JPG ou PNG)<input type="file" id="vf_arq" accept=".jpg,.jpeg,.png" multiple required></label><button class="btn p s" id="vf_env">${ic('up', 14)} Enviar</button><span class="nt" id="vf_st">Fotos grandes são reduzidas antes do envio. Com várias fotos de uma vez, todas recebem a mesma parte (dá para trocar depois).</span></form><datalist id="dl_vp">${VE_PARTES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`
        : '<p class="nt">O envio de fotos será liberado quando o armazenamento de anexos (Vercel Blob) for configurado na Vercel.</p>';
    let l = [];
    try {
        l = (await api({ op: 'fotos', id }, '/api/veiculos')).fotos;
    } catch (er) {
        e.innerHTML = '<p class="nt">Não foi possível carregar as fotos.</p>' + envio;
        return;
    }
    if (!$('#vf')) return;
    e.innerHTML =
        (l.length
            ? `<div class="vfg">${l
                  .map(
                      (x, i) =>
                          `<figure>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener"><img src="${esc(x.url)}" alt="Foto ${i + 1} - ${esc(x.parte)}" loading="lazy"></a>` : '<div class="vfx">Sem visualização</div>'}<figcaption><b>Foto ${i + 1} - ${esc(x.parte)}</b><small>${esc(x.enviado_por_nome)} · ${esc(x.enviado_em)}</small><span><button class="btn s" title="Trocar a parte do veículo" onclick="veParte(${x.id},${id},'${esc(x.parte).replace(/'/g, '&#39;')}')">${ic('pen', 13)}</button>${adm() || (ME && x.enviado_por == ME.id) ? `<button class="btn s d" title="Remover foto" onclick="veRmFoto(${x.id},${id})">${ic('trash', 13)}</button>` : ''}</span></figcaption></figure>`
                  )
                  .join('')}</div>`
            : '<p class="nt">Nenhuma foto enviada.</p>') + envio;
}
// Reduz a foto para no máximo 1920 px no maior lado (JPEG), para economizar armazenamento e abrir mais rápido
async function veReduz(f) {
    if (f.size < 900 * 1024 || typeof createImageBitmap != 'function') return f;
    try {
        const bm = await createImageBitmap(f),
            k = Math.min(1, 1920 / Math.max(bm.width, bm.height)),
            c = document.createElement('canvas');
        c.width = Math.round(bm.width * k);
        c.height = Math.round(bm.height * k);
        c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        const b = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.85));
        if (!b || b.size >= f.size) return f;
        return new File([b], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch (e) {
        return f;
    }
}
// Envia uma foto em 3 passos: o servidor libera o envio, o navegador envia ao armazenamento e o servidor confere
async function veEnviar(id, f, parte) {
    const ext = f.name.split('.').pop().toLowerCase(),
        tipo = ext == 'png' ? 'image/png' : 'image/jpeg';
    const j = await api({ op: 'foto_preparar', id, parte, nome: f.name, tipo, tamanho: f.size }, '/api/veiculos');
    const r = await fetch(j.url, { method: 'PUT', headers: j.headers, body: f }).catch(() => null);
    if (!r || !r.ok)
        throw new Error(
            'a foto não foi enviada ao armazenamento' + (r ? ` (código ${r.status})` : '. Verifique a conexão.')
        );
    await api({ op: 'foto_confirmar', foto_id: j.foto_id }, '/api/veiculos');
}
// Botão Enviar das fotos: confere os arquivos, reduz as grandes e envia uma por vez
async function veUp(id) {
    const fs = [...$('#vf_arq').files],
        parte = $('#vf_parte').value.trim(),
        bt = $('#vf_env'),
        st = () => $('#vf_st');
    if (parte.length < 2) return alert('Informe a parte do veículo mostrada na foto.');
    if (!fs.length) return alert('Escolha a foto.');
    const er = fs
        .filter(f => !/\.(jpe?g|png)$/i.test(f.name) || f.size > 25 * 1024 * 1024)
        .map(f => f.name + ': envie fotos JPG ou PNG de até 25 MB');
    if (er.length) return alert(er.join('\n'));
    bt.disabled = true;
    const erros = [];
    try {
        for (let i = 0; i < fs.length; i++) {
            if (st())
                st().textContent = `Enviando ${fs.length > 1 ? i + 1 + ' de ' + fs.length + ': ' : ''}${fs[i].name}…`;
            try {
                const f = await veReduz(fs[i]);
                if (f.size > 10 * 1024 * 1024) throw new Error('a foto passa de 10 MB mesmo depois de reduzida');
                await veEnviar(id, f, parte);
            } catch (e) {
                erros.push(fs[i].name + ': ' + e.message);
            }
        }
    } finally {
        bt.disabled = false;
    }
    await veLoad(1);
    veFotos(id);
    if (erros.length) alert('Não foi possível enviar:\n' + erros.join('\n'));
}
// Troca a parte do veículo informada numa foto
function veParte(fid, id, atual) {
    const p = prompt('Parte do veículo mostrada nesta foto:', atual);
    if (p == null || p.trim() == atual) return;
    run(async () => {
        await api({ op: 'foto_parte', foto_id: fid, parte: p.trim() }, '/api/veiculos');
        veFotos(id);
    });
}
// Remove uma foto (quem enviou ou o administrador)
function veRmFoto(fid, id) {
    if (confirm('Remover esta foto?'))
        run(async () => {
            await api({ op: 'foto_remover', foto_id: fid }, '/api/veiculos');
            await veLoad(1);
            veFotos(id);
        });
}

// Formulário de veículo (id 0 = novo veículo)
function veEd(id) {
    const v = id
        ? VE.find(x => x.id == id)
        : {
              id: 0,
              orgao: '',
              processo_numero: '',
              placa: '',
              tombo: '',
              tipo: '',
              modelo: '',
              ano: '',
              chassi: '',
              renavam: '',
              ultimo_licenciamento: '',
              destinacao: '',
              situacao_doc: '',
              entrada: '',
              saida: '',
              obs: '',
          };
    if (!v) return;
    const inp = (k, l, o = '') => `<label>${l}<input id="v_${k}" value="${esc(v[k] ?? '')}" ${o}></label>`,
        dl = (i, a) => `<datalist id="${i}">${a.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`,
        ano = +TS().slice(0, 4) + 1;
    $('#dd').innerHTML =
        `<h2><span>${id ? 'Editar veículo' : 'Novo veículo'}</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2><form class="fm" onsubmit="event.preventDefault();veSv(${v.id})">
<h3 class="kt w" style="margin:0">Identificação</h3>
${inp('placa', 'Placa', 'maxlength="8" placeholder="ABC1234 ou ABC1D23" style="text-transform:uppercase"')}${inp('tombo', 'Tombo', 'maxlength="50"')}
${inp('tipo', 'Tipo', 'list="dl_vt" maxlength="60" placeholder="Ex.: Automóvel"')}${inp('modelo', 'Modelo', 'maxlength="120" required placeholder="Ex.: Gol 1.0"')}
${inp('ano', 'Ano (fabricação/modelo)', 'maxlength="9" placeholder="Ex.: 2010/2011"')}${inp('chassi', 'Chassi', 'maxlength="30" style="text-transform:uppercase"')}
${inp('renavam', 'RENAVAM', 'maxlength="14" inputmode="numeric" placeholder="11 números"')}${inp('ultimo_licenciamento', 'Último licenciamento (ano)', `type="number" min="1900" max="${ano}" step="1"`)}
<h3 class="kt w" style="margin:8px 0 0">Origem e situação</h3>
${inp('orgao', 'Órgão', 'list="dl_vo" maxlength="200"')}${inp('processo_numero', 'Processo (opcional)', 'list="dl_vpr" maxlength="100" placeholder="Nº do processo"')}
<label>Situação documental<select id="v_situacao_doc"><option value="">Não informada</option>${VE_SIT.map(s => `<option ${v.situacao_doc == s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>${inp('destinacao', 'Destinação', 'list="dl_vd" maxlength="100"')}
${inp('entrada', 'Entrada no depósito (opcional)', `type="date" max="${TS()}"`)}${inp('saida', 'Saída do depósito', `type="date" max="${TS()}"`)}
<label class="w">Observações<textarea id="v_obs" rows="2" maxlength="2000">${esc(v.obs || '')}</textarea></label>
<p class="nt w" style="margin:0">Deixe a saída em branco enquanto o veículo estiver no depósito. Informe pelo menos um identificador: placa, chassi, RENAVAM ou tombo. Se o processo já estiver cadastrado no Hub, o vínculo é feito pelo número, mesmo que ele seja cadastrado depois.</p>
<div class="w" style="display:flex;gap:8px"><button class="btn p">${ic('ok', 15)} Salvar</button><button type="button" class="btn" onclick="${id ? `veDet(${id})` : `$('#dd').close()`}">Cancelar</button></div></form>
${dl('dl_vt', L.tipos_veiculo || VE_TIPOS_PAD)}${dl('dl_vd', L.destinacoes || VE_DEST_PAD)}${dl('dl_vo', L.orgaos)}${dl(
            'dl_vpr',
            D.map(r => r.numero)
        )}`;
    if (!$('#dd').open) $('#dd').showModal();
    $('#dd').scrollTop = 0;
}
// Botão Salvar do formulário: grava o veículo (o servidor valida placa, chassi, RENAVAM e repetidos)
function veSv(id) {
    const b = { id };
    [
        'placa',
        'tombo',
        'tipo',
        'modelo',
        'ano',
        'chassi',
        'renavam',
        'ultimo_licenciamento',
        'orgao',
        'processo_numero',
        'situacao_doc',
        'destinacao',
        'entrada',
        'saida',
        'obs',
    ].forEach(k => (b[k] = $('#v_' + k).value.trim()));
    umaVez(async () => {
        const j = await api({ op: 'save', item: b }, '/api/veiculos');
        await veLoad(1);
        veDet(j.id);
        if (tab == 'veic' || tab == 'vproc') draw();
    });
}
// Exclui um veículo, com as fotos (somente administrador)
function veRm(id) {
    if (confirm('Excluir este veículo, as fotos e a Lista de Verificação dele?'))
        run(async () => {
            await api({ op: 'del', id }, '/api/veiculos');
            $('#dd').close();
            await veLoad(1);
            if (tab == 'veic' || tab == 'vproc') draw();
        });
}

// Formulário da Lista de Verificação, no mesmo formato do modelo em papel
function veVist(id) {
    const v = VE.find(x => x.id == id);
    if (!v) return;
    const s = v.vistoria || {},
        it = s.itens || [],
        av = s.avarias || {},
        p = (k, x) => (s[k] || {})[x] || '',
        inp = (k, l, o = '') => `<label>${l}<input id="vs_${k}" value="${esc(s[k] || '')}" ${o}></label>`,
        pes = (k, t) =>
            `<label class="w">${t}: nome<input id="vs_${k}_nome" value="${esc(p(k, 'nome'))}" maxlength="120"></label><label>Cargo<input id="vs_${k}_cargo" value="${esc(p(k, 'cargo'))}" maxlength="80"></label><label>Matrícula<input id="vs_${k}_matricula" value="${esc(p(k, 'matricula'))}" maxlength="30"></label>`;
    const linha = (n, i) =>
        `<tr><td>${String(i + 1).padStart(2, '0')}. ${n}</td>${VE_MARCAS.map(([m, t]) => `<td><input type="radio" name="vi${i}" value="${m}" title="${t}" aria-label="${n}: ${t}" ${it[i] == m ? 'checked' : ''}></td>`).join('')}</tr>`;
    $('#dd').innerHTML =
        `<h2><span>Lista de Verificação · ${esc(veNome(v))}</span><button class="btn s" onclick="veDet(${id})">${ic('x', 15)}</button></h2><form class="fm" id="vsf" onsubmit="event.preventDefault();veVistSv(${id})">
<p class="nt w" style="margin:0">Órgão, modelo, ano, placa, chassi e RENAVAM vêm do cadastro do veículo.</p>
${inp('data', 'Data da vistoria', `type="date" max="${TS()}"`)}${inp('estado', 'Estado de conservação', 'list="dl_ve" maxlength="60"')}
${inp('marca', 'Marca', 'maxlength="60"')}${inp('categoria', 'Categoria', 'maxlength="60"')}
<label>Chaves entregues<select id="vs_chaves"><option value="">Não informado</option>${['Sim', 'Não'].map(x => `<option ${s.chaves == x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>${inp('combustivel', 'Combustível', 'list="dl_vc" maxlength="40"')}
<div class="w"><span class="lb">Itens</span> <button type="button" class="btn s" onclick="veVistTodos()">Marcar S nos itens sem marcação</button>
<div class="vit">${[0, 13]
            .map(
                o =>
                    `<table><thead><tr><th>Item</th>${VE_MARCAS.map(([m, t]) => `<th title="${t}">${m}</th>`).join('')}</tr></thead><tbody>${VE_ITENS.slice(
                        o,
                        o + 13
                    )
                        .map((n, j) => linha(n, o + j))
                        .join('')}</tbody></table>`
            )
            .join(
                ''
            )}</div><p class="nt" style="margin:4px 0 0">${VE_MARCAS.map(([m, t]) => `<b>${m}</b>: ${t}`).join(' · ')}</p></div>
<div class="w"><span class="lb">Avarias por vista do veículo</span><div class="vav"><img src="/img/vistoria-veiculo.png" alt="Vistas do veículo: lateral direita, frente, superior, traseira e lateral esquerda"><div>${VE_VISTAS.map(
            ([k, n]) =>
                `<div><b>${n}</b>${VE_AVARIAS.map(([a, t]) => `<label><input type="checkbox" data-v="${k}" value="${a}" ${(av[k] || '').includes(a) ? 'checked' : ''}> ${a} <small>${t}</small></label>`).join('')}</div>`
        ).join('')}</div></div></div>
<label class="w">Observações<textarea id="vs_obs" rows="3" maxlength="2000">${esc(s.obs || '')}</textarea></label>
<h3 class="kt w" style="margin:8px 0 0">Responsáveis</h3>
${pes('entrega', 'Responsável pela entrega')}${pes('vistoriador', 'Responsável pela vistoria')}
<div class="w" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p">${ic('ok', 15)} Salvar</button><button type="button" class="btn" onclick="veVistSv(${id},1)">${ic('print', 15)} Salvar e imprimir</button><button type="button" class="btn" onclick="veDet(${id})">Cancelar</button></div></form>
<datalist id="dl_ve">${['Bom', 'Regular', 'Ruim', 'Sucata'].map(x => `<option value="${x}">`).join('')}</datalist><datalist id="dl_vc">${['Vazio', '1/4', '1/2', '3/4', 'Cheio'].map(x => `<option value="${x}">`).join('')}</datalist>`;
    if (!$('#dd').open) $('#dd').showModal();
    $('#dd').scrollTop = 0;
}
// Marca S (sim, existe ou OK) nos itens ainda sem marcação
function veVistTodos() {
    VE_ITENS.forEach((n, i) => {
        if (!document.querySelector(`#vsf input[name="vi${i}"]:checked`))
            document.querySelector(`#vsf input[name="vi${i}"][value="S"]`).checked = true;
    });
}
// Grava a Lista de Verificação; imp = abrir a impressão depois de salvar
function veVistSv(id, imp) {
    const g = k => $('#vs_' + k).value.trim(),
        pes = k => ({ nome: g(k + '_nome'), cargo: g(k + '_cargo'), matricula: g(k + '_matricula') }),
        av = {};
    VE_VISTAS.forEach(([k]) => {
        av[k] = [...document.querySelectorAll(`#vsf input[data-v="${k}"]:checked`)].map(x => x.value).join('');
    });
    const vistoria = {
        data: g('data'),
        estado: g('estado'),
        marca: g('marca'),
        categoria: g('categoria'),
        chaves: g('chaves'),
        combustivel: g('combustivel'),
        itens: VE_ITENS.map((n, i) => (document.querySelector(`#vsf input[name="vi${i}"]:checked`) || {}).value || ''),
        avarias: av,
        obs: g('obs'),
        entrega: pes('entrega'),
        vistoriador: pes('vistoriador'),
    };
    umaVez(async () => {
        await api({ op: 'vistoria', id, vistoria }, '/api/veiculos');
        await veLoad(1);
        veDet(id);
        if (tab == 'veic') draw();
        if (imp) veImprimir(id);
    });
}

// Impressão da Lista de Verificação em A4, no mesmo modelo do documento em papel (com brasão, desenho e rodapé da SEAD)
function veImprimir(id) {
    const v = VE.find(x => x.id == id);
    if (!v) return;
    const s = v.vistoria || {},
        it = s.itens || [],
        av = s.avarias || {},
        p = (k, x) => esc((s[k] || {})[x] || ''),
        u = location.origin + '/img/',
        n = new Date(),
        c = (l, x, cs = 1) => `<td colspan="${cs}"><b>${l}:</b> ${esc(x ?? '')}</td>`,
        cx = m => (s.chaves == m ? 'X' : '&nbsp;&nbsp;');
    const tab_ = o =>
        `<table class="it"><thead><tr><th>ITEM</th>${VE_MARCAS.map(([m]) => `<th>${m}</th>`).join('')}</tr></thead><tbody>${VE_ITENS.slice(
            o,
            o + 13
        )
            .map(
                (x, j) =>
                    `<tr><td>${String(o + j + 1).padStart(2, '0')}. ${x}</td>${VE_MARCAS.map(([m]) => `<td class="m">${it[o + j] == m ? 'X' : ''}</td>`).join('')}</tr>`
            )
            .join('')}</tbody></table>`;
    const ass = (k, t) =>
        `<div class="as"><div class="ln">${p(k, 'nome') || '&nbsp;'}</div><div class="tt">${t}</div><table><tr><td><b>Cargo:</b> ${p(k, 'cargo')}</td><td><b>Matrícula:</b> ${p(k, 'matricula')}</td></tr></table></div>`;
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    const w = f.contentWindow;
    w.document.open();
    w.document
        .write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lista de Verificação ${esc(veNome(v))}</title><style>
@page{size:A4;margin:9mm 11mm}body{font:9.5px Arial,sans-serif;color:#000;margin:0}
.cab{display:block;width:100%;height:16mm;object-fit:contain;margin-bottom:1mm}h1{font-size:12.5px;text-align:center;margin:0 0 2mm}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #000;padding:1.3mm 1.6mm;text-align:left;vertical-align:middle}
.dados td{height:4mm}.its{display:flex;gap:3mm;margin-top:2.5mm}.it th{background:#fff;font-weight:bold}.it th:not(:first-child),.it td.m{width:5mm;text-align:center;font-weight:bold;padding:1mm 0}.it td{height:3.7mm;padding-top:.6mm;padding-bottom:.6mm}
.lg{text-align:center;margin:1.6mm 0;font-size:9px}.vs{border:1px solid #000;position:relative;height:60mm;display:flex;justify-content:center}.vs>div{position:relative;height:100%;aspect-ratio:986/676}.vs img{height:100%;display:block}
.mk{position:absolute;transform:translate(-50%,-50%);font-weight:bold;font-size:10.5px;background:#fff;padding:0 1.2mm;white-space:nowrap}.vs ul{position:absolute;right:3mm;top:2mm;margin:0;padding:0;list-style:none;font-size:10px;line-height:1.35}
.ob{border:1px solid #000;margin-top:2.5mm}.ob div{border-top:1px solid #000;min-height:4.6mm;padding:1mm 1.6mm;white-space:pre-wrap}.ob div:first-child{border:0}
.ass{display:flex;gap:10mm;margin-top:2.5mm}.as{flex:1;border:1px solid #000;padding-top:6mm}.as .ln{border-bottom:1px solid #000;margin:0 6mm;text-align:center;min-height:4mm}.as .tt{text-align:center;margin:1mm 0 1.5mm}.as table td{border-left:0;border-right:0;border-bottom:0}
.rod{display:block;width:100%;height:12mm;object-fit:contain;object-position:left;margin-top:2mm}.ger{font-size:7.5px;color:#555;text-align:right;margin-top:1mm}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
<img class="cab" src="${u}vistoria-cabecalho.png" alt="Governo do Amazonas">
<h1>LISTA DE VERIFICAÇÃO DE VEÍCULOS</h1>
<table class="dados"><tr>${c('ÓRGÃO', v.orgao, 2)}${c('EST. CONSERVAÇÃO', s.estado, 2)}</tr>
<tr>${c('MARCA', s.marca)}${c('MODELO/ANO', v.modelo + (v.ano ? ' / ' + v.ano : ''), 2)}${c('PLACA', vePlaca(v.placa))}</tr>
<tr>${c('CHASSI', v.chassi, 2)}${c('RENAVAM', v.renavam, 2)}</tr>
<tr>${c('CATEGORIA', s.categoria)}<td colspan="2"><b>CHAVES ENTREGUE:</b> SIM [ ${cx('Sim')} ] &nbsp; NÃO [ ${cx('Não')} ]</td>${c('COMBUSTÍVEL', s.combustivel)}</tr></table>
<div class="its">${tab_(0)}${tab_(13)}</div>
<p class="lg"><b>S</b>: SIM, EXISTE OU OK &nbsp; <b>N</b>: NÃO EXISTE &nbsp; <b>I</b>: INCOMPLETO &nbsp; <b>A</b>: AVARIADO</p>
<div class="vs"><div><img src="${u}vistoria-veiculo.png" alt="">${VE_VISTAS.map(([k, , x, y]) => (av[k] ? `<span class="mk" style="left:${x}%;top:${y}%">( ${av[k].split('').join(', ')} )</span>` : '')).join('')}</div><ul>${VE_AVARIAS.map(([a, t]) => `<li><b>${a}</b>: ${t}</li>`).join('')}</ul></div>
<div class="ob"><div><b>OBSERVAÇÕES:</b> ${esc(s.obs || '')}</div><div></div></div>
<div class="ass">${ass('entrega', 'Responsável pela entrega')}${ass('vistoriador', 'Responsável pela vistoria')}</div>
<img class="rod" src="${u}vistoria-rodape.png" alt="Secretaria de Administração e Gestão">
<div class="ger">Veículo nº ${v.id}${s.data ? ' · vistoria em ' + fmt(s.data) : ''} · emitido em ${fmt(TS())} às ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')} pelo Hub Patrimonial</div>
</body></html>`);
    w.document.close();
    // Espera as imagens carregarem antes de abrir a impressão
    const imgs = [...w.document.images].map(i => (i.complete ? null : new Promise(ok => (i.onload = i.onerror = ok))));
    Promise.all(imgs).then(() =>
        setTimeout(() => {
            w.focus();
            w.print();
            setTimeout(() => f.remove(), 3000);
        }, 200)
    );
}

// Importação da planilha de veículos (administrador). As colunas são reconhecidas pelo nome do cabeçalho, e cada ajuste
// aparece na prévia antes de gravar. O servidor valida de novo e ignora os veículos que já estão no Hub.
let VEI = null;
const VE_IMP_COL = {
    orgao: ['unidade', 'orgao', 'sigla', 'orgaosigla'],
    processo: ['processo', 'ndoprocesso', 'numerodoprocesso', 'processon'],
    placa: ['placa'],
    tombo: ['tombo', 'tombamento'],
    tipo: ['tipo', 'especie', 'tipodeveiculo'],
    modelo: ['modelo', 'marcamodelo'],
    ano: ['ano', 'anofabricacaomodelo', 'anofabmod', 'anofabricacao', 'anomodelo'],
    chassi: ['chassi'],
    renavam: ['renavam'],
    ultimo_licenciamento: ['ultimolicenciamento', 'licenciamento', 'anodolicenciamento'],
    destinacao: ['destinacao', 'destino'],
    situacao_doc: ['situacaodocumental'],
    obs: ['observacao', 'observacoes', 'obs'],
};
// Tipos escritos de formas diferentes na planilha e o tipo correspondente no Hub
const VE_IMP_TIPO = {
    automovel: 'Automóvel',
    pasautomovel: 'Automóvel',
    passeio: 'Automóvel',
    carro: 'Automóvel',
    caminhonete: 'Caminhonete',
    pickup: 'Caminhonete',
    picape: 'Caminhonete',
    camioneta: 'Camioneta',
    utilitario: 'Utilitário',
    caminhao: 'Caminhão',
    onibus: 'Ônibus',
    microonibus: 'Micro-ônibus',
    motocicleta: 'Motocicleta',
    moto: 'Motocicleta',
    motoneta: 'Motoneta',
};
// Dígito verificador do RENAVAM (11 números). Serve só de aviso na prévia.
const veRenavamOk = r => {
    const d = r.split('').map(Number),
        s = d
            .slice(0, 10)
            .reverse()
            .reduce((t, x, i) => t + x * [2, 3, 4, 5, 6, 7, 8, 9, 2, 3][i], 0),
        c = (s * 10) % 11;
    return (c == 10 ? 0 : c) == d[10];
};
// Importação: abre a janela
function veImp() {
    VEI = null;
    $('#dd').innerHTML =
        `<h2><span>Importar veículos</span><button class="btn s" onclick="$('#dd').close()">${ic('x', 15)}</button></h2>
            <div class="fm"><label class="w">Planilha (.xlsx)<input type="file" id="vi_f" accept=".xlsx,.xls" onchange="veImpLer()"></label><div class="w ib" id="vi_pv">A primeira aba deve ter um cabeçalho com as colunas UNIDADE (ou ÓRGÃO), PROCESSO, PLACA, TOMBO, TIPO, MODELO, ANO, CHASSI, RENAVAM, ÚLTIMO LICENCIAMENTO e DESTINAÇÃO, como na planilha de controle do depósito. Colunas SITUAÇÃO DOCUMENTAL e OBSERVAÇÕES também são lidas, se existirem. Nada é gravado antes de você conferir a prévia.</div>
            </div>
            <div class="ac"><button class="btn p" id="vi_go" disabled onclick="veImpGo()">${ic('up', 15)} Importar</button><button class="btn" onclick="$('#dd').close()">Cancelar</button></div>`;
    if (!$('#dd').open) $('#dd').showModal();
}
// Importação: lê a planilha e prepara cada linha
async function veImpLer() {
    const f = $('#vi_f').files[0];
    if (!f) return;
    try {
        const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }),
            m = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
        const hi = m.slice(0, 40).findIndex(r => r.map(nh).includes('modelo') && r.map(nh).includes('placa'));
        if (hi < 0) throw new Error('cabeçalho com as colunas PLACA e MODELO não encontrado');
        const h = m[hi].map(nh),
            ix = {};
        Object.entries(VE_IMP_COL).forEach(([c, ns]) => (ix[c] = h.findIndex(x => ns.includes(x))));
        const g = (r, c) => (ix[c] < 0 ? '' : r[ix[c]]),
            t = (r, c) => {
                const v = String(g(r, c) ?? '')
                    .replace(/\s+/g, ' ')
                    .trim();
                return /^([-–—.]+|n\/?a|s\/?tombo|sem tombo)$/i.test(v) ? '' : v;
            }; // "-", "N/A" e "S/TOMBO" contam como vazio
        const max = +TS().slice(0, 4) + 1,
            existe = {},
            vistos = {},
            tipos = {};
        const chaves = x =>
            [
                x.placa && 'p' + x.placa,
                x.chassi && 'c' + x.chassi,
                x.renavam && 'r' + x.renavam,
                x.tombo && 't' + x.tombo.toLowerCase(),
            ].filter(Boolean);
        VE.forEach(v =>
            chaves({ ...v, renavam: v.renavam && v.renavam.padStart(11, '0') }).forEach(k => (existe[k] = v))
        );
        VEI = {
            tipos,
            linhas: m
                .slice(hi + 1)
                .map((r, i) => [r, i + hi + 2])
                .filter(([r]) => ['placa', 'modelo', 'chassi', 'renavam'].some(c => t(r, c)))
                .map(([r, n]) => {
                    const x = { linha: n, erros: [], ajustes: [], avisos: [], obs: t(r, 'obs') };
                    x.orgao = t(r, 'orgao');
                    x.processo_numero = t(r, 'processo');
                    if (x.processo_numero.includes('_')) {
                        x.processo_numero = x.processo_numero.replace(/_/g, '/');
                        x.ajustes.push(`processo com "_" no lugar da barra: gravado como ${x.processo_numero}`);
                    }
                    x.placa = t(r, 'placa')
                        .toUpperCase()
                        .replace(/[^0-9A-Z]/g, '');
                    if (x.placa && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(x.placa))
                        x.erros.push(`placa "${t(r, 'placa')}" fora do formato ABC1234 ou ABC1D23`);
                    x.tombo = t(r, 'tombo');
                    const tp = t(r, 'tipo');
                    x.tipo = VE_IMP_TIPO[nh(tp)] || tp;
                    if (tp) tipos[tp + ' → ' + x.tipo] = (tipos[tp + ' → ' + x.tipo] || 0) + 1;
                    x.modelo = t(r, 'modelo');
                    if (x.modelo.length < 2) x.erros.push('modelo vazio');
                    x.ano = t(r, 'ano').replace(/\s/g, '');
                    const a = x.ano.match(/^(\d{4})(?:\/(\d{4}))?$/);
                    if (x.ano && (!a || +a[1] < 1900 || +a[1] > max || (a[2] && (+a[2] < +a[1] || +a[2] > +a[1] + 1))))
                        x.erros.push(`ano "${x.ano}" inválido`);
                    x.chassi = t(r, 'chassi')
                        .toUpperCase()
                        .replace(/[^0-9A-Z]/g, '');
                    if (x.chassi && x.chassi.length != 17)
                        x.avisos.push(`chassi com ${x.chassi.length} caracteres (o padrão é 17)`);
                    const rv = t(r, 'renavam'),
                        rd = rv.replace(/\D/g, '');
                    x.renavam = '';
                    if (rv && /[a-z]{3}/i.test(rv) && rd.length < 8) {
                        x.obs = (x.obs ? x.obs + '\n' : '') + `RENAVAM na planilha: ${rv}`;
                        x.ajustes.push(`RENAVAM "${rv}" não é um número: o texto foi para as observações`);
                    } else if (rd.length >= 8 && rd.length <= 11) {
                        x.renavam = rd.padStart(11, '0');
                        if (!veRenavamOk(x.renavam))
                            x.avisos.push(`dígito verificador do RENAVAM ${x.renavam} não confere`);
                    } else if (rv) x.erros.push(`RENAVAM "${rv}" inválido`);
                    x.ultimo_licenciamento = t(r, 'ultimo_licenciamento');
                    if (
                        x.ultimo_licenciamento &&
                        !(
                            /^\d{4}$/.test(x.ultimo_licenciamento) &&
                            +x.ultimo_licenciamento >= 1900 &&
                            +x.ultimo_licenciamento <= max
                        )
                    )
                        x.erros.push(`último licenciamento "${x.ultimo_licenciamento}" inválido`);
                    x.destinacao = t(r, 'destinacao');
                    const sd = t(r, 'situacao_doc');
                    x.situacao_doc = VE_SIT.find(s => nh(s) == nh(sd)) || '';
                    if (sd && !x.situacao_doc) x.erros.push(`situação documental "${sd}" não reconhecida`);
                    if (!x.placa && !x.chassi && !x.renavam && !x.tombo)
                        x.erros.push('sem placa, chassi, RENAVAM ou tombo');
                    const ks = chaves(x),
                        rep = ks.find(k => vistos[k]);
                    if (rep) x.erros.push(`mesmo identificador da linha ${vistos[rep]}`);
                    ks.forEach(k => (vistos[k] = vistos[k] || n));
                    const ja = ks.map(k => existe[k]).find(Boolean);
                    if (ja) x.ja = ja.id;
                    x.cadastrado = !!(x.processo_numero && D.some(p => nh(p.numero) == nh(x.processo_numero)));
                    return x;
                }),
        };
        if (!VEI.linhas.length) throw new Error('a planilha não tem veículos preenchidos');
    } catch (e) {
        VEI = null;
        $('#vi_go').disabled = true;
        $('#vi_pv').textContent = 'Não foi possível ler a planilha: ' + (e.message || 'arquivo inválido') + '.';
        return;
    }
    veImpPrev();
}
// Importação: mostra a prévia com erros, ajustes e avisos
function veImpPrev() {
    const l = VEI.linhas,
        er = l.filter(x => x.erros.length),
        aj = l.filter(x => x.ajustes.length),
        av = l.filter(x => x.avisos.length),
        ja = l.filter(x => x.ja),
        nv = l.filter(x => !x.ja),
        cp = nv.filter(x => x.cadastrado).length,
        np = nv.filter(x => x.processo_numero && !x.cadastrado).length,
        sp = nv.filter(x => !x.processo_numero).length,
        org = Object.entries(
            nv.reduce((o, x) => ((o[x.orgao || 'Não informado'] = (o[x.orgao || 'Não informado'] || 0) + 1), o), {})
        )
            .map(([k, n]) => `${esc(k)}: ${n}`)
            .join(' · ');
    const lista = (xs, f) =>
        `<div class="pl" style="max-height:170px;margin-top:6px;font-size:12.5px">${xs.map(x => `<div style="padding:4px 0;border-bottom:1px solid var(--bd)"><b>Linha ${x.linha}</b> (${esc(vePlaca(x.placa) || x.modelo)}): ${esc(f(x).join('; '))}</div>`).join('')}</div>`;
    $('#vi_pv').innerHTML =
        `<b>${l.length} veículo(s) na planilha</b>: ${nv.length} novo(s)${ja.length ? ` e ${ja.length} já cadastrado(s) no Hub, que serão ignorados` : ''}.` +
        (nv.length
            ? `<br><small>Órgão: ${org || '—'}<br>Processo: ${cp} com processo já cadastrado no Hub (vínculo automático), ${np} com processo ainda não cadastrado (o número fica gravado e o vínculo acontece quando o processo for cadastrado)${sp ? `, ${sp} sem processo` : ''}.<br>Tipo na planilha → tipo no Hub: ${Object.entries(
                  VEI.tipos
              )
                  .map(([k, n]) => `${esc(k)} (${n})`)
                  .join(' · ')}</small>`
            : '') +
        (er.length
            ? `<div style="margin-top:12px;color:var(--er)"><b>${er.length} linha(s) com erro.</b> Corrija na planilha e escolha o arquivo de novo. Nada será importado enquanto houver erro.${lista(er, x => x.erros)}</div>`
            : '') +
        (aj.length
            ? `<div style="margin-top:12px"><b>${aj.length} linha(s) serão ajustadas:</b>${lista(aj, x => x.ajustes)}</div>`
            : '') +
        (av.length
            ? `<div style="margin-top:12px"><b>${av.length} linha(s) com aviso</b> (são importadas assim mesmo; vale conferir no documento do veículo):${lista(av, x => x.avisos)}</div>`
            : '') +
        `<p class="nt" style="margin:12px 0 0">RENAVAM com menos de 11 números recebe zeros à esquerda. Todos entram como "no depósito", sem data de entrada${l.some(x => x.situacao_doc) ? '' : ' e com a situação documental "Não informada"'}. Os já cadastrados (mesma placa, chassi, RENAVAM ou tombo) são ignorados, então importar o mesmo arquivo de novo não duplica.</p>`;
    $('#vi_go').disabled = !!er.length || !nv.length;
    $('#vi_go').innerHTML = `${ic('up', 15)} Importar ${nv.length} veículo(s)`;
}
// Importação: envia os veículos novos ao servidor
function veImpGo() {
    const nv = VEI && VEI.linhas.filter(x => !x.ja);
    if (!nv || !nv.length || !confirm(`Importar ${nv.length} veículo(s)?`)) return;
    const itens = nv.map(x => {
        const o = { linha: x.linha };
        [
            'orgao',
            'processo_numero',
            'placa',
            'tombo',
            'tipo',
            'modelo',
            'ano',
            'chassi',
            'renavam',
            'ultimo_licenciamento',
            'destinacao',
            'situacao_doc',
            'obs',
        ].forEach(k => (o[k] = x[k]));
        return o;
    });
    umaVez(async () => {
        const j = await api({ op: 'importar', itens }, '/api/veiculos');
        $('#dd').close();
        VEI = null;
        await veLoad();
        alert(
            `${j.importados} veículo(s) importado(s).` +
                (j.ignorados ? ` ${j.ignorados} já estavam no Hub e foram ignorados.` : '')
        );
        draw();
    });
}

// Tela Processos (Gestão de Veículos): processos do tipo Veículo e processos informados no cadastro dos veículos
// (Transferência, Alienação ou ainda não cadastrados no Hub), com os veículos de cada um.
// Processo ainda não cadastrado no Hub aparece pelo número, agrupado sem pontuação.
const vpGrupos = () => {
    const g = {},
        vw = view();
    D.filter(r => r.tipo == VEICULO).forEach(r => (g[r.id] = []));
    VE.filter(v => v.processo_numero).forEach(v => {
        const k = v.processo_id || 'n' + nh(v.processo_numero);
        (g[k] = g[k] || []).push(v);
    });
    return Object.entries(g).map(([k, l]) => {
        const pid = k[0] == 'n' ? null : +k,
            r = (pid && vw.find(x => x.id == pid)) || {
                numero: l[0].processo_numero,
                tipo: l[0].processo_tipo || '',
                orgao: [...new Set(l.map(v => v.orgao).filter(Boolean))].join(', '),
                status: pid ? '' : 'Não cadastrado no Hub',
            };
        return { pid, r, l, dep: l.filter(v => !v.saida).length };
    });
};
// Abre a lista de veículos pesquisando um texto (usado nos processos não cadastrados no Hub)
function veProcura(q) {
    VES.q = q;
    VES.f = {};
    VES.page = 1;
    go('veic');
}
// Tipos mostrados no filtro da tela Processos (Gestão de Veículos)
const VP_TIPOS = ['Veículo', 'Transferência', 'Alienação', 'Não cadastrado no Hub'];
const vpTipo = x => (x.pid ? x.r.tipo : 'Não cadastrado no Hub');
function vpScr() {
    const g = vpGrupos(),
        pv = g.filter(x => x.r.tipo == VEICULO),
        sem = VE.filter(v => !v.processo_numero).length,
        nc = g.filter(x => !x.pid).length;
    return (
        head(
            'Processos de veículos',
            'Processos do tipo Veículo e processos informados no cadastro dos veículos',
            `<button class="btn p" onclick="edit(0, VEICULO)">${ic('plus', 16)} Novo processo de veículo</button>`
        ) +
        `<div class="kp">${kc('car', 'v', 'Processos do tipo Veículo', pv.length, { c: '', h: '', t: pv.filter(x => !done(x.r)).length + ' em aguardo' })}${kc('files', '', 'Processos com veículos vinculados', g.filter(x => x.l.length).length, nc ? { c: '', h: '', t: nc + ' ainda não cadastrado(s) no Hub' } : null)}${kc('ok', 'g', 'Veículos com processo', VE.length - sem)}${kc('warn', 'y', 'Veículos sem processo', sem, null, sem ? "veFiltra({temproc:'Sem processo'})" : '')}</div>` +
        `<div class="cd">
            <div class="tb">
            <div class="sr">${ic('search')}<input value="${esc(VPS.q)}" placeholder="Pesquisar por nº do processo, órgão, responsável, placa, modelo…" oninput="VPS.q=this.value;vpList()"></div><select aria-label="Tipo de processo" onchange="VPS.t=this.value;vpList()"><option value="">Todos os tipos</option>${VP_TIPOS.map(t => `<option ${VPS.t == t ? 'selected' : ''}>${t}</option>`).join('')}</select><button class="btn" onclick="vpEx('x')">${ic('xls', 16)} Excel</button><button class="btn" onclick="vpEx('p')">${ic('pdf', 16)} PDF</button></div>
            <div id="res">
            </div>
            </div>`
    );
}
// Colunas da tela Processos de veículos (a última, Veículos vinculados, vira links na tela)
const VP_C = [
    ['Nº do processo', x => x.r.numero],
    ['Tipo', x => x.r.tipo || ''],
    ['Órgão', x => x.r.orgao || ''],
    ['Data de Tramitação', x => (x.r.tram ? fmt(x.r.tram) : '')],
    ['Nº do ofício', x => (x.r.tipo == VEICULO ? x.r.doc || '' : '')],
    ['Status', x => x.r.status || ''],
    ['Responsável', x => x.r.resp || ''],
    ['Conclusão', x => (x.r.concl ? fmt(x.r.concl) : '')],
    ['Veículos', x => x.l.length],
    ['No depósito', x => x.dep],
    ['Veículos vinculados', x => x.l.map(veNome).join('; ')],
];
const vpRows = () => {
    const q = nz(VPS.q);
    return vpGrupos()
        .filter(x => !VPS.t || vpTipo(x) == VPS.t)
        .filter(
            x =>
                !q ||
                nz(
                    [
                        x.r.numero,
                        x.r.tipo,
                        x.r.orgao,
                        x.r.status,
                        x.r.resp,
                        x.r.doc,
                        x.r.descricao,
                        ...x.l.map(veNome),
                    ].join(' ')
                ).includes(q)
        )
        .sort((a, b) => b.l.length - a.l.length || String(b.r.tram || '').localeCompare(String(a.r.tram || '')));
};
// Redesenha só a tabela da tela Processos de veículos
function vpList() {
    const el = $('#res');
    if (!el) return;
    const r = vpRows(),
        n = VP_C.length - 1;
    el.innerHTML = r.length
        ? `<div class="tw"><table><thead><tr>${VP_C.map(c => `<th${tal(c[0])}>${c[0]}</th>`).join('')}</tr></thead><tbody>${r
              .map(
                  x =>
                      `<tr onclick="${x.pid ? `det(${x.pid})` : esc(`veProcura(${JSON.stringify(x.r.numero)})`)}">${VP_C.slice(
                          0,
                          n
                      )
                          .map(c => `<td${tal(c[0])}>${esc(c[1](x)) || '—'}</td>`)
                          .join(
                              ''
                          )}<td class="tl">${x.l.map(v => `<a href="#" onclick="event.preventDefault();event.stopPropagation();veDet(${v.id})">${esc(veNome(v))}</a>`).join('<br>') || '—'}</td></tr>`
              )
              .join('')}</tbody></table></div>`
        : `<p class="nt" style="text-align:center;padding:24px">${vpGrupos().length ? 'Nenhum processo encontrado com essa pesquisa e esse tipo.' : 'Nenhum processo de veículo ainda. Use o botão Novo processo de veículo, ou informe o processo no cadastro do veículo.'}</p>`;
}
const vpEx = k =>
    xp(
        'Processos de veículos',
        VP_C.map(c => c[0]),
        vpRows().map(x => VP_C.map(c => c[1](x))),
        k,
        VPS.q || VPS.t ? 'com a pesquisa e o filtro aplicados na tela' : ''
    );
