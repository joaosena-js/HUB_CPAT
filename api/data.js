const { Erro, hoje, ehData, txt, gerarHash, HASH_FALSO, confere, igual, emitir, encerrar, iniciar, usuarioDaSessao, semSessao, tratarErro } = require('../lib/comum');

const TIPOS = ['Transferência', 'Alienação', 'Caixa do setor'];
const CAMPOS = ['numero', 'descricao', 'tipo', 'tram', 'orgao', 'recebedor', 'destino', 'detalhe', 'itens', 'doc', 'datadoc', 'status', 'resp', 'setor', 'concl', 'mov', 'obs', 'bem'];
const DATAS = ['tram', 'datadoc', 'concl', 'mov'];
const LISTAS = ['status', 'resp', 'orgaos', 'motivos', 'assuntos'], LISTAS_OPCIONAIS = ['assuntos_at'];
const MAX_FALHAS = 5;
// Nº do processo comparado sem pontos, barras, traços e espaços: "001.2026/12" e "0012026 12" são o mesmo processo
const chave = n => String(n || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
const existentes = (sql, chaves, ignorarId = 0, ignorarTipos = []) => sql`select id, data->>'numero' as numero, data->>'tipo' as tipo, data->>'orgao' as orgao from processos
  where id <> ${ignorarId} and coalesce(data->>'tipo', '') <> all(${ignorarTipos}::text[]) and upper(regexp_replace(coalesce(data->>'numero', ''), '[^0-9A-Za-z]', '', 'g')) = any(${chaves}::text[]) order by id`;
const repetidosNoLote = items => { const v = new Set(), r = new Set(); items.forEach(d => { const k = chave(d.numero); v.has(k) ? r.add(d.numero) : v.add(k) }); return [...r] };
const lista = l => l.slice(0, 10).join(', ') + (l.length > 10 ? ` e mais ${l.length - 10}` : '');

function limparProcesso(item) {
  const d = {};
  for (const k of CAMPOS) {
    if (!(k in item)) continue;
    let v = item[k];
    if (k === 'itens') { d[k] = v === '' || v == null ? '' : Number.isFinite(+v) && +v >= 0 ? Math.round(+v) : ''; continue }
    v = txt(v, k === 'obs' || k === 'descricao' ? 4000 : 300, k);
    if (DATAS.includes(k) && v && !ehData(v)) throw new Erro(`Data inválida no campo ${k}`);
    d[k] = v;
  }
  return d;
}
function validarProcesso(d, exigeEntrada) {
  if (!chave(d.numero)) throw new Erro('Informe o nº do processo');
  if (!TIPOS.includes(d.tipo)) throw new Erro('Tipo de processo inválido');
  if (exigeEntrada && !d.tram) throw new Erro('Informe a data de entrada');
  return d;
}
function validarUsuario(b, novo) {
  const u = { nome: txt(b.nome, 100, 'Nome'), responsavel: txt(b.responsavel, 100, 'Responsável'), perfil: b.perfil === 'admin' ? 'admin' : 'servidor', ativo: b.ativo !== false };
  if (u.nome.length < 3) throw new Erro('Informe o nome completo');
  if (novo) { u.login = String(b.login || '').trim().toLowerCase(); if (!/^[a-z0-9._]{3,40}$/.test(u.login)) throw new Erro('O login deve ter de 3 a 40 caracteres: letras minúsculas, números, ponto ou sublinhado') }
  if (b.senha || novo) { if (String(b.senha || '').length < 8 || String(b.senha).length > 200) throw new Erro('A senha deve ter pelo menos 8 caracteres'); u.senha = String(b.senha) }
  return u;
}

module.exports = async (req, res) => {
  try {
    const ctx = await iniciar(req, res); if (!ctx) return;
    const { sql, b, registrar } = ctx;

    if (b.op === 'login') {
      const login = String(b.login || '').trim().toLowerCase(), senha = String(b.senha || '');
      const f = await sql`select count(*)::int n from log_atividades where acao = 'login_falha' and detalhe = ${login} and criado_em > now() - interval '15 minutes'`;
      if (f[0].n >= MAX_FALHAS) return res.status(429).json({ error: 'Muitas tentativas sem sucesso. Aguarde 15 minutos e tente novamente.' });
      const u = (await sql`select id, nome, versao, senha_hash from usuarios where login = ${login} and ativo`)[0];
      const ok = await confere(senha, u ? u.senha_hash : HASH_FALSO);
      if (!u || !ok) { await registrar(null, 'login_falha', login); return res.status(401).json({ error: 'Login ou senha inválidos' }) }
      await sql`update usuarios set ultimo_acesso = now() where id = ${u.id}`;
      await registrar(u, 'login');
      emitir(res, u); return res.json({ ok: 1 });
    }

    if (b.op === 'setup') {
      // Primeiro acesso: só funciona com o banco sem usuários e com a chave APP_PASSWORD já configurada na Vercel
      const n = await sql`select count(*)::int n from usuarios`;
      if (n[0].n > 0) throw new Erro('O sistema já possui usuários cadastrados', 403);
      if (!process.env.APP_PASSWORD || !igual(b.chave || '', process.env.APP_PASSWORD)) { await registrar(null, 'login_falha', 'configuração inicial'); throw new Erro('Chave de instalação inválida', 401) }
      const v = validarUsuario({ ...b, perfil: 'admin' }, true);
      const u = (await sql`insert into usuarios(login, nome, responsavel, perfil, senha_hash) values (${v.login}, ${v.nome}, ${v.responsavel}, 'admin', ${await gerarHash(v.senha)}) returning id, nome, versao`)[0];
      await registrar(u, 'setup', 'Administrador inicial: ' + v.login);
      emitir(res, u); return res.json({ ok: 1 });
    }

    const me = await usuarioDaSessao(sql, req);
    if (b.op === 'logout') { if (me) await registrar(me, 'logout'); encerrar(res); return res.json({ ok: 1 }) }
    if (!me) return semSessao(sql, res);
    const adm = me.perfil === 'admin';
    const soAdmin = () => { if (!adm) throw new Erro('Seu perfil não tem permissão para esta ação', 403) };

    if (req.method === 'GET') {
      const p = await sql`select id, data from processos order by id`;
      const l = await sql`select v from listas where k = 'main'`;
      return res.json({ processos: p.map(r => ({ ...r.data, id: r.id })), listas: l[0] ? l[0].v : null, me });
    }

    if (b.op === 'save') {
      const item = b.item || {}, id = +item.id || 0, d = limparProcesso(item);
      let antigo = null;
      if (id) { antigo = (await sql`select data from processos where id = ${id}`)[0]; if (!antigo) throw new Erro('Processo não encontrado', 404); antigo = antigo.data }
      const novo = validarProcesso({ ...(antigo || {}), ...d }, true);
      // Bloqueia nº repetido ao cadastrar ou ao trocar o número (repetições antigas não impedem editar outros campos)
      if (!antigo || chave(antigo.numero) !== chave(novo.numero)) {
        const x = (await existentes(sql, [chave(novo.numero)], id))[0];
        if (x) throw new Erro(`Já existe o processo nº ${x.numero} (${x.tipo || 'sem tipo'}${x.orgao ? ', ' + x.orgao : ''}). Abra o processo existente em vez de cadastrar de novo.`, 409);
      }
      let pid = id;
      if (id) await sql`update processos set data = ${JSON.stringify(novo)}::jsonb where id = ${id}`;
      else pid = (await sql`insert into processos(data) values (${JSON.stringify(novo)}::jsonb) returning id`)[0].id;
      // Histórico automático gerado no servidor, com o usuário da sessão (não depende do navegador)
      const ev = [];
      if (!antigo) ev.push('Processo cadastrado no sistema' + (novo.status ? ` com status "${novo.status}"` : ''));
      else {
        if ((antigo.status || '') !== (novo.status || '')) ev.push(String(novo.status).startsWith('CONCLU') ? 'Processo concluído' : `Status alterado de "${antigo.status || '—'}" para "${novo.status || '—'}"`);
        if ((antigo.resp || '') !== (novo.resp || '')) ev.push(`Responsável alterado de "${antigo.resp || '—'}" para "${novo.resp || '—'}"`);
        if ((antigo.setor || '') !== (novo.setor || '')) ev.push(`Setor atual alterado de "${antigo.setor || '—'}" para "${novo.setor || '—'}"`);
      }
      for (const e of ev) await sql`insert into historico(processo_id, data, descricao, automatico, usuario_id, usuario_nome) values (${pid}, ${hoje()}, ${e}, true, ${me.id}, ${me.nome})`;
      await registrar(me, id ? 'processo_alterado' : 'processo_criado', novo.numero);
      return res.json({ id: pid });
    }

    if (b.op === 'del') {
      soAdmin();
      const r = (await sql`delete from processos where id = ${+b.id || 0} returning data->>'numero' as numero`)[0];
      if (r) await registrar(me, 'processo_excluido', r.numero);
      return res.json({ ok: 1 });
    }

    if (b.op === 'bulk') {
      soAdmin();
      const items = (b.items || []).map(({ id, ...d }) => validarProcesso(limparProcesso(d)));
      const rep = repetidosNoLote(items);
      if (rep.length) throw new Erro(`Importação recusada: nº repetido na planilha (${lista(rep)}). Corrija e importe de novo.`, 409);
      await sql`delete from processos`;
      await sql`insert into processos(data) select value from jsonb_array_elements(${JSON.stringify(items)}::jsonb)`;
      await registrar(me, 'importacao', `Substituição completa: ${items.length} processo(s)`);
      return res.json({ ok: 1 });
    }

    if (b.op === 'merge') {
      soAdmin();
      const dels = (b.deltipos || []).filter(t => TIPOS.includes(t));
      const ups = (b.updates || []).map(u => ({ id: +u.id, data: validarProcesso(limparProcesso(u.data || {})) }));
      const news = (b.news || []).map(d => validarProcesso(limparProcesso(d)));
      const rep = repetidosNoLote(news);
      if (rep.length) throw new Erro(`Importação recusada: nº repetido na planilha (${lista(rep)}). Corrija e importe de novo.`, 409);
      const ja = news.length ? await existentes(sql, news.map(d => chave(d.numero)), 0, dels) : [];
      if (ja.length) throw new Erro(`Importação recusada: ${ja.length} nº já cadastrado(s) em outro processo (${lista([...new Set(ja.map(x => x.numero + ' - ' + x.tipo))])}). Nenhum dado foi alterado.`, 409);
      if (dels.length) await sql`delete from processos where data->>'tipo' in (select jsonb_array_elements_text(${JSON.stringify(dels)}::jsonb))`;
      if (ups.length) await sql`update processos p set data = v.data from jsonb_to_recordset(${JSON.stringify(ups)}::jsonb) as v(id int, data jsonb) where p.id = v.id`;
      if (news.length) await sql`insert into processos(data) select value from jsonb_array_elements(${JSON.stringify(news)}::jsonb)`;
      await registrar(me, 'importacao', `${news.length} novo(s), ${ups.length} atualizado(s)` + (dels.length ? `, substituindo ${dels.join(', ')}` : ''));
      return res.json({ ok: 1 });
    }

    if (b.op === 'listas') {
      const l = b.listas || {}, v = {};
      for (const k of [...LISTAS, ...LISTAS_OPCIONAIS]) { if (LISTAS_OPCIONAIS.includes(k) && l[k] == null) continue; if (!Array.isArray(l[k]) || l[k].length > 3000) throw new Erro('Lista inválida: ' + k); v[k] = l[k].map(x => txt(x, 200, 'Item da lista')).filter(Boolean) }
      if (l.cfg) { const a = +l.cfg.atencao, c = +l.cfg.critico; if (!(a > 0 && c > 0)) throw new Erro('Prazos de criticidade inválidos'); v.cfg = { atencao: Math.round(a), critico: Math.round(c) } }
      await sql`insert into listas(k, v) values ('main', ${JSON.stringify(v)}::jsonb) on conflict (k) do update set v = excluded.v`;
      await registrar(me, 'listas', 'Cadastros e parâmetros');
      return res.json({ ok: 1 });
    }

    if (b.op === 'hist_list') {
      const h = await sql`select id, to_char(data, 'YYYY-MM-DD') as data, descricao, automatico, usuario_nome, to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as registrado_em from historico where processo_id = ${+b.id || 0} order by data desc, id desc`;
      return res.json({ historico: h });
    }

    if (b.op === 'hist_add') {
      const id = +b.id || 0, data = String(b.data || ''), desc = txt(b.descricao, 2000, 'Descrição');
      // tolera um dia de diferença entre o relógio do computador e o fuso de Manaus
      if (!ehData(data) || data > hoje(864e5)) throw new Erro('Informe uma data válida, até hoje');
      if (desc.length < 3) throw new Erro('Descreva o que foi registrado');
      const p = (await sql`select data->>'numero' as numero from processos where id = ${id}`)[0];
      if (!p) throw new Erro('Processo não encontrado', 404);
      await sql`insert into historico(processo_id, data, descricao, usuario_id, usuario_nome) values (${id}, ${data}, ${desc}, ${me.id}, ${me.nome})`;
      await registrar(me, 'historico', p.numero);
      return res.json({ ok: 1 });
    }

    if (b.op === 'minha_senha') {
      const u = (await sql`select senha_hash from usuarios where id = ${me.id}`)[0];
      if (!(await confere(String(b.atual || ''), u.senha_hash))) throw new Erro('A senha atual não confere');
      const v = validarUsuario({ nome: me.nome, senha: b.nova }, false);
      if (!v.senha) throw new Erro('Informe a nova senha');
      const r = (await sql`update usuarios set senha_hash = ${await gerarHash(v.senha)}, versao = versao + 1 where id = ${me.id} returning id, versao`)[0];
      await registrar(me, 'senha_alterada', 'Pelo próprio usuário');
      emitir(res, r); return res.json({ ok: 1 });
    }

    if (b.op === 'usuarios') {
      soAdmin();
      const u = await sql`select id, login, nome, responsavel, perfil, ativo, to_char(ultimo_acesso at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as ultimo_acesso from usuarios order by nome`;
      return res.json({ usuarios: u });
    }

    if (b.op === 'usuario_salvar') {
      soAdmin();
      const id = +b.id || 0, v = validarUsuario(b, !id);
      if (id) {
        if (id === me.id && (!v.ativo || v.perfil !== 'admin')) throw new Erro('Você não pode desativar nem retirar o perfil de administrador da sua própria conta');
        const h = v.senha ? await gerarHash(v.senha) : null;
        // versao + 1 encerra as sessões abertas quando a senha muda, o perfil muda ou o usuário é desativado
        const r = await sql`update usuarios set nome = ${v.nome}, responsavel = ${v.responsavel}, perfil = ${v.perfil}, ativo = ${v.ativo}, senha_hash = coalesce(${h}::text, senha_hash), versao = versao + case when ${!!h}::boolean or perfil <> ${v.perfil} or ativo <> ${v.ativo}::boolean then 1 else 0 end where id = ${id} returning login`;
        if (!r[0]) throw new Erro('Usuário não encontrado', 404);
        await registrar(me, 'usuario_alterado', r[0].login + (h ? ' (senha redefinida)' : ''));
      } else {
        const ex = await sql`select 1 from usuarios where login = ${v.login}`;
        if (ex.length) throw new Erro('Já existe um usuário com esse login');
        await sql`insert into usuarios(login, nome, responsavel, perfil, ativo, senha_hash) values (${v.login}, ${v.nome}, ${v.responsavel}, ${v.perfil}, ${v.ativo}, ${await gerarHash(v.senha)})`;
        await registrar(me, 'usuario_criado', v.login);
      }
      return res.json({ ok: 1 });
    }

    if (b.op === 'log') {
      soAdmin();
      const uid = +b.u || null, de = ehData(b.de) ? b.de : null, ate = ehData(b.ate) ? b.ate : null;
      const l = await sql`select to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI:SS') as quando, usuario_nome, acao, detalhe, ip from log_atividades
        where (${uid}::int is null or usuario_id = ${uid}::int)
          and (${de}::date is null or criado_em >= (${de}::date::timestamp at time zone 'America/Manaus'))
          and (${ate}::date is null or criado_em < ((${ate}::date + 1)::timestamp at time zone 'America/Manaus'))
        order by id desc limit 1000`;
      return res.json({ log: l });
    }

    throw new Erro('Operação inválida');
  } catch (e) { tratarErro(res, e) }
};
