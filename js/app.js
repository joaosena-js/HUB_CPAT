// Início: carregado por último, depois de todos os módulos
draw();
// A tela de abertura (body.ini) só sai depois que a sessão foi confirmada e os dados chegaram
load()
    .finally(() => document.body.classList.remove('ini'))
    .then(() => {
        atLoad(1);
        evLoad(1);
    });
