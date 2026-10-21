const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Funções compartilhadas pelas APIs do Hub DBM: banco, sessão, senhas, validação e log
const SESSAO_HORAS = 12;

class Erro extends Error { constructor(m, s = 400) { super(m); this.s = s } }
const hoje = (mais = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' }).format(new Date(Date.now() + mais));
// Confere também se o dia existe no mês (o Date.parse aceita 30/02 e passa para março)
const ehData = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const txt = (v, max, nome) => { v = String(v ?? '').trim(); if (v.length > max) throw new Erro(`${nome} deve ter no máximo ${max} caracteres`); return v };

// Banco: cria as tabelas uma vez por instância (mesma ideia do código original, sem repetir a cada requisição)
let pronto = null;
function schema(sql) {
  return pronto || (pronto = (async () => {
    await sql`create table if not exists processos(id serial primary key, data jsonb not null)`;
    await sql`create table if not exists listas(k text primary key, v jsonb not null)`;
    await sql`create table if not exists usuarios(id serial primary key, login text not null unique, nome text not null, responsavel text not null default '', perfil text not null default 'servidor' check (perfil in ('admin', 'servidor')), senha_hash text not null, ativo boolean not null default true, versao int not null default 1, ultimo_acesso timestamptz, criado_em timestamptz not null default now())`;
    await sql`create table if not exists historico(id serial primary key, processo_id int not null references processos(id) on delete cascade, data date not null, descricao text not null, automatico boolean not null default false, usuario_id int references usuarios(id), usuario_nome text not null, criado_em timestamptz not null default now())`;
    await sql`create index if not exists historico_processo on historico(processo_id)`;
    await sql`create table if not exists log_atividades(id bigserial primary key, criado_em timestamptz not null default now(), usuario_id int references usuarios(id), usuario_nome text not null default '', acao text not null, detalhe text not null default '', ip text not null default '')`;
    await sql`create index if not exists log_atividades_data on log_atividades(criado_em desc)`;
    await sql`create table if not exists atendimentos(id serial primary key, data date not null, hora time, orgao text not null default '', solicitante text not null, contato text not null default '', categoria text not null, assunto text not null default '', descricao text not null, canal text not null, atendente_id int not null references usuarios(id), situacao text not null, data_finalizacao date, processo_id int references processos(id) on delete set null, criado_por int references usuarios(id), criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now())`;
    await sql`create index if not exists atendimentos_situacao on atendimentos(situacao, atendente_id)`;
    await sql`alter table historico alter column processo_id drop not null`;
    await sql`alter table historico add column if not exists atendimento_id int references atendimentos(id) on delete cascade`;
    await sql`create index if not exists historico_atendimento on historico(atendimento_id)`;
    await sql`create table if not exists eventos(id serial primary key, tipo text not null check (tipo in ('Reunião', 'Treinamento', 'Férias', 'Agenda do servidor')), titulo text not null, inicio date not null, fim date not null, hora_inicio time, hora_fim time, local text not null default '', pauta text not null default '', participantes_externos text not null default '', carga_horaria numeric(5,1), servidor_id int references usuarios(id), motivo text not null default '', cancelado boolean not null default false, criado_por int references usuarios(id), criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), check (fim >= inicio))`;
    await sql`create index if not exists eventos_periodo on eventos(inicio, fim)`;
    await sql`create table if not exists evento_participantes(evento_id int not null references eventos(id) on delete cascade, usuario_id int not null references usuarios(id), primary key (evento_id, usuario_id))`;
    await sql`create table if not exists evento_anexos(id serial primary key, evento_id int not null references eventos(id) on delete cascade, categoria text not null, nome text not null, tipo text not null, tamanho int not null, caminho text not null unique, confirmado boolean not null default false, enviado_por int references usuarios(id), enviado_por_nome text not null default '', criado_em timestamptz not null default now())`;
    await sql`create index if not exists evento_anexos_evento on evento_anexos(evento_id)`;
    // Novos tipos (feriado, outro evento, aniversário): só troca a regra do tipo quando ela ainda não inclui o tipo mais recente
    await sql`alter table eventos add column if not exists classificacao text not null default ''`;
    const ck = await sql`select pg_get_constraintdef(oid) as d from pg_constraint where conname = 'eventos_tipo_check'`;
    if (!ck[0] || !ck[0].d.includes('Aniversário')) {
      await sql`alter table eventos drop constraint if exists eventos_tipo_check`;
      await sql`alter table eventos add constraint eventos_tipo_check check (tipo in ('Reunião', 'Treinamento', 'Outro evento', 'Férias', 'Agenda do servidor', 'Feriado ou ponto facultativo', 'Aniversário'))`;
    }
  })().catch(e => { pronto = null; throw e }));
}

// Senhas: scrypt nativo do Node, com sal aleatório por usuário
const gerarHash = s => new Promise((ok, no) => { const sal = crypto.randomBytes(16); crypto.scrypt(s, sal, 64, (e, k) => e ? no(e) : ok(`scrypt$${sal.toString('hex')}$${k.toString('hex')}`)) });
const HASH_FALSO = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
const confere = (s, h) => new Promise(ok => { const [, sal, k] = String(h).split('$'); if (!sal || !k) return ok(false); crypto.scrypt(s, Buffer.from(sal, 'hex'), 64, (e, d) => ok(!e && crypto.timingSafeEqual(d, Buffer.from(k, 'hex')))) });
const igual = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y) };

