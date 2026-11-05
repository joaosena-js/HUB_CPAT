// API de veículos (/api/veiculos): veículos no depósito, vínculo com processo, fotos por parte do veículo,
// documentos do veículo (CRLV, DUT…) com anexos e Lista de Verificação de Veículo (vistoria). Qualquer usuário cadastra e altera; só o administrador exclui.

const crypto = require('crypto');
const {
    Erro,
    hoje,
    ehData,
    txt,
    iniciar,
    usuarioDaSessao,
    exigeTroca,
    semSessao,
    tratarErro,
} = require('../lib/comum');
const { ARQUIVOS, MAXIMO, blobOk, blob, linkEnvio, conferirEnvio, linkLeitura } = require('../lib/arquivos');

const SITUACOES_DOC = ['Regularizado', 'Em regularização', 'Não regularizado'];
const FOTOS = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'] };
const FOTOS_POR_VEICULO = 40;
// Documentos do veículo (v7.6): o código fica gravado; o nome aparece no log. A tela usa a mesma lista (VE_DOCS em js/veiculos.js).
const DOCUMENTOS = {
    crlv: 'CRLV',
    dut: 'DUT',
    ajuri: 'Relatório do AJURI',
    detran: 'Ficha do DETRAN',
    dnit: 'DNIT',
    immu: 'IMMU',
    prf: 'PRF',
    sefaz: 'SEFAZ',
};
const ANEXOS_POR_DOCUMENTO = 5;
// Situação documental (v7.9): calculada pela quantidade de documentos (função situacao_doc_auto no banco, ver lib/comum.js):
// todos os 8 = Regularizado, de 1 a 7 = Em regularização, nenhum = Não regularizado. Pode ser definida à mão e voltar ao automático.
// Lista de Verificação: 26 itens (S, N, I ou A), 5 vistas do desenho com avarias (A, R, Q ou F)
const ITENS = 26,
    MARCAS_ITEM = ['', 'S', 'N', 'I', 'A'],
    VISTAS = ['ld', 'fr', 'su', 'tr', 'le'],
    AVARIAS = 'ARQF';

// Normalização dos identificadores: placa e chassi em maiúsculas sem traço nem espaço
const soLetrasNumeros = v =>
    String(v ?? '')
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, '');

