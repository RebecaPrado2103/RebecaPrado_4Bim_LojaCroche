document.addEventListener('DOMContentLoaded', async function() {

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

    // CARREGA O CARRINHO AO ABRIR A PÁGINA
    const carregamentoConcluido = await carregarCarrinho();

    if (!carregamentoConcluido) {
        return;
    }

    exibirResumoPedido();

    // FORMULÁRIO DE ENTREGA
    formEntrega.addEventListener('submit', function(event) {

        event.preventDefault();

        // VERIFICA SE EXISTEM PRODUTOS NO CARRINHO
        if (produtosCarrinho.length === 0) {
            alert('Adicione produtos ao carrinho antes de continuar.');
            return;
        }

        // ORGANIZA OS DADOS DE ENTREGA
        const dadosEntrega = {
            nome: document.getElementById('nome').value.trim(),
            cep: document.getElementById('cep').value.trim(),
            endereco: document.getElementById('endereco').value.trim(),
            numero: document.getElementById('numero').value.trim(),
            complemento: document.getElementById('complemento').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            estado: document.getElementById('estado').value.trim()
        };

        // SALVA OS DADOS TEMPORARIAMENTE
        sessionStorage.setItem(
            'dadosEntrega',
            JSON.stringify(dadosEntrega)
        );

        alert('Dados de entrega registrados com sucesso!');

        window.location.href = '../pagamento/index.html';

    });

});