// Sessão: token assinado (HMAC) em cookie HttpOnly. "versao" invalida tokens antigos quando a senha muda ou o usuário é desativado.
const assina = p => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(p).digest('base64url');
function emitir(res, u) {
  const p = Buffer.from(JSON.stringify({ u: u.id, v: u.versao, i: Date.now(), e: Date.now() + SESSAO_HORAS * 36e5 })).toString('base64url');
  res.setHeader('Set-Cookie', `hub_sessao=${p}.${assina(p)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSAO_HORAS * 3600}`);
}
const encerrar = res => res.setHeader('Set-Cookie', 'hub_sessao=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
function lerSessao(req) {
  const m = /(?:^|;\s*)hub_sessao=([^;]+)/.exec(req.headers.cookie || ''); if (!m) return null;
  const [p, s] = m[1].split('.'); if (!p || !s) return null;
  const a = Buffer.from(assina(p)), b = Buffer.from(s); if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.e > Date.now() ? o : null } catch (e) { return null }
}

// Preparação comum de toda requisição. Retorna null quando a resposta já foi enviada.
async function iniciar(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) { res.status(500).json({ error: 'Defina a variável SESSION_SECRET (mínimo 32 caracteres) na Vercel' }); return null }
  if (req.method !== 'GET' && req.method !== 'POST') { res.status(405).json({ error: 'Método não permitido' }); return null }
  // Cabeçalho próprio + cookie SameSite=Strict: impede que outro site dispare ações em nome do usuário (CSRF)
  if (req.method === 'POST' && req.headers['x-hub'] !== '1') { res.status(403).json({ error: 'Requisição recusada' }); return null }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const sql = neon(process.env.DATABASE_URL);
  await schema(sql);
  const b = req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})) : {};
  const registrar = (u, acao, detalhe = '') => sql`insert into log_atividades(usuario_id, usuario_nome, acao, detalhe, ip) values (${u ? u.id : null}, ${u ? u.nome : ''}, ${acao}, ${String(detalhe).slice(0, 500)}, ${ip})`;
  return { sql, b, ip, registrar };
}

// Usuário da sessão (ou null). A sessão só vale se o usuário continuar ativo e com a mesma versão.
async function usuarioDaSessao(sql, req) {
  const s = lerSessao(req);
  const me = s && (await sql`select id, login, nome, responsavel, perfil from usuarios where id = ${s.u} and versao = ${s.v} and ativo`)[0];
  return me ? { ...me, sessao: s.i } : null;
}

async function semSessao(sql, res) {
  const n = await sql`select count(*)::int n from usuarios`;
  encerrar(res); return res.status(401).json({ error: 'Sessão encerrada. Entre novamente.', setup: n[0].n === 0 });
}

function tratarErro(res, e) {
  if (e instanceof Erro) return res.status(e.s).json({ error: e.message });
  console.error(e);
  res.status(500).json({ error: 'Erro interno no servidor. Tente novamente.' });
}

module.exports = { Erro, hoje, ehData, txt, gerarHash, HASH_FALSO, confere, igual, emitir, encerrar, iniciar, usuarioDaSessao, semSessao, tratarErro };
