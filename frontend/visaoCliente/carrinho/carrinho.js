document.addEventListener('DOMContentLoaded', async function () {

    // ELEMENTOS DO CARRINHO
    const botaoAbrirCarrinho = document.getElementById('abrir-carrinho');
    const botaoFecharCarrinho = document.getElementById('fechar-carrinho');
    const carrinhoLateral = document.getElementById('carrinho-lateral');
    const fundoCarrinho = document.getElementById('fundo-carrinho');
    const botaoCancelar = document.querySelector('.botao-cancelar');
    const botaoComprar = document.querySelector('.botao-comprar');

    const listaItens = document.getElementById('itens-carrinho');
    const totalCarrinho = document.getElementById('total-carrinho');

    // PRODUTOS DO CARRINHO
    let produtosCarrinho = [];
    let mensagemCarrinho = '';

    // FORMATA OS VALORES EM REAIS
    function formatarPreco(valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // BUSCA O CARRINHO NO BANCO DE DADOS
    async function carregarCarrinho() {

        try {
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/carrinho',
                {
                    credentials: 'include'
                }
            );

            const resultado = await resposta.json();

            if (resposta.status === 401) {
                produtosCarrinho = [];
                mensagemCarrinho = 'Entre na sua conta para visualizar seu carrinho.';
                exibirCarrinho();
                return;
            }

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            // Organiza os dados recebidos do banco
            produtosCarrinho = resultado.itens.map(item => ({
                id: item.id_produto,
                nome: item.nome_produto,
                preco: Number(item.preco_unitario_produto),
                quantidade: item.quantidade_item_carrinho,
                estoque: item.quantidade_estoque_produto
            }));

            mensagemCarrinho = '';
            exibirCarrinho();

        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);

            produtosCarrinho = [];
            mensagemCarrinho = 'Não foi possível carregar seu carrinho.';
            exibirCarrinho();
        }
    }

    // EXIBE OS PRODUTOS
    function exibirCarrinho() {

        listaItens.innerHTML = '';

        if (produtosCarrinho.length === 0) {

            listaItens.innerHTML = `<p>${mensagemCarrinho || 'Seu carrinho está vazio.'}</p>`;

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

    // ATUALIZA A QUANTIDADE NO BANCO DE DADOS
    async function atualizarQuantidade(idProduto, quantidade) {

        try {
            const resposta = await fetch(
                `http://127.0.0.1:3001/api/carrinho/itens/${idProduto}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ quantidade })
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            await carregarCarrinho();

        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            alert(error.message || 'Não foi possível atualizar a quantidade.');
        }
    }

    // REMOVE UM PRODUTO DO BANCO DE DADOS
    async function removerProduto(idProduto) {

        try {
            const resposta = await fetch(
                `http://127.0.0.1:3001/api/carrinho/itens/${idProduto}`,
                {
                    method: 'DELETE',
                    credentials: 'include'
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            await carregarCarrinho();

        } catch (error) {
            console.error('Erro ao remover produto:', error);
            alert(error.message || 'Não foi possível remover o produto.');
        }
    }

    // ALTERA QUANTIDADES OU REMOVE PRODUTOS
    listaItens.addEventListener('click', async function (event) {

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
                await atualizarQuantidade(id, produto.quantidade + 1);
            } else {
                alert('Você atingiu o limite de estoque.');
            }

        } else if (acao === 'diminuir') {

            if (produto.quantidade > 1) {
                await atualizarQuantidade(id, produto.quantidade - 1);
            } else {
                await removerProduto(id);
            }

        } else if (acao === 'remover') {

            await removerProduto(id);
        }
    });

    // ABRIR O CARRINHO
    function abrirCarrinho() {
        carrinhoLateral.classList.add('aberto');
        fundoCarrinho.classList.add('aberto');
        document.body.style.overflow = 'hidden';

        carregarCarrinho();
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

    // CONTINUAR PARA A COMPRA
    botaoComprar.addEventListener('click', async function () {

        try {
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/login/sessao',
                {
                    credentials: 'include'
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.autenticado) {
                alert('Entre na sua conta para continuar com a compra!');
                window.location.href = '../../login/index.html';
                return;
            }

            // Atualiza os itens antes de continuar
            await carregarCarrinho();

            if (produtosCarrinho.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }

            window.location.href = '../finalizar/index.html';

        } catch (error) {
            console.error('Erro ao verificar login:', error);
            alert('Não foi possível verificar sua conta. Tente novamente.');
        }
    });

    fundoCarrinho.addEventListener('click', fecharCarrinho);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            fecharCarrinho();
        }
    });

    // CARREGA O CARRINHO AO ABRIR A PÁGINA
    await carregarCarrinho();

});