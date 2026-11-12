// Guarda todos os produtos carregados do servidor
let produtos = [];

// Busca todos os produtos no servidor
async function carregarProdutos() {
    const listaProdutos = document.getElementById('lista-produtos');

    try {
        const resposta = await fetch('http://localhost:3001/api/produtos/listar');

        if (!resposta.ok) {
            throw new Error('Não foi possível buscar os produtos.');
        }

        const dados = await resposta.json();

        if (!dados.sucesso) {
            throw new Error(dados.mensagem);
        }

        // Guarda os produtos recebidos do banco
        produtos = dados.produtos;

        console.log('Produtos recebidos:', produtos);
        console.log('Categorias encontradas:', produtos.map(
            produto => produto.categoria_produto
        ));

        // Exibe todos os produtos inicialmente
        exibirProdutos(produtos);

    } catch (error) {
        console.error('Erro:', error);

        listaProdutos.textContent =
            'Não foi possível carregar os produtos.';
    }
}

// Exibe os produtos na página
function exibirProdutos(lista) {
    const listaProdutos = document.getElementById('lista-produtos');

    listaProdutos.innerHTML = '';

    if (lista.length === 0) {
        listaProdutos.textContent = 'Nenhum produto encontrado.';
        return;
    }

    lista.forEach(produto => {

        // Cria o card
        const card = document.createElement('div');
        card.classList.add('produto-card');

        // Espaço da imagem
        const imagem = document.createElement('div');
        imagem.classList.add('produto-imagem');
        imagem.textContent = 'Foto do produto';

        // Informações
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

        // Botão
        const botao = document.createElement('a');
        botao.classList.add('produto-botao');
        botao.textContent = 'Ver produto';
        botao.href = `../detalhesProduto/index.html?id=${produto.id_produto}`;

        // Organiza as informações
        informacoes.appendChild(categoria);
        informacoes.appendChild(nome);
        informacoes.appendChild(preco);
        informacoes.appendChild(botao);

        // Monta o card
        card.appendChild(imagem);
        card.appendChild(informacoes);

        listaProdutos.appendChild(card);
    });
}

// Filtra os produtos pela categoria selecionada
function filtrarCategoria(categoriaSelecionada) {

    if (categoriaSelecionada === 'todos') {
        exibirProdutos(produtos);
    } else {
        const produtosFiltrados = produtos.filter(produto => {

            const categoriaProduto = String(
                produto.categoria_produto
            ).trim().toLocaleLowerCase('pt-BR');

            const categoriaSelecionadaNormalizada = String(
                categoriaSelecionada
            ).trim().toLocaleLowerCase('pt-BR');

            return categoriaProduto === categoriaSelecionadaNormalizada;
        });

        console.log('Categoria selecionada:', categoriaSelecionada);
        console.log('Produtos filtrados:', produtosFiltrados);

        exibirProdutos(produtosFiltrados);
    }
}

// Configura os cliques nas categorias
function configurarFiltros() {
    const categorias = document.querySelectorAll('.categoria-link');

    console.log('Quantidade de links encontrados:', categorias.length);

    categorias.forEach(link => {
        console.log(link.outerHTML);
    });

    categorias.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const categoria = this.dataset.categoria;
            console.log('Elemento clicado:', this);
            console.log('Atributo data-categoria:', this.getAttribute('data-categoria'));

            // Atualiza a categoria visualmente selecionada
            categorias.forEach(item => {
                item.classList.remove('ativa');
            });

            this.classList.add('ativa');

            // Atualiza o título da listagem
            const titulo = document.querySelector('.catalogo-info h3');
            titulo.textContent = categoria === 'todos'
                ? 'Todos os produtos'
                : categoria;

            // Filtra os produtos
            filtrarCategoria(categoria);
        });
    });
}

// Configura os filtros e carrega os produtos
configurarFiltros();
carregarProdutos();