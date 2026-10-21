const { Erro, hoje, ehData, txt, iniciar, usuarioDaSessao, semSessao, tratarErro } = require('../lib/comum');

const CANAIS = ['E-mail', 'WhatsApp', 'Presencial', 'Teams', 'Ligação'];
const CATEGORIAS = ['Orientação', 'Suporte operacional'];
const SITUACOES = ['Em atendimento', 'Aguardando análise interna', 'Aguardando retorno do solicitante', 'Finalizado'];
const FINALIZADO = 'Finalizado';

// Consulta dos atendimentos para a tela (datas já como texto, para não depender do fuso do navegador).
// filtro: 'todos', 'meus' (abertos do usuário) ou 'processo' (vinculados a um processo). Os valores vão sempre como parâmetros.
function consultar(sql, filtro, valor) {
  return sql`select a.id, to_char(a.data, 'YYYY-MM-DD') as data, to_char(a.hora, 'HH24:MI') as hora, a.orgao, a.solicitante, a.contato, a.categoria, a.assunto, a.descricao, a.canal,
      a.atendente_id, u.nome as atendente, a.situacao, to_char(a.data_finalizacao, 'YYYY-MM-DD') as data_finalizacao, a.processo_id, p.data->>'numero' as processo_numero
    from atendimentos a join usuarios u on u.id = a.atendente_id left join processos p on p.id = a.processo_id
    where (${filtro} = 'todos')
       or (${filtro} = 'meus' and a.atendente_id = ${valor}::int and a.situacao <> ${FINALIZADO})
       or (${filtro} = 'processo' and a.processo_id = ${valor}::int)
    order by a.data desc, a.hora desc nulls last, a.id desc`;
}

function validar(item) {
  const a = {
    data: String(item.data || ''), hora: String(item.hora || ''),
    orgao: txt(item.orgao, 200, 'Órgão'), solicitante: txt(item.solicitante, 150, 'Solicitante'), contato: txt(item.contato, 150, 'Contato'),
    categoria: String(item.categoria || ''), assunto: txt(item.assunto, 200, 'Assunto'), descricao: txt(item.descricao, 4000, 'Descrição'),
    canal: String(item.canal || ''), atendente_id: +item.atendente_id || 0, situacao: String(item.situacao || ''),
    data_finalizacao: String(item.data_finalizacao || ''), processo_numero: txt(item.processo_numero, 100, 'Processo vinculado'),
  };
  if (!ehData(a.data) || a.data > hoje(864e5)) throw new Erro('Informe uma data válida, até hoje');
  if (a.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.hora)) throw new Erro('Hora inválida');
  if (a.solicitante.length < 2) throw new Erro('Informe o solicitante');
  if (a.descricao.length < 3) throw new Erro('Descreva o atendimento');
  if (!CANAIS.includes(a.canal)) throw new Erro('Canal inválido');
  if (!CATEGORIAS.includes(a.categoria)) throw new Erro('Categoria inválida');
  if (!SITUACOES.includes(a.situacao)) throw new Erro('Situação inválida');
  if (a.situacao === FINALIZADO) {
    if (!ehData(a.data_finalizacao)) throw new Erro('Informe a data de finalização');
    if (a.data_finalizacao < a.data) throw new Erro('A data de finalização não pode ser anterior à data do atendimento');
  } else a.data_finalizacao = null; // reaberto ou ainda em andamento: sem data de finalização
  return a;
}

