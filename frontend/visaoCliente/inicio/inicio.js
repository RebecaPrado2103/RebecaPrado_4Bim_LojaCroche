// Busca os produtos no servidor
async function carregarProdutos() {
    const listaProdutos = document.getElementById('lista-produtos');

    try {
        const resposta = await fetch('http://localhost:3001/api/produtos/destaques');

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar os produtos.');
        }

        const dados = await resposta.json();

        if (!dados.sucesso) {
            throw new Error(dados.mensagem);
        }

        listaProdutos.innerHTML = '';

        dados.produtos.forEach(produto => {

            // Cria o card do produto
            const card = document.createElement('div');
            card.classList.add('produto-card');

            // Espaço da imagem
            const imagem = document.createElement('div');
            imagem.classList.add('produto-imagem');

            // Foto do produto
            const foto = document.createElement('img');
            foto.src = `http://127.0.0.1:3001/imagens/produto/${produto.id_produto}.png`;
            foto.alt = produto.nome_produto;

            // Silhueta caso o produto não tenha foto
            foto.onerror = function () {
                this.onerror = null;
                this.src = 'http://127.0.0.1:3001/imagens/silhueta.png';
            };

            imagem.appendChild(foto);

            // Área das informações
            const informacoes = document.createElement('div');
            informacoes.classList.add('produto-informacoes');

            // Categoria
            const categoria = document.createElement('p');
            categoria.classList.add('produto-categoria');
            categoria.textContent = produto.categoria_produto;

            // Nome
            const nome = document.createElement('h3');
            nome.classList.add('produto-nome');
            nome.textContent = produto.nome_produto;

            // Preço
            const preco = document.createElement('p');
            preco.classList.add('produto-preco');
            preco.textContent = Number(
                produto.preco_unitario_produto
            ).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            // Botão para ver o produto
            const botao = document.createElement('a');
            botao.classList.add('produto-botao');
            botao.textContent = 'Ver produto';
            botao.href = `../detalhesProduto/index.html?id=${produto.id_produto}`;

            // Organiza as informações
            informacoes.appendChild(categoria);
            informacoes.appendChild(nome);
            informacoes.appendChild(preco);
            informacoes.appendChild(botao);

            // Monta o card completo
            card.appendChild(imagem);
            card.appendChild(informacoes);

            // Adiciona o card à página
            listaProdutos.appendChild(card);
        });

    } catch (error) {
        console.error('Erro:', error);

        listaProdutos.textContent =
            'Não foi possível carregar os produtos.';
    }
}

// Executa a função ao carregar a página
carregarProdutos();

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

// EVENTOS DOS BOTÕES
botaoAbrirCarrinho.addEventListener('click', abrirCarrinho);
botaoFecharCarrinho.addEventListener('click', fecharCarrinho);
botaoCancelar.addEventListener('click', fecharCarrinho);

// FECHAR AO CLICAR FORA DO CARRINHO
fundoCarrinho.addEventListener('click', fecharCarrinho);

// FECHAR AO PRESSIONAR ESC
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        fecharCarrinho();
    }
});

// LINK DO CARRINHO NO RODAPÉ
const linkCarrinhoRodape = document.getElementById('link-carrinho-rodape');

linkCarrinhoRodape.addEventListener('click', function (event) {
    event.preventDefault();
    abrirCarrinho();
});

// BARRA DE PESQUISA
const campoPesquisa = document.getElementById('campo-pesquisa');

campoPesquisa.addEventListener('keydown', function (event) {

    // Pesquisa ao pressionar Enter
    if (event.key === 'Enter') {

        const termoPesquisa = campoPesquisa.value.trim();

        if (termoPesquisa === '') {
            alert('Digite o nome de um produto para pesquisar.');
            return;
        }

        // Envia o termo para o catálogo
        window.location.href =
            `../produto/index.html?busca=${encodeURIComponent(termoPesquisa)}`;

    }

});

