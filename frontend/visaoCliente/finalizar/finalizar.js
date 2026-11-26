document.addEventListener('DOMContentLoaded', async function () {

    // VERIFICAR SE O CLIENTE ESTÁ CONECTADO
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/login/sessao',
            {
                credentials: 'include'
            }
        );

        if (!resposta.ok) {
            alert('Você precisa entrar na sua conta para finalizar a compra!');
            window.location.href = '../../login/index.html';
            return;
        }

        const resultado = await resposta.json();

        if (!resultado.autenticado) {
            alert('Você precisa entrar na sua conta para finalizar a compra!');
            window.location.href = '../../login/index.html';
            return;
        }

    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        alert('Não foi possível verificar sua conta. Tente novamente.');
        window.location.href = '../../login/index.html';
        return;
    }

    // ELEMENTOS DA PÁGINA
    const itensPedido = document.getElementById('itens-pedido');
    const totalPedido = document.getElementById('total-pedido');
    const formEntrega = document.getElementById('form-entrega');

    // PRODUTOS DO CARRINHO
    let produtosCarrinho = [];

    // IDENTIFICA SE A COMPRA VEIO DO BOTÃO "COMPRAR AGORA"
    let compraDireta = null;

    // FORMATA OS VALORES EM REAIS
    function formatarPreco(valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // BUSCA OS PRODUTOS NO BANCO DE DADOS
    async function carregarCarrinho() {

        try {
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/carrinho',
                {
                    credentials: 'include'
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            produtosCarrinho = resultado.itens.map(item => ({
                id: item.id_produto,
                nome: item.nome_produto,
                preco: Number(item.preco_unitario_produto),
                quantidade: item.quantidade_item_carrinho
            }));

            return true;

        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);

            itensPedido.innerHTML = `
                <p>Não foi possível carregar os produtos do carrinho.</p>
            `;

            totalPedido.textContent = formatarPreco(0);

            alert('Não foi possível carregar seu carrinho. Tente novamente.');

            return false;
        }
    }

    // BUSCA O PRODUTO DE UMA COMPRA DIRETA
    async function carregarCompraDireta() {

        try {

            // RECUPERA OS DADOS SALVOS NA PÁGINA DE DETALHES
            compraDireta = JSON.parse(
                sessionStorage.getItem('compraDireta')
            );

            if (!compraDireta) {
                throw new Error('Dados da compra direta não encontrados.');
            }

            // BUSCA O PRODUTO NO BANCO DE DADOS
            const resposta = await fetch(
                `http://127.0.0.1:3001/api/produtos/${compraDireta.idProduto}`
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error('Não foi possível encontrar o produto.');
            }

            const produto = resultado.produto;

            // MONTA A LISTA COM O PRODUTO ESCOLHIDO
            produtosCarrinho = [{
                id: produto.id_produto,
                nome: produto.nome_produto,
                preco: Number(produto.preco_unitario_produto),
                quantidade: Number(compraDireta.quantidade)
            }];

            return true;

        } catch (error) {

            console.error('Erro ao carregar compra direta:', error);

            itensPedido.innerHTML = `
            <p>Não foi possível carregar o produto escolhido.</p>
        `;

            totalPedido.textContent = formatarPreco(0);

            alert('Não foi possível carregar sua compra. Tente novamente.');

            return false;
        }
    }

    // EXIBE O RESUMO DO PEDIDO
    function exibirResumoPedido() {

        itensPedido.innerHTML = '';

        if (produtosCarrinho.length === 0) {
            itensPedido.innerHTML = '<p>Seu carrinho está vazio.</p>';
            totalPedido.textContent = formatarPreco(0);
            return;
        }

        let total = 0;

        produtosCarrinho.forEach(produto => {

            const subtotal = produto.preco * produto.quantidade;
            total += subtotal;

            const item = document.createElement('div');
            item.classList.add('item-pedido');

            const nome = document.createElement('h3');
            nome.textContent = produto.nome;

            const quantidade = document.createElement('p');
            quantidade.textContent = `Quantidade: ${produto.quantidade}`;

            const preco = document.createElement('p');
            preco.textContent = `Preço unitário: ${formatarPreco(produto.preco)}`;

            const valorSubtotal = document.createElement('strong');
            valorSubtotal.textContent = `Subtotal: ${formatarPreco(subtotal)}`;

            item.appendChild(nome);
            item.appendChild(quantidade);
            item.appendChild(preco);
            item.appendChild(valorSubtotal);

            itensPedido.appendChild(item);
        });

        totalPedido.textContent = formatarPreco(total);
    }

    // CARREGA OS PRODUTOS AO ABRIR A PÁGINA
    let carregamentoConcluido;

    if (sessionStorage.getItem('compraDireta')) {

        // VEIO DO BOTÃO "COMPRAR AGORA"
        carregamentoConcluido = await carregarCompraDireta();

    } else {

        // VEIO DO CARRINHO
        carregamentoConcluido = await carregarCarrinho();

    }

    if (!carregamentoConcluido) {
        return;
    }

    exibirResumoPedido();

    // FORMULÁRIO DE ENTREGA
    formEntrega.addEventListener('submit', async function (event) {

        event.preventDefault();

        // VERIFICAR SE EXISTEM PRODUTOS NO CARRINHO
        if (produtosCarrinho.length === 0) {
            alert('Adicione produtos ao carrinho antes de continuar.');
            return;
        }

        // ORGANIZAR OS DADOS DE ENTREGA
        const dadosEntrega = {
            nome: document.getElementById('nome').value.trim(),
            cep: document.getElementById('cep').value.trim(),
            endereco: document.getElementById('endereco').value.trim(),
            numero: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value.trim()
        };

        // PREPARAR OS DADOS DA COMPRA DIRETA
        let itensCompra = null;

        if (compraDireta) {
            itensCompra = [{
                idProduto: compraDireta.idProduto,
                quantidade: compraDireta.quantidade
            }];
        }

        try {

            // CRIAR O PEDIDO NO BACKEND
            const resposta = await fetch(
                'http://127.0.0.1:3001/api/pedidos/confirmar',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        dadosEntrega,
                        itensCompra
                    })
                }
            );

            const resultado = await resposta.json();

            // VERIFICAR SE O PEDIDO FOI CRIADO
            if (!resposta.ok || !resultado.sucesso) {
                alert(resultado.mensagem || 'Não foi possível confirmar o pedido.');
                return;
            }

            // SALVAR O ID DO PEDIDO PENDENTE
            sessionStorage.setItem(
                'idPedidoPendente',
                resultado.idPedido
            );

            // SALVAR OS DADOS DE ENTREGA TEMPORARIAMENTE
            sessionStorage.setItem(
                'dadosEntrega',
                JSON.stringify(dadosEntrega)
            );

            // SALVAR OS ITENS DA COMPRA DIRETA, SE NECESSÁRIO
            if (compraDireta) {
                sessionStorage.setItem(
                    'itensCompra',
                    JSON.stringify(itensCompra)
                );
            } else {
                sessionStorage.removeItem('itensCompra');
            }

            alert(resultado.mensagem);

            // IR PARA A PÁGINA DE PAGAMENTO
            window.location.href = '../pagamento/index.html';

        } catch (error) {

            console.error('Erro ao confirmar pedido:', error);

            alert('Não foi possível conectar ao servidor para confirmar o pedido.');

        }

    });

});