module.exports = async (req, res) => {
  try {
    const ctx = await iniciar(req, res); if (!ctx) return;
    const { sql, b, registrar } = ctx;
    const me = await usuarioDaSessao(sql, req);
    if (!me) return semSessao(sql, res);
    const adm = me.perfil === 'admin';
    const rotulo = r => `#${r.id} ${r.solicitante}`.slice(0, 120);
    const hist = (id, descricao) => sql`insert into historico(atendimento_id, data, descricao, automatico, usuario_id, usuario_nome) values (${id}, ${hoje()}, ${descricao}, true, ${me.id}, ${me.nome})`;

    if (req.method === 'GET' || b.op === 'list') {
      const a = await consultar(sql, 'todos', 0);
      const u = await sql`select id, nome from usuarios where ativo order by nome`;
      return res.json({ atendimentos: a, atendentes: u });
    }

    if (b.op === 'meus') {
      const a = (await consultar(sql, 'meus', me.id)).reverse();
      return res.json({ atendimentos: a });
    }

    if (b.op === 'do_processo') {
      const a = await consultar(sql, 'processo', +b.id || 0);
      return res.json({ atendimentos: a });
    }

    if (b.op === 'save') {
      const item = b.item || {}, id = +item.id || 0, a = validar(item);
      const at = (await sql`select id, nome from usuarios where id = ${a.atendente_id} and ativo`)[0];
      if (!at) throw new Erro('Escolha um atendente ativo');
      let pid = null;
      if (a.processo_numero) {
        const p = (await sql`select id from processos where data->>'numero' = ${a.processo_numero} order by id limit 1`)[0];
        if (!p) throw new Erro('Processo vinculado não encontrado. Confira o número.');
        pid = p.id;
      }
      if (id) {
        const old = (await sql`select a.*, u.nome as atendente from atendimentos a join usuarios u on u.id = a.atendente_id where a.id = ${id}`)[0];
        if (!old) throw new Erro('Atendimento não encontrado', 404);
        if (!adm && old.atendente_id !== me.id) throw new Erro('Somente o atendente responsável ou o administrador pode alterar este atendimento', 403);
        await sql`update atendimentos set data = ${a.data}, hora = ${a.hora || null}, orgao = ${a.orgao}, solicitante = ${a.solicitante}, contato = ${a.contato}, categoria = ${a.categoria}, assunto = ${a.assunto},
          descricao = ${a.descricao}, canal = ${a.canal}, atendente_id = ${a.atendente_id}, situacao = ${a.situacao}, data_finalizacao = ${a.data_finalizacao}, processo_id = ${pid}, atualizado_em = now() where id = ${id}`;
        if (old.situacao !== a.situacao) await hist(id, a.situacao === FINALIZADO ? 'Atendimento finalizado' : old.situacao === FINALIZADO ? `Atendimento reaberto como "${a.situacao}"` : `Situação alterada de "${old.situacao}" para "${a.situacao}"`);
        if (old.atendente_id !== a.atendente_id) await hist(id, `Atendimento transferido de ${old.atendente} para ${at.nome}`);
        if ((old.processo_id || null) !== pid) await hist(id, pid ? `Vinculado ao processo ${a.processo_numero}` : 'Vínculo com processo removido');
        await registrar(me, 'atendimento_alterado', rotulo({ id, ...a }));
        return res.json({ id });
      }
      const r = (await sql`insert into atendimentos(data, hora, orgao, solicitante, contato, categoria, assunto, descricao, canal, atendente_id, situacao, data_finalizacao, processo_id, criado_por)
        values (${a.data}, ${a.hora || null}, ${a.orgao}, ${a.solicitante}, ${a.contato}, ${a.categoria}, ${a.assunto}, ${a.descricao}, ${a.canal}, ${a.atendente_id}, ${a.situacao}, ${a.data_finalizacao}, ${pid}, ${me.id}) returning id`)[0];
      await hist(r.id, `Atendimento registrado com situação "${a.situacao}"` + (a.atendente_id !== me.id ? `, atribuído a ${at.nome}` : ''));
      await registrar(me, 'atendimento_criado', rotulo({ id: r.id, ...a }));
      return res.json({ id: r.id });
    }

    if (b.op === 'del') {
      if (!adm) throw new Erro('Seu perfil não tem permissão para esta ação', 403);
      const r = (await sql`delete from atendimentos where id = ${+b.id || 0} returning id, solicitante`)[0];
      if (r) await registrar(me, 'atendimento_excluido', rotulo(r));
      return res.json({ ok: 1 });
    }

    if (b.op === 'hist_list') {
      const h = await sql`select id, to_char(data, 'YYYY-MM-DD') as data, descricao, automatico, usuario_nome, to_char(criado_em at time zone 'America/Manaus', 'DD/MM/YYYY HH24:MI') as registrado_em from historico where atendimento_id = ${+b.id || 0} order by data desc, id desc`;
      return res.json({ historico: h });
    }

    if (b.op === 'hist_add') {
      const id = +b.id || 0, data = String(b.data || ''), desc = txt(b.descricao, 2000, 'Descrição');
      if (!ehData(data) || data > hoje(864e5)) throw new Erro('Informe uma data válida, até hoje');
      if (desc.length < 3) throw new Erro('Descreva o que foi registrado');
      const r = (await sql`select id, solicitante from atendimentos where id = ${id}`)[0];
      if (!r) throw new Erro('Atendimento não encontrado', 404);
      await sql`insert into historico(atendimento_id, data, descricao, usuario_id, usuario_nome) values (${id}, ${data}, ${desc}, ${me.id}, ${me.nome})`;
      await registrar(me, 'historico_atendimento', rotulo(r));
      return res.json({ ok: 1 });
    }

    throw new Erro('Operação inválida');
  } catch (e) { tratarErro(res, e) }
};