// ELEMENTOS DA CONTA
const linkLogin = document.getElementById('link-login');
const linkMinhaConta = document.getElementById('link-minha-conta');
const nomeCliente = document.getElementById('nome-cliente');
const botaoSair = document.getElementById('botao-sair');

// VERIFICAR SE O CLIENTE ESTÁ CONECTADO
async function verificarContaCliente() {
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/login/sessao',
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        // Cliente não conectado
        if (!resposta.ok || !dados.usuario?.ehCliente) {
            linkLogin.hidden = false;
            linkMinhaConta.hidden = true;
            botaoSair.hidden = true;
            return;
        }

        // Cliente conectado
        linkLogin.hidden = true;
        linkMinhaConta.hidden = false;
        botaoSair.hidden = false;

        nomeCliente.textContent = dados.usuario.nome;

    } catch (error) {
        console.error('Erro ao verificar a conta:', error);

        linkLogin.hidden = false;
        linkMinhaConta.hidden = true;
        botaoSair.hidden = true;
        console.log('Login oculto:', linkLogin.hidden);
        console.log('Display do login:', getComputedStyle(linkLogin).display);
    }
}

// ENCERRAR A SESSÃO
botaoSair.addEventListener('click', async function () {
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/login/sair',
            {
                method: 'POST',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || 'Não foi possível sair da conta.');
            return;
        }

        window.location.reload();

    } catch (error) {
        console.error('Erro ao sair da conta:', error);

        alert('Ocorreu um erro ao encerrar a sessão.');
    }
});

// VERIFICAR A CONTA AO ABRIR A PÁGINA
verificarContaCliente();


// =================================
// CARROSSEL DO BANNER
// =================================

const slidesBanner = document.querySelectorAll('.banner-slide');
const indicadoresBanner = document.querySelectorAll('.banner-indicador');
const botaoBannerAnterior = document.querySelector('.banner-anterior');
const botaoBannerProximo = document.querySelector('.banner-proximo');

let indiceBannerAtual = 0;
let intervaloBanner;

// MOSTRAR UMA IMAGEM
function mostrarBanner(indice) {

    slidesBanner[indiceBannerAtual].classList.remove('ativo');
    indicadoresBanner[indiceBannerAtual].classList.remove('ativo');

    indiceBannerAtual = indice;

    slidesBanner[indiceBannerAtual].classList.add('ativo');
    indicadoresBanner[indiceBannerAtual].classList.add('ativo');
}

// PRÓXIMA IMAGEM
function proximoBanner() {
    let proximoIndice = indiceBannerAtual + 1;

    if (proximoIndice >= slidesBanner.length) {
        proximoIndice = 0;
    }

    mostrarBanner(proximoIndice);
}

// IMAGEM ANTERIOR
function bannerAnterior() {
    let indiceAnterior = indiceBannerAtual - 1;

    if (indiceAnterior < 0) {
        indiceAnterior = slidesBanner.length - 1;
    }

    mostrarBanner(indiceAnterior);
}

// INICIAR TROCA AUTOMÁTICA
function iniciarCarrossel() {
    intervaloBanner = setInterval(proximoBanner, 5000);
}

// REINICIAR O TEMPO APÓS CLIQUE
function reiniciarCarrossel() {
    clearInterval(intervaloBanner);
    iniciarCarrossel();
}

// SETINHA PRÓXIMA
botaoBannerProximo.addEventListener('click', function () {
    proximoBanner();
    reiniciarCarrossel();
});

// SETINHA ANTERIOR
botaoBannerAnterior.addEventListener('click', function () {
    bannerAnterior();
    reiniciarCarrossel();
});

// CLICAR NOS INDICADORES
indicadoresBanner.forEach((indicador, indice) => {

    indicador.addEventListener('click', function () {
        mostrarBanner(indice);
        reiniciarCarrossel();
    });

});

// INICIAR O CARROSSEL
if (slidesBanner.length > 1) {
    iniciarCarrossel();
}