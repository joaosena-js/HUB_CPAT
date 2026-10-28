// Arquivos no Vercel Blob privado, usados pelos anexos do calendário e pelas fotos dos veículos.
// O navegador envia o arquivo direto ao Blob com um link assinado; o servidor confere o conteúdo antes de aceitar.

const { Erro } = require('./comum');

const ARQUIVOS = { 'application/pdf': ['pdf'], 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'] };
const MAXIMO = 10 * 1024 * 1024;

// Vercel Blob em modo privado. Na Vercel, ao conectar o Blob ao projeto, BLOB_STORE_ID (com OIDC) ou BLOB_READ_WRITE_TOKEN já vêm configurados.
const blobOk = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
function blob() {
    if (!blobOk())
        throw new Erro(
            'O armazenamento de anexos ainda não foi configurado na Vercel (Blob privado). Veja o ENTREGA.md.',
            503
        );
    return require('@vercel/blob');
}
// Confere o conteúdo real do arquivo pelos primeiros bytes, sem confiar no nome nem no tipo informado pelo navegador
function conteudoConfere(b, tipo) {
    if (tipo === 'application/pdf') return b.subarray(0, 1024).includes('%PDF-');
    if (tipo === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (tipo === 'image/png')
        return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    return false;
}
// Lê só os primeiros bytes de um arquivo enviado
async function primeirosBytes(stream, n = 1024) {
    const rd = stream.getReader();
    let b = Buffer.alloc(0);
    while (b.length < n) {
        const { done, value } = await rd.read();
        if (done) break;
        b = Buffer.concat([b, Buffer.from(value)]);
    }
    await rd.cancel().catch(() => {});
    return b;
}
// Link de envio (PUT) válido por 10 minutos para um caminho novo, com os mesmos cabeçalhos que o SDK oficial usa no navegador
async function linkEnvio(B, caminho, tipo) {
    const ate = Date.now() + 10 * 60e3;
    const token = await B.issueSignedToken({
        pathname: caminho,
        operations: ['put'],
        allowedContentTypes: [tipo],
        maximumSizeInBytes: MAXIMO,
        validUntil: ate,
    });
    const { presignedUrl } = await B.presignUrl(token, {
        operation: 'put',
        pathname: caminho,
        access: 'private',
        allowedContentTypes: [tipo],
        maximumSizeInBytes: MAXIMO,
        addRandomSuffix: false,
        allowOverwrite: false,
        validUntil: ate,
    });
    const headers = {
        'content-type': tipo,
        'x-content-type': tipo,
        'x-vercel-blob-access': 'private',
        'x-api-version': '13',
        'x-vercel-blob-store-id': B.parseStoreIdFromDelegationToken(token.delegationToken),
    };
    return { url: presignedUrl, headers };
}
// Confere o arquivo que chegou ao Blob: existe, tamanho e conteúdo batem com o tipo. Devolve o tamanho real ou a mensagem de erro.
async function conferirEnvio(B, caminho, tipo) {
    const r = await B.get(caminho, { access: 'private', useCache: false }).catch(() => null);
    if (!r || r.statusCode !== 200) return { erro: 'O arquivo não chegou ao armazenamento. Tente enviar de novo.' };
    const ini = await primeirosBytes(r.stream);
    if (r.blob.size > MAXIMO) return { erro: 'O arquivo deve ter no máximo 10 MB' };
    if (r.blob.contentType !== tipo || !conteudoConfere(ini, tipo))
        return { erro: 'O conteúdo do arquivo não corresponde ao tipo informado' };
    return { tamanho: r.blob.size };
}
// Link de leitura (GET) assinado, válido por alguns minutos
async function linkLeitura(B, caminho, minutos = 5) {
    const ate = Date.now() + minutos * 60e3;
    const token = await B.issueSignedToken({ pathname: caminho, operations: ['get'], validUntil: ate });
    const { presignedUrl } = await B.presignUrl(token, {
        operation: 'get',
        pathname: caminho,
        access: 'private',
        validUntil: ate,
    });
    return presignedUrl;
}

module.exports = {
    ARQUIVOS,
    MAXIMO,
    blobOk,
    blob,
    conteudoConfere,
    primeirosBytes,
    linkEnvio,
    conferirEnvio,
    linkLeitura,
};
