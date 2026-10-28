// Início: carregado por último, depois de todos os módulos
draw();
load().then(() => {
    atLoad(1);
    evLoad(1);
});
