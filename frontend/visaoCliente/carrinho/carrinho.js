document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DO CARRINHO
    const botaoAbrirCarrinho = document.getElementById('abrir-carrinho');
    const botaoFecharCarrinho = document.getElementById('fechar-carrinho');
    const carrinhoLateral = document.getElementById('carrinho-lateral');
    const fundoCarrinho = document.getElementById('fundo-carrinho');
    const botaoCancelar = document.querySelector('.botao-cancelar');
    const botaoComprar = document.querySelector('.botao-comprar');

    const listaItens = document.getElementById('itens-carrinho');
    const totalCarrinho = document.getElementById('total-carrinho');

    // RECUPERA OS PRODUTOS SALVOS
    let produtosCarrinho = JSON.parse(
        localStorage.getItem('carrinho') || '[]'
    );

    // FORMATA OS VALORES EM REAIS
    function formatarPreco(valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // SALVA O CARRINHO
    function salvarCarrinho() {
        localStorage.setItem(
            'carrinho',
            JSON.stringify(produtosCarrinho)
        );
    }

    // EXIBE OS PRODUTOS
    function exibirCarrinho() {

        listaItens.innerHTML = '';

        if (produtosCarrinho.length === 0) {
            listaItens.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalCarrinho.textContent = formatarPreco(0);
            return;
        }

        let total = 0;

        produtosCarrinho.forEach(produto => {

            const subtotal = produto.preco * produto.quantidade;
            total += subtotal;

            const item = document.createElement('div');
            item.classList.add('item-carrinho');

            const nome = document.createElement('h3');
            nome.textContent = produto.nome;

            const preco = document.createElement('p');
            preco.textContent = formatarPreco(produto.preco);

            const controles = document.createElement('div');
            controles.classList.add('controles-quantidade');

            const diminuir = document.createElement('button');
            diminuir.textContent = '-';
            diminuir.dataset.acao = 'diminuir';
            diminuir.dataset.id = produto.id;

            const quantidade = document.createElement('span');
            quantidade.textContent = produto.quantidade;

            const aumentar = document.createElement('button');
            aumentar.textContent = '+';
            aumentar.dataset.acao = 'aumentar';
            aumentar.dataset.id = produto.id;

            const remover = document.createElement('button');
            remover.textContent = 'Remover';
            remover.dataset.acao = 'remover';
            remover.dataset.id = produto.id;

            controles.appendChild(diminuir);
            controles.appendChild(quantidade);
            controles.appendChild(aumentar);

            item.appendChild(nome);
            item.appendChild(preco);
            item.appendChild(controles);
            item.appendChild(remover);

            listaItens.appendChild(item);
        });

        totalCarrinho.textContent = formatarPreco(total);
    }

    // ADICIONA UM PRODUTO AO CARRINHO
    window.adicionarProdutoCarrinho = function (produto, quantidade) {

        const produtoExistente = produtosCarrinho.find(
            item => item.id === produto.id_produto
        );

        if (produtoExistente) {

            if (produtoExistente.quantidade + quantidade >
                produto.quantidade_estoque_produto) {
                alert('Quantidade maior que o estoque disponível.');
                return false;
            }

            produtoExistente.quantidade += quantidade;

        } else {

            if (quantidade > produto.quantidade_estoque_produto) {
                alert('Quantidade maior que o estoque disponível.');
                return false;
            }

            produtosCarrinho.push({
                id: produto.id_produto,
                nome: produto.nome_produto,
                preco: Number(produto.preco_unitario_produto),
                quantidade: quantidade,
                estoque: produto.quantidade_estoque_produto
            });
        }

        salvarCarrinho();
        exibirCarrinho();

        return true;
    };

    // ALTERA QUANTIDADES OU REMOVE PRODUTOS
    listaItens.addEventListener('click', function (event) {

        const botao = event.target.closest('button');

        if (!botao) return;

        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;

        const produto = produtosCarrinho.find(
            item => item.id === id
        );

        if (!produto) return;

        if (acao === 'aumentar') {

            if (produto.quantidade < produto.estoque) {
                produto.quantidade++;
            } else {
                alert('Você atingiu o limite de estoque.');
            }

        } else if (acao === 'diminuir') {

            produto.quantidade--;

            if (produto.quantidade <= 0) {
                produtosCarrinho = produtosCarrinho.filter(
                    item => item.id !== id
                );
            }

        } else if (acao === 'remover') {

            produtosCarrinho = produtosCarrinho.filter(
                item => item.id !== id
            );
        }

        salvarCarrinho();
        exibirCarrinho();
    });

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
    botaoComprar.addEventListener('click', function () {

        if (produtosCarrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        window.location.href = '../finalizar/index.html';

    });
    fundoCarrinho.addEventListener('click', fecharCarrinho);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            fecharCarrinho();
        }
    });

    // CARREGA O CARRINHO AO ABRIR A PÁGINA
    exibirCarrinho();

});