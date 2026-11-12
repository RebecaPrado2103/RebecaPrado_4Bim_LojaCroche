// ELEMENTOS DO CARRINHO
const botaoAbrirCarrinho = document.getElementById('abrir-carrinho');
const botaoFecharCarrinho = document.getElementById('fechar-carrinho');
const carrinhoLateral = document.getElementById('carrinho-lateral');
const fundoCarrinho = document.getElementById('fundo-carrinho');
const botaoCancelar = document.querySelector('.botao-cancelar');

// ABRIR O CARRINHO
function abrirCarrinho() {
    carrinhoLateral.classList.add('aberto');
    fundoCarrinho.classList.add('aberto');
    document.body.style.overflow = 'hidden';
}

// FECHAR O CARRINHO
function fecharCarrinho() {
    carrinhoLateral.classList.remove('aberto');
    fundoCarrinho.classList.remove('aberto');
    document.body.style.overflow = '';
}

// EVENTOS
botaoAbrirCarrinho.addEventListener('click', abrirCarrinho);
botaoFecharCarrinho.addEventListener('click', fecharCarrinho);
botaoCancelar.addEventListener('click', fecharCarrinho);
fundoCarrinho.addEventListener('click', fecharCarrinho);

// FECHAR COM A TECLA ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharCarrinho();
    }
});