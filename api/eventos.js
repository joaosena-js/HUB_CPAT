const crypto = require('crypto');
const { Erro, ehData, txt, iniciar, usuarioDaSessao, semSessao, tratarErro } = require('../lib/comum');

const TIPOS = ['Reunião', 'Treinamento', 'Férias', 'Agenda do servidor'];
const PESSOAIS = ['Férias', 'Agenda do servidor'];
const ROTULOS = ['Ausente', 'Compromisso pessoal']; // o que a equipe vê na agenda do servidor
const CATEGORIAS = ['Foto', 'ATA', 'Lista de presença', 'Outro documento'];
const ARQUIVOS = { 'application/pdf': ['pdf'], 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'] };
const MAXIMO = 10 * 1024 * 1024, ANEXOS_POR_EVENTO = 30;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Vercel Blob em modo privado. Na Vercel, ao conectar o Blob ao projeto, BLOB_STORE_ID (com OIDC) ou BLOB_READ_WRITE_TOKEN já vêm configurados.
function blob() {
  if (!process.env.BLOB_STORE_ID && !process.env.BLOB_READ_WRITE_TOKEN) throw new Erro('O armazenamento de anexos ainda não foi configurado na Vercel (Blob privado). Veja o ENTREGA.md.', 503);
  return require('@vercel/blob');
}
// Confere o conteúdo real do arquivo pelos primeiros bytes, sem confiar no nome nem no tipo informado pelo navegador
function conteudoConfere(b, tipo) {
  if (tipo === 'application/pdf') return b.subarray(0, 1024).includes('%PDF-');
  if (tipo === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (tipo === 'image/png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}
async function primeirosBytes(stream, n = 1024) {
  const rd = stream.getReader(); let b = Buffer.alloc(0);
  while (b.length < n) { const { done, value } = await rd.read(); if (done) break; b = Buffer.concat([b, Buffer.from(value)]) }
  await rd.cancel().catch(() => { });
  return b;
}

const consultar = (sql, id) => sql`select e.id, e.tipo, e.titulo, to_char(e.inicio, 'YYYY-MM-DD') as inicio, to_char(e.fim, 'YYYY-MM-DD') as fim, to_char(e.hora_inicio, 'HH24:MI') as hora_inicio, to_char(e.hora_fim, 'HH24:MI') as hora_fim,
    e.local, e.pauta, e.participantes_externos, e.carga_horaria::float as carga_horaria, e.servidor_id, s.nome as servidor, e.motivo, e.cancelado, e.criado_por, c.nome as criado_por_nome,
    coalesce((select array_agg(p.usuario_id order by p.usuario_id) from evento_participantes p where p.evento_id = e.id), '{}') as participantes,
    coalesce((select json_object_agg(z.categoria, z.n) from (select categoria, count(*)::int as n from evento_anexos x where x.evento_id = e.id and x.confirmado group by categoria) z), '{}') as anexos
  from eventos e left join usuarios s on s.id = e.servidor_id left join usuarios c on c.id = e.criado_por
  where ${id}::int = 0 or e.id = ${id}::int
  order by e.inicio, e.hora_inicio nulls first, e.id`;

const podeEditar = (e, me) => me.perfil === 'admin' || e.criado_por === me.id || (PESSOAIS.includes(e.tipo) && e.servidor_id === me.id);
// Motivo da agenda do servidor: só o próprio servidor, quem lançou e o administrador veem
const veMotivo = (e, me) => me.perfil === 'admin' || e.servidor_id === me.id || e.criado_por === me.id;
const publico = (e, me) => e.tipo === 'Agenda do servidor' && !veMotivo(e, me) ? { ...e, motivo: '', reservado: true } : e;
const rotulo = e => `${e.tipo} #${e.id} ${e.tipo === 'Férias' ? e.servidor || '' : e.titulo}`.slice(0, 160);

function validar(item, me) {
  const tipo = String(item.tipo || ''); if (!TIPOS.includes(tipo)) throw new Erro('Tipo de evento inválido');
  const e = {
    tipo, titulo: txt(item.titulo, 200, 'Título'), inicio: String(item.inicio || ''), fim: String(item.fim || item.inicio || ''),
    hora_inicio: String(item.hora_inicio || ''), hora_fim: String(item.hora_fim || ''), local: txt(item.local, 300, 'Local'), pauta: txt(item.pauta, 4000, 'Pauta'),
    participantes_externos: txt(item.participantes_externos, 1000, 'Participantes externos'), carga_horaria: null, servidor_id: +item.servidor_id || null,
    motivo: txt(item.motivo, 500, 'Motivo'), cancelado: !!item.cancelado,
    participantes: [...new Set((Array.isArray(item.participantes) ? item.participantes : []).map(Number).filter(n => Number.isInteger(n) && n > 0))],
  };
  if (!ehData(e.inicio) || !ehData(e.fim)) throw new Erro('Informe datas válidas de início e fim');
  if (e.fim < e.inicio) throw new Erro('A data de fim não pode ser anterior à de início');
  if ((Date.parse(e.fim) - Date.parse(e.inicio)) / 864e5 > 366) throw new Erro('O período não pode passar de um ano');
  if ((e.hora_inicio && !HORA.test(e.hora_inicio)) || (e.hora_fim && !HORA.test(e.hora_fim))) throw new Erro('Hora inválida');
  if (e.hora_fim && !e.hora_inicio) throw new Erro('Informe a hora de início');
  if (e.hora_fim && e.inicio === e.fim && e.hora_fim <= e.hora_inicio) throw new Erro('A hora de fim deve ser depois da hora de início');
  if (e.participantes.length > 100) throw new Erro('Limite de 100 participantes');
  if (PESSOAIS.includes(tipo)) {
    if (!e.servidor_id) throw new Erro('Escolha o servidor');
    if (me.perfil !== 'admin' && e.servidor_id !== me.id) throw new Erro('Você só pode lançar férias e agenda para você mesmo', 403);
    Object.assign(e, { local: '', pauta: '', participantes_externos: '', participantes: [], cancelado: false });
    if (tipo === 'Férias') Object.assign(e, { titulo: 'Férias', hora_inicio: '', hora_fim: '', motivo: '' });
    else if (!ROTULOS.includes(e.titulo)) throw new Erro('Escolha como a equipe verá o compromisso');
  } else {
    if (e.titulo.length < 3) throw new Erro('Informe o título');
    Object.assign(e, { servidor_id: null, motivo: '' });
    if (tipo === 'Treinamento' && String(item.carga_horaria ?? '').trim() !== '') {
      const c = Number(String(item.carga_horaria).replace(',', '.'));
      if (!(c > 0 && c <= 999)) throw new Erro('Carga horária inválida'); e.carga_horaria = Math.round(c * 10) / 10;
    }
  }
  return e;
}

// Avisos que não impedem o salvamento: férias coincidentes e participantes fora do setor no período
async function avisos(sql, id, e) {
  const fora = PESSOAIS.includes(e.tipo) ? [] : e.participantes;
  const r = e.tipo === 'Férias'
    ? await sql`select s.nome, x.tipo, to_char(x.inicio, 'DD/MM/YYYY') as de, to_char(x.fim, 'DD/MM/YYYY') as ate from eventos x join usuarios s on s.id = x.servidor_id
        where x.tipo = 'Férias' and x.id <> ${id} and x.servidor_id <> ${e.servidor_id} and x.inicio <= ${e.fim} and x.fim >= ${e.inicio} order by x.inicio`
    : fora.length ? await sql`select s.nome, x.tipo, to_char(x.inicio, 'DD/MM/YYYY') as de, to_char(x.fim, 'DD/MM/YYYY') as ate from eventos x join usuarios s on s.id = x.servidor_id
        where x.tipo in ('Férias', 'Agenda do servidor') and x.servidor_id = any(${fora}::int[]) and x.inicio <= ${e.fim} and x.fim >= ${e.inicio} order by s.nome` : [];
  return r.map(x => e.tipo === 'Férias' ? `As férias coincidem com as de ${x.nome} (${x.de} a ${x.ate}).` : `${x.nome} estará ${x.tipo === 'Férias' ? 'de férias' : 'ausente'} de ${x.de} a ${x.ate}.`);
}

module.exports = async (req, res) => {
  try {
    const ctx = await iniciar(req, res); if (!ctx) return;
    const { sql, b, registrar } = ctx;
    const me = await usuarioDaSessao(sql, req);
    if (!me) return semSessao(sql, res);
    const evento = async id => { const e = (await consultar(sql, +id || 0))[0]; if (!+id || !e) throw new Erro('Evento não encontrado', 404); return e };
    const exigeEdicao = e => { if (!podeEditar(e, me)) throw new Erro('Somente quem lançou o evento ou o administrador pode alterá-lo', 403) };

    if (req.method === 'GET' || b.op === 'list') {
      const ev = (await consultar(sql, 0)).map(e => publico(e, me));
      const u = await sql`select id, nome from usuarios where ativo order by nome`;
      return res.json({ eventos: ev, usuarios: u, anexos_ok: !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) });
    }

    if (b.op === 'save') {
      const item = b.item || {}, id = +item.id || 0, e = validar(item, me);
      const ids = [...e.participantes, ...(e.servidor_id ? [e.servidor_id] : [])];
      const ok = ids.length ? await sql`select id from usuarios where id = any(${ids}::int[])` : [];
      if (ok.length !== ids.length) throw new Erro('Participante ou servidor não encontrado');
      let novo = id;
      if (id) {
        const old = await evento(id); exigeEdicao(old);
        if (PESSOAIS.includes(old.tipo) !== PESSOAIS.includes(e.tipo)) throw new Erro('Não é possível transformar férias ou agenda em reunião ou treinamento. Exclua e lance de novo.');
        await sql`update eventos set tipo = ${e.tipo}, titulo = ${e.titulo}, inicio = ${e.inicio}, fim = ${e.fim}, hora_inicio = ${e.hora_inicio || null}, hora_fim = ${e.hora_fim || null}, local = ${e.local}, pauta = ${e.pauta},
          participantes_externos = ${e.participantes_externos}, carga_horaria = ${e.carga_horaria}, servidor_id = ${e.servidor_id}, motivo = ${e.motivo}, cancelado = ${e.cancelado}, atualizado_em = now() where id = ${id}`;
        await sql`delete from evento_participantes where evento_id = ${id}`;
      } else {
        novo = (await sql`insert into eventos(tipo, titulo, inicio, fim, hora_inicio, hora_fim, local, pauta, participantes_externos, carga_horaria, servidor_id, motivo, cancelado, criado_por)
          values (${e.tipo}, ${e.titulo}, ${e.inicio}, ${e.fim}, ${e.hora_inicio || null}, ${e.hora_fim || null}, ${e.local}, ${e.pauta}, ${e.participantes_externos}, ${e.carga_horaria}, ${e.servidor_id}, ${e.motivo}, ${e.cancelado}, ${me.id}) returning id`)[0].id;
      }
      if (e.participantes.length) await sql`insert into evento_participantes(evento_id, usuario_id) select ${novo}, unnest(${e.participantes}::int[])`;
      const r = await evento(novo);
      await registrar(me, id ? 'evento_alterado' : 'evento_criado', rotulo(r) + (e.cancelado ? ' (cancelado)' : ''));
      return res.json({ id: novo, avisos: e.cancelado ? [] : await avisos(sql, novo, e) });
    }

    if (b.op === 'del') {
      const e = await evento(b.id); exigeEdicao(e);
      const arq = await sql`select caminho from evento_anexos where evento_id = ${e.id}`;
      if (arq.length) await blob().del(arq.map(x => x.caminho)); // apaga os arquivos antes do registro, para não deixar arquivo sem dono
      await sql`delete from eventos where id = ${e.id}`;
      await registrar(me, 'evento_excluido', rotulo(e) + (arq.length ? ` com ${arq.length} anexo(s)` : ''));
      return res.json({ ok: 1 });
    }

    if (b.op === 'anexos') {
      const e = await evento(b.id);
      const a = await sql`select id, categoria, nome, tipo, tamanho, enviado_por, enviado_por_nome, to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as enviado_em
        from evento_anexos where evento_id = ${e.id} and confirmado order by categoria, id`;
      return res.json({ anexos: a });
    }

    // Envio em 3 passos: (1) o servidor confere permissão, tipo e tamanho e devolve um link de envio válido por 10 minutos;
    // (2) o navegador envia o arquivo direto ao Blob; (3) o servidor confere o arquivo recebido e só então o anexo aparece.
    if (b.op === 'anexo_preparar') {
      const e = await evento(b.id); exigeEdicao(e);
      if (PESSOAIS.includes(e.tipo)) throw new Erro('Anexos são usados somente em reuniões e treinamentos');
      const categoria = String(b.categoria || ''), nome = txt(b.nome, 200, 'Nome do arquivo').replace(/[\u0000-\u001f]/g, ''), tipo = String(b.tipo || ''), tamanho = +b.tamanho || 0;
      const ext = (/\.([a-z0-9]+)$/i.exec(nome) || [])[1]?.toLowerCase();
      if (!CATEGORIAS.includes(categoria)) throw new Erro('Escolha o tipo do anexo');
      if (!ARQUIVOS[tipo] || !ARQUIVOS[tipo].includes(ext)) throw new Erro('Envie somente arquivos PDF, JPG ou PNG');
      if (tamanho < 1 || tamanho > MAXIMO) throw new Erro('O arquivo deve ter no máximo 10 MB');
      const n = await sql`select count(*)::int as n from evento_anexos where evento_id = ${e.id} and (confirmado or criado_em > now() - interval '1 hour')`;
      if (n[0].n >= ANEXOS_POR_EVENTO) throw new Erro(`Limite de ${ANEXOS_POR_EVENTO} anexos por evento`);
      const B = blob();
      // Envios abandonados há mais de 1 hora: remove o arquivo (se chegou a ser enviado) e o registro
      const velhos = await sql`delete from evento_anexos where not confirmado and criado_em < now() - interval '1 hour' returning caminho`;
      if (velhos.length) await B.del(velhos.map(x => x.caminho)).catch(() => { });
      const caminho = `eventos/${e.id}/${crypto.randomBytes(12).toString('hex')}.${ext === 'jpeg' ? 'jpg' : ext}`, ate = Date.now() + 10 * 60e3;
      const token = await B.issueSignedToken({ pathname: caminho, operations: ['put'], allowedContentTypes: [tipo], maximumSizeInBytes: MAXIMO, validUntil: ate });
      const { presignedUrl } = await B.presignUrl(token, { operation: 'put', pathname: caminho, access: 'private', allowedContentTypes: [tipo], maximumSizeInBytes: MAXIMO, addRandomSuffix: false, allowOverwrite: false, validUntil: ate });
      const a = (await sql`insert into evento_anexos(evento_id, categoria, nome, tipo, tamanho, caminho, enviado_por, enviado_por_nome) values (${e.id}, ${categoria}, ${nome}, ${tipo}, ${tamanho}, ${caminho}, ${me.id}, ${me.nome}) returning id`)[0];
      // Mesmos cabeçalhos que o SDK oficial usa no envio pelo navegador
      const cab = { 'content-type': tipo, 'x-content-type': tipo, 'x-vercel-blob-access': 'private', 'x-api-version': '13', 'x-vercel-blob-store-id': B.parseStoreIdFromDelegationToken(token.delegationToken) };
      return res.json({ anexo_id: a.id, url: presignedUrl, headers: cab });
    }

    if (b.op === 'anexo_confirmar') {
      const a = (await sql`select * from evento_anexos where id = ${+b.anexo_id || 0}`)[0];
      if (!a || a.confirmado || a.enviado_por !== me.id) throw new Erro('Envio não encontrado', 404);
      const B = blob(), falha = async m => { await B.del(a.caminho).catch(() => { }); await sql`delete from evento_anexos where id = ${a.id}`; throw new Erro(m) };
      const r = await B.get(a.caminho, { access: 'private', useCache: false }).catch(() => null);
      if (!r || r.statusCode !== 200) return await falha('O arquivo não chegou ao armazenamento. Tente enviar de novo.');
      const ini = await primeirosBytes(r.stream);
      if (r.blob.size > MAXIMO) return await falha('O arquivo deve ter no máximo 10 MB');
      if (r.blob.contentType !== a.tipo || !conteudoConfere(ini, a.tipo)) return await falha('O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido');
      await sql`update evento_anexos set confirmado = true, tamanho = ${r.blob.size} where id = ${a.id}`;
      await registrar(me, 'anexo_enviado', `${a.categoria} "${a.nome}" no evento #${a.evento_id}`);
      return res.json({ ok: 1 });
    }

    // Download: depois de conferir a sessão, devolve um link assinado que vale por 5 minutos
    if (b.op === 'anexo_abrir') {
      const a = (await sql`select * from evento_anexos where id = ${+b.anexo_id || 0} and confirmado`)[0];
      if (!a) throw new Erro('Anexo não encontrado', 404);
      const B = blob(), ate = Date.now() + 5 * 60e3;
      const token = await B.issueSignedToken({ pathname: a.caminho, operations: ['get'], validUntil: ate });
      const { presignedUrl } = await B.presignUrl(token, { operation: 'get', pathname: a.caminho, access: 'private', validUntil: ate });
      return res.json({ url: presignedUrl });
    }

    if (b.op === 'anexo_remover') {
      const a = (await sql`select * from evento_anexos where id = ${+b.anexo_id || 0} and confirmado`)[0];
      if (!a) throw new Erro('Anexo não encontrado', 404);
      const e = await evento(a.evento_id);
      if (!podeEditar(e, me) && a.enviado_por !== me.id) throw new Erro('Somente quem enviou o arquivo, quem lançou o evento ou o administrador pode removê-lo', 403);
      await blob().del(a.caminho);
      await sql`delete from evento_anexos where id = ${a.id}`;
      await registrar(me, 'anexo_removido', `${a.categoria} "${a.nome}" do evento #${a.evento_id}`);
      return res.json({ ok: 1 });
    }

    throw new Erro('Operação inválida');
  } catch (e) { tratarErro(res, e) }
};