// Ano de fabricação e modelo, como no documento do veículo: 2010 ou 2010/2011
function anoFabModelo(v) {
    const s = String(v ?? '').replace(/\s/g, '');
    if (!s) return '';
    const m = s.match(/^(\d{4})(?:\/(\d{4}))?$/),
        max = +hoje().slice(0, 4) + 1;
    if (!m || +m[1] < 1900 || +m[1] > max || (m[2] && (+m[2] < +m[1] || +m[2] > +m[1] + 1)))
        throw new Erro('Ano inválido. Use o ano de fabricação (2010) ou fabricação/modelo (2010/2011)');
    return s;
}
// RENAVAM com 11 números. Os antigos, de 9, recebem zeros à esquerda (o Excel também costuma apagar esses zeros).
function renavam(v) {
    const d = String(v ?? '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length < 8 || d.length > 11) throw new Erro('RENAVAM inválido: deve ter até 11 números');
    return d.padStart(11, '0');
}

// Ano opcional dentro de uma faixa válida
function ano(v, nome) {
    if (v === '' || v == null) return null;
    const n = Number(v);
    const max = +hoje().slice(0, 4) + 1;
    if (!Number.isInteger(n) || n < 1900 || n > max) throw new Erro(`${nome} inválido`);
    return n;
}

// Confere e limpa um veículo recebido
function validar(item) {
    const v = {
        orgao: txt(item.orgao, 200, 'Órgão'),
        processo: txt(item.processo_numero, 100, 'Processo').replace(/\s+/g, ' '),
        placa: soLetrasNumeros(item.placa),
        tombo: txt(item.tombo, 50, 'Tombo'),
        tipo: txt(item.tipo, 60, 'Tipo'),
        modelo: txt(item.modelo, 120, 'Modelo'),
        ano: anoFabModelo(item.ano),
        chassi: soLetrasNumeros(item.chassi),
        renavam: renavam(item.renavam),
        ultimo_licenciamento: ano(item.ultimo_licenciamento, 'Ano do último licenciamento'),
        destinacao: txt(item.destinacao, 100, 'Destinação'),
        // Vazio = automática (calculada pelos documentos); preenchida = definida manualmente
        situacao_doc: String(item.situacao_doc || ''),
        entrada: String(item.entrada || ''),
        saida: String(item.saida || ''),
        obs: txt(item.obs, 2000, 'Observações'),
    };
    if (v.modelo.length < 2) throw new Erro('Informe o modelo');
    if (v.placa && !/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(v.placa))
        throw new Erro('Placa inválida. Use o formato ABC1234 ou ABC1D23');
    if (v.chassi && !/^[A-Z0-9]{5,30}$/.test(v.chassi)) throw new Erro('Chassi inválido');
    if (!v.placa && !v.chassi && !v.renavam && !v.tombo)
        throw new Erro('Informe pelo menos um identificador: placa, chassi, RENAVAM ou tombo');
    if (v.situacao_doc && !SITUACOES_DOC.includes(v.situacao_doc)) throw new Erro('Situação documental inválida');
    v.situacao_doc_manual = !!v.situacao_doc;
    for (const [k, n] of [
        ['entrada', 'entrada no depósito'],
        ['saida', 'saída do depósito'],
    ]) {
        if (v[k] && !ehData(v[k])) throw new Erro(`Data de ${n} inválida`);
        if (v[k] && v[k] > hoje()) throw new Erro(`A data de ${n} não pode ser futura`);
    }
    if (v.entrada && v.saida && v.saida < v.entrada) throw new Erro('A saída não pode ser anterior à entrada');
    return v;
}

// Confere e limpa a Lista de Verificação recebida
function validarVistoria(x) {
    x = x || {};
    const pessoa = (p, nome) => ({
        nome: txt(p?.nome, 120, 'Nome do ' + nome),
        cargo: txt(p?.cargo, 80, 'Cargo do ' + nome),
        matricula: txt(p?.matricula, 30, 'Matrícula do ' + nome),
    });
    const itens = Array.isArray(x.itens) ? x.itens.slice(0, ITENS).map(String) : [];
    while (itens.length < ITENS) itens.push('');
    if (itens.some(m => !MARCAS_ITEM.includes(m))) throw new Erro('Marcação inválida nos itens da lista');
    const avarias = {};
    VISTAS.forEach(k => {
        avarias[k] = [...new Set(String(x.avarias?.[k] || '').toUpperCase())].filter(c => AVARIAS.includes(c)).join('');
    });
    const d = {
        data: String(x.data || ''),
        estado: txt(x.estado, 60, 'Estado de conservação'),
        marca: txt(x.marca, 60, 'Marca'),
        categoria: txt(x.categoria, 60, 'Categoria'),
        chaves: ['Sim', 'Não'].includes(x.chaves) ? x.chaves : '',
        combustivel: txt(x.combustivel, 40, 'Combustível'),
        itens,
        avarias,
        obs: txt(x.obs, 2000, 'Observações'),
        entrega: pessoa(x.entrega, 'responsável pela entrega'),
        vistoriador: pessoa(x.vistoriador, 'responsável pela vistoria'),
    };
    if (d.data && (!ehData(d.data) || d.data > hoje())) throw new Erro('Data da vistoria inválida');
    return d;
}

// Consulta os veículos (id 0 = todos) com a quantidade de fotos e o processo do cadastro de processos com o mesmo número (sem pontuação)
const consultar = (
    sql,
    id
) => sql`select v.id, v.ordem, v.orgao, p.id as processo_id, v.processo as processo_numero, p.data->>'tipo' as processo_tipo, v.placa, v.tombo, v.tipo, v.modelo, v.ano, v.chassi, v.renavam, v.ultimo_licenciamento, v.destinacao, v.situacao_doc, v.situacao_doc_manual, situacao_doc_auto(v.documentos) as situacao_doc_calculada, v.obs,
    to_char(v.entrada, 'YYYY-MM-DD') as entrada, to_char(v.saida, 'YYYY-MM-DD') as saida, v.vistoria, v.documentos, c.nome as criado_por_nome, to_char(v.atualizado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as atualizado_em,
    (select count(*)::int
        from veiculo_fotos f
        where f.veiculo_id = v.id and f.confirmado) as fotos,
    (select coalesce(jsonb_object_agg(a.documento, a.n), '{}')
        from (select documento, count(*)::int as n
            from veiculo_documentos
            where veiculo_id = v.id and confirmado
            group by documento) a) as anexos
  from veiculos v
    left join lateral (select id, data
        from processos
        where v.processo <> '' and upper(regexp_replace(coalesce(data->>'numero', ''), '[^0-9A-Za-z]', '', 'g')) = upper(regexp_replace(v.processo, '[^0-9A-Za-z]', '', 'g'))
        order by id
        limit 1) p on true
    left join usuarios c on c.id = v.criado_por
  where ${id}::int = 0 or v.id = ${id}::int
  order by v.id desc`;
// Recalcula a situação documental automática dos veículos informados (sem ids, de todos). Os definidos à mão não mudam.
const recalcularSituacao = (sql, ids) => sql`update veiculos set situacao_doc = situacao_doc_auto(documentos)
    where not situacao_doc_manual and (${ids || null}::int[] is null or id = any(${ids || null}::int[]))
        and situacao_doc is distinct from situacao_doc_auto(documentos)
    returning id, situacao_doc`;
// Texto para o log quando a situação automática muda junto com um documento
const mudouSituacao = async (sql, v) => {
    const r = (await recalcularSituacao(sql, [v.id]))[0];
    return r ? `; situação documental: ${v.situacao_doc || 'não informada'} → ${r.situacao_doc}` : '';
};
const rotulo = v =>
    `#${v.id} ${v.modelo}${v.placa ? ' ' + v.placa : ''}${v.tombo ? ' tombo ' + v.tombo : ''}`.slice(0, 160);

// Ponto de entrada: a Vercel chama esta função a cada pedido. Cada "op" abaixo é uma operação.
module.exports = async (req, res) => {
    try {
        const ctx = await iniciar(req, res);
        if (!ctx) return;
        const { sql, b, registrar } = ctx;
        const me = await usuarioDaSessao(sql, req);
        if (!me) return semSessao(sql, res);
        if (exigeTroca(me, b, res)) return;
        const adm = me.perfil === 'admin';
        const veiculo = async id => {
            const v = (await consultar(sql, +id || 0))[0];
            if (!+id || !v) throw new Erro('Veículo não encontrado', 404);
            return v;
        };

        if (req.method === 'GET' || b.op === 'list') {
            return res.json({ veiculos: await consultar(sql, 0), fotos_ok: blobOk() });
        }

        if (b.op === 'save') {
            const item = b.item || {},
                id = +item.id || 0,
                v = validar(item);
            // Bloqueia cadastro repetido pela placa, chassi, RENAVAM ou tombo
            const dup = (
                await sql`select id, modelo, placa, chassi, renavam, tombo
                    from veiculos
                    where id <> ${id} and ((${v.placa} <> '' and placa = ${v.placa}) or (${v.chassi} <> '' and chassi = ${v.chassi})
        or (${v.renavam} <> '' and renavam = ${v.renavam}) or (${v.tombo} <> '' and lower(tombo) = lower(${v.tombo})))
                    limit 1`
            )[0];
            if (dup) {
                const c =
                    v.placa && dup.placa === v.placa
                        ? 'esta placa'
                        : v.chassi && dup.chassi === v.chassi
                          ? 'este chassi'
                          : v.renavam && dup.renavam === v.renavam
                            ? 'este RENAVAM'
                            : 'este tombo';
                throw new Erro(`Já existe um veículo cadastrado com ${c} (${dup.modelo}, nº ${dup.id}).`, 409);
            }
            let novo = id,
                antes = null;
            if (id) {
                antes = await veiculo(id);
                await sql`update veiculos set orgao = ${v.orgao}, processo = ${v.processo}, placa = ${v.placa}, tombo = ${v.tombo}, tipo = ${v.tipo}, modelo = ${v.modelo}, ano = ${v.ano}, chassi = ${v.chassi}, renavam = ${v.renavam},
          ultimo_licenciamento = ${v.ultimo_licenciamento}, destinacao = ${v.destinacao}, situacao_doc = ${v.situacao_doc}, situacao_doc_manual = ${v.situacao_doc_manual}, entrada = ${v.entrada || null}, saida = ${v.saida || null}, obs = ${v.obs}, atualizado_em = now()
                    where id = ${id}`;
            } else {
                novo = (
                    await sql`insert into veiculos(ordem, orgao, processo, placa, tombo, tipo, modelo, ano, chassi, renavam, ultimo_licenciamento, destinacao, situacao_doc, situacao_doc_manual, entrada, saida, obs, criado_por)
                        values ((select coalesce(max(ordem), 0) + 1 from veiculos), ${v.orgao}, ${v.processo}, ${v.placa}, ${v.tombo}, ${v.tipo}, ${v.modelo}, ${v.ano}, ${v.chassi}, ${v.renavam}, ${v.ultimo_licenciamento}, ${v.destinacao}, ${v.situacao_doc}, ${v.situacao_doc_manual}, ${v.entrada || null}, ${v.saida || null}, ${v.obs}, ${me.id})
                        returning id`
                )[0].id;
            }
            await recalcularSituacao(sql, [novo]);
            await registrar(me, id ? 'veiculo_alterado' : 'veiculo_criado', rotulo({ ...v, id: novo }));
            // Troca entre automática e manual (ou de valor manual) fica registrada à parte, para a auditoria
            if (v.situacao_doc_manual && (!antes || !antes.situacao_doc_manual || antes.situacao_doc !== v.situacao_doc))
                await registrar(me, 'situacao_doc_manual', `Situação documental definida manualmente como ${v.situacao_doc} no veículo ${rotulo({ ...v, id: novo })}`);
            else if (!v.situacao_doc_manual && antes && antes.situacao_doc_manual)
                await registrar(me, 'situacao_doc_automatica', `Situação documental voltou a ser automática (${antes.situacao_doc_calculada}) no veículo ${rotulo({ ...v, id: novo })}`);
            return res.json({ id: novo });
        }

        // Importação da planilha de veículos (administrador). Tudo ou nada: com qualquer linha inválida, nada é gravado.
        // Veículos que já estão no Hub (mesma placa, chassi, RENAVAM ou tombo) são ignorados, então importar de novo não duplica.
        if (b.op === 'importar') {
            if (!adm) throw new Erro('Somente o administrador pode importar veículos', 403);
            const itens = Array.isArray(b.itens) ? b.itens : [];
            if (!itens.length) throw new Erro('Nenhuma linha para importar');
            if (itens.length > 2000) throw new Erro('Importe no máximo 2.000 veículos por vez');
            const l = itens.map((x, i) => {
                try {
                    return { ...validar(x), linha: +x.linha || i + 2 };
                } catch (e) {
                    throw new Erro(`Linha ${+x.linha || i + 2}: ${e.message}`);
                }
            });
            const ids = v => [
                v.placa && 'p' + v.placa,
                v.chassi && 'c' + v.chassi,
                v.renavam && 'r' + v.renavam,
                v.tombo && 't' + v.tombo.toLowerCase(),
            ];
            const ja = new Set(),
                vistos = {};
            (await sql`select placa, chassi, renavam, tombo from veiculos`).forEach(v =>
                ids(v).forEach(k => k && ja.add(k))
            );
            const novos = l.filter(v => {
                const ks = ids(v).filter(Boolean);
                for (const k of ks)
                    if (vistos[k])
                        throw new Erro(`Linha ${v.linha}: mesmo identificador da linha ${vistos[k]} da planilha`);
                ks.forEach(k => (vistos[k] = v.linha));
                return !ks.some(k => ja.has(k));
            });
            if (novos.length) {
                const col = f => novos.map(f);
                // Nº de ordem automático: continua a sequência, na ordem das linhas da planilha
                await sql`insert into veiculos(ordem, orgao, processo, placa, tombo, tipo, modelo, ano, chassi, renavam, ultimo_licenciamento, destinacao, situacao_doc, situacao_doc_manual, entrada, saida, obs, criado_por)
                    select (select coalesce(max(ordem), 0) from veiculos) + x.n, x.orgao, x.processo, x.placa, x.tombo, x.tipo, x.modelo, x.ano, x.chassi, x.renavam, x.ultimo_licenciamento, x.destinacao, x.situacao_doc, x.situacao_doc <> '', x.entrada, x.saida, x.obs, ${me.id}::int
                        from unnest(${col(v => v.orgao)}::text[], ${col(v => v.processo)}::text[], ${col(v => v.placa)}::text[], ${col(v => v.tombo)}::text[], ${col(v => v.tipo)}::text[],
              ${col(v => v.modelo)}::text[], ${col(v => v.ano)}::text[], ${col(v => v.chassi)}::text[], ${col(v => v.renavam)}::text[], ${col(v => v.ultimo_licenciamento)}::int[],
              ${col(v => v.destinacao)}::text[], ${col(v => v.situacao_doc)}::text[], ${col(v => v.entrada || null)}::date[], ${col(v => v.saida || null)}::date[], ${col(v => v.obs)}::text[]) with ordinality as x(orgao, processo, placa, tombo, tipo, modelo, ano, chassi, renavam, ultimo_licenciamento, destinacao, situacao_doc, entrada, saida, obs, n)`;
                // Sem situação na planilha = automática (entram sem documentos, então "Não regularizado")
                await recalcularSituacao(sql, null);
            }
            await registrar(
                me,
                'veiculos_importados',
                `${novos.length} importado(s), ${l.length - novos.length} já cadastrado(s) ignorado(s)`
            );
            return res.json({ importados: novos.length, ignorados: l.length - novos.length });
        }

        if (b.op === 'vistoria') {
            const v = await veiculo(b.id),
                d = validarVistoria(b.vistoria);
            d.registrado_por = me.nome;
            d.registrado_em = hoje();
            await sql`update veiculos set vistoria = ${JSON.stringify(d)}::jsonb, atualizado_em = now() where id = ${v.id}`;
            await registrar(me, 'vistoria_veiculo', 'Lista de Verificação do veículo ' + rotulo(v));
            return res.json({ ok: 1 });
        }

        if (b.op === 'del') {
            if (!adm) throw new Erro('Somente o administrador pode excluir veículos', 403);
            const v = await veiculo(b.id);
            const arq = await sql`select caminho from veiculo_fotos where veiculo_id = ${v.id}`,
                docs = await sql`select caminho from veiculo_documentos where veiculo_id = ${v.id}`,
                tudo = [...arq, ...docs].map(x => x.caminho);
            if (tudo.length) await blob().del(tudo); // apaga fotos e documentos antes do registro, para não deixar arquivo sem dono
            await sql`delete from veiculos where id = ${v.id}`;
            await registrar(
                me,
                'veiculo_excluido',
                rotulo(v) + (arq.length ? ` com ${arq.length} foto(s)` : '') + (docs.length ? ` e ${docs.length} documento(s) anexado(s)` : '')
            );
            return res.json({ ok: 1 });
        }

        // Fotos do veículo, na ordem de envio (Foto 1, Foto 2…), com link de visualização válido por 15 minutos
        if (b.op === 'fotos') {
            const v = await veiculo(b.id);
            const f =
                await sql`select id, parte, nome, tipo, caminho, enviado_por, enviado_por_nome, to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as enviado_em
                    from veiculo_fotos
                    where veiculo_id = ${v.id} and confirmado
                    order by id`;
            const B = f.length && blobOk() ? blob() : null;
            const fotos = [];
            for (const x of f) {
                const { caminho, ...y } = x;
                fotos.push({ ...y, url: B ? await linkLeitura(B, caminho, 15) : '' });
            }
            return res.json({ fotos });
        }

        // Envio em 3 passos, como nos anexos do calendário: preparar (link de envio), enviar direto ao Blob, confirmar (conferência)
        if (b.op === 'foto_preparar') {
            const v = await veiculo(b.id);
            const parte = txt(b.parte, 60, 'Parte do veículo'),
                nome = txt(b.nome, 200, 'Nome do arquivo').replace(/[\u0000-\u001f]/g, ''),
                tipo = String(b.tipo || ''),
                tamanho = +b.tamanho || 0;
            const ext = (/\.([a-z0-9]+)$/i.exec(nome) || [])[1]?.toLowerCase();
            if (parte.length < 2) throw new Erro('Informe a parte do veículo mostrada na foto');
            if (!FOTOS[tipo] || !FOTOS[tipo].includes(ext)) throw new Erro('Envie somente fotos JPG ou PNG');
            if (tamanho < 1 || tamanho > MAXIMO) throw new Erro('A foto deve ter no máximo 10 MB');
            const n = await sql`select count(*)::int as n
                    from veiculo_fotos
                    where veiculo_id = ${v.id} and (confirmado or criado_em > now() - interval '1 hour')`;
            if (n[0].n >= FOTOS_POR_VEICULO) throw new Erro(`Limite de ${FOTOS_POR_VEICULO} fotos por veículo`);
            const B = blob();
            // Envios abandonados há mais de 1 hora: remove o arquivo (se chegou a ser enviado) e o registro
            const velhos = await sql`delete
                    from veiculo_fotos
                    where not confirmado and criado_em < now() - interval '1 hour'
                    returning caminho`;
            if (velhos.length) await B.del(velhos.map(x => x.caminho)).catch(() => {});
            const caminho = `veiculos/${v.id}/${crypto.randomBytes(12).toString('hex')}.${ext === 'jpeg' ? 'jpg' : ext}`;
            const envio = await linkEnvio(B, caminho, tipo);
            const f = (
                await sql`insert into veiculo_fotos(veiculo_id, parte, nome, tipo, tamanho, caminho, enviado_por, enviado_por_nome)
                    values (${v.id}, ${parte}, ${nome}, ${tipo}, ${tamanho}, ${caminho}, ${me.id}, ${me.nome})
                    returning id`
            )[0];
            return res.json({ foto_id: f.id, url: envio.url, headers: envio.headers });
        }

        if (b.op === 'foto_confirmar') {
            const f = (await sql`select * from veiculo_fotos where id = ${+b.foto_id || 0}`)[0];
            if (!f || f.confirmado || f.enviado_por !== me.id) throw new Erro('Envio não encontrado', 404);
            const B = blob(),
                r = await conferirEnvio(B, f.caminho, f.tipo);
            if (r.erro) {
                await B.del(f.caminho).catch(() => {});
                await sql`delete from veiculo_fotos where id = ${f.id}`;
                throw new Erro(r.erro);
            }
            await sql`update veiculo_fotos set confirmado = true, tamanho = ${r.tamanho} where id = ${f.id}`;
            await registrar(me, 'foto_veiculo_enviada', `${f.parte} no veículo #${f.veiculo_id}`);
            return res.json({ ok: 1 });
        }

        if (b.op === 'foto_parte') {
            const f = (await sql`select * from veiculo_fotos where id = ${+b.foto_id || 0} and confirmado`)[0];
            if (!f) throw new Erro('Foto não encontrada', 404);
            const parte = txt(b.parte, 60, 'Parte do veículo');
            if (parte.length < 2) throw new Erro('Informe a parte do veículo mostrada na foto');
            await sql`update veiculo_fotos set parte = ${parte} where id = ${f.id}`;
            return res.json({ ok: 1 });
        }

        if (b.op === 'foto_remover') {
            const f = (await sql`select * from veiculo_fotos where id = ${+b.foto_id || 0} and confirmado`)[0];
            if (!f) throw new Erro('Foto não encontrada', 404);
            if (!adm && f.enviado_por !== me.id)
                throw new Erro('Somente quem enviou a foto ou o administrador pode removê-la', 403);
            await blob().del(f.caminho);
            await sql`delete from veiculo_fotos where id = ${f.id}`;
            await registrar(me, 'foto_veiculo_removida', `${f.parte} do veículo #${f.veiculo_id}`);
            return res.json({ ok: 1 });
        }

        // Documentos do veículo (v7.6). "Possui" fica marcado em veiculos.documentos; cada documento aceita até 5 anexos
        // (PDF, JPG ou PNG). Anexar um arquivo marca o documento como possuído; para desmarcar, os anexos precisam ser removidos antes.
        const documento = d => {
            if (!DOCUMENTOS[d]) throw new Erro('Documento inválido');
            return d;
        };

        if (b.op === 'doc_marcar') {
            const v = await veiculo(b.id),
                d = documento(b.doc),
                tem = !!b.tem;
            if (!tem && (v.anexos || {})[d])
                throw new Erro(`Remova os arquivos anexados ao ${DOCUMENTOS[d]} antes de desmarcar o documento`);
            await sql`update veiculos set documentos = case when ${tem} then documentos || jsonb_build_object(${d}::text, true) else documentos - ${d}::text end, atualizado_em = now()
                where id = ${v.id}`;
            await registrar(me, tem ? 'documento_veiculo_marcado' : 'documento_veiculo_desmarcado', `${DOCUMENTOS[d]} no veículo ${rotulo(v)}${await mudouSituacao(sql, v)}`);
            return res.json({ ok: 1 });
        }

        // Anexos dos documentos, com link de visualização válido por 15 minutos
        if (b.op === 'docs') {
            const v = await veiculo(b.id);
            const l =
                await sql`select id, documento, nome, tipo, tamanho, caminho, enviado_por, enviado_por_nome, to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as enviado_em
                    from veiculo_documentos
                    where veiculo_id = ${v.id} and confirmado
                    order by id`;
            const B = l.length && blobOk() ? blob() : null;
            const docs = [];
            for (const x of l) {
                const { caminho, ...y } = x;
                docs.push({ ...y, url: B ? await linkLeitura(B, caminho, 15) : '' });
            }
            return res.json({ docs });
        }

        // Envio em 3 passos, como nas fotos: preparar (link de envio), enviar direto ao Blob, confirmar (conferência do conteúdo)
        if (b.op === 'doc_preparar') {
            const v = await veiculo(b.id),
                d = documento(b.doc);
            const nome = txt(b.nome, 200, 'Nome do arquivo').replace(/[\u0000-\u001f]/g, ''),
                tipo = String(b.tipo || ''),
                tamanho = +b.tamanho || 0;
            const ext = (/\.([a-z0-9]+)$/i.exec(nome) || [])[1]?.toLowerCase();
            if (!ARQUIVOS[tipo] || !ARQUIVOS[tipo].includes(ext)) throw new Erro('Envie o documento em PDF, JPG ou PNG');
            if (tamanho < 1 || tamanho > MAXIMO) throw new Erro('O arquivo deve ter no máximo 10 MB');
            const n = await sql`select count(*)::int as n
                    from veiculo_documentos
                    where veiculo_id = ${v.id} and documento = ${d} and (confirmado or criado_em > now() - interval '1 hour')`;
            if (n[0].n >= ANEXOS_POR_DOCUMENTO)
                throw new Erro(`Limite de ${ANEXOS_POR_DOCUMENTO} arquivos por documento. Remova um arquivo antes de enviar outro.`);
            const B = blob();
            // Envios abandonados há mais de 1 hora: remove o arquivo (se chegou a ser enviado) e o registro
            const velhos = await sql`delete
                    from veiculo_documentos
                    where not confirmado and criado_em < now() - interval '1 hour'
                    returning caminho`;
            if (velhos.length) await B.del(velhos.map(x => x.caminho)).catch(() => {});
            const caminho = `veiculos/${v.id}/documentos/${d}-${crypto.randomBytes(12).toString('hex')}.${ext === 'jpeg' ? 'jpg' : ext}`;
            const envio = await linkEnvio(B, caminho, tipo);
            const a = (
                await sql`insert into veiculo_documentos(veiculo_id, documento, nome, tipo, tamanho, caminho, enviado_por, enviado_por_nome)
                    values (${v.id}, ${d}, ${nome}, ${tipo}, ${tamanho}, ${caminho}, ${me.id}, ${me.nome})
                    returning id`
            )[0];
            return res.json({ anexo_id: a.id, url: envio.url, headers: envio.headers });
        }

        if (b.op === 'doc_confirmar') {
            const a = (await sql`select * from veiculo_documentos where id = ${+b.anexo_id || 0}`)[0];
            if (!a || a.confirmado || a.enviado_por !== me.id) throw new Erro('Envio não encontrado', 404);
            const B = blob(),
                r = await conferirEnvio(B, a.caminho, a.tipo);
            if (r.erro) {
                await B.del(a.caminho).catch(() => {});
                await sql`delete from veiculo_documentos where id = ${a.id}`;
                throw new Erro(r.erro);
            }
            await sql`update veiculo_documentos set confirmado = true, tamanho = ${r.tamanho} where id = ${a.id}`;
            // Documento anexado = documento que o veículo possui
            const v = (await sql`select id, situacao_doc from veiculos where id = ${a.veiculo_id}`)[0];
            await sql`update veiculos set documentos = documentos || jsonb_build_object(${a.documento}::text, true), atualizado_em = now()
                where id = ${a.veiculo_id}`;
            await registrar(me, 'documento_veiculo_enviado', `${DOCUMENTOS[a.documento] || a.documento} (${a.nome}) no veículo #${a.veiculo_id}${await mudouSituacao(sql, v)}`);
            return res.json({ ok: 1 });
        }

        if (b.op === 'doc_remover') {
            const a = (await sql`select * from veiculo_documentos where id = ${+b.anexo_id || 0} and confirmado`)[0];
            if (!a) throw new Erro('Arquivo não encontrado', 404);
            if (!adm && a.enviado_por !== me.id)
                throw new Erro('Somente quem enviou o arquivo ou o administrador pode removê-lo', 403);
            await blob().del(a.caminho);
            await sql`delete from veiculo_documentos where id = ${a.id}`;
            await registrar(me, 'documento_veiculo_removido', `${DOCUMENTOS[a.documento] || a.documento} (${a.nome}) do veículo #${a.veiculo_id}`);
            return res.json({ ok: 1 });
        }

        throw new Erro('Operação inválida');
    } catch (e) {
        tratarErro(res, e);
    }
};
