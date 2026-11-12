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
            imagem.textContent = 'Foto do produto';

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
            botao.href = '#';

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
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharCarrinho();
    }
});