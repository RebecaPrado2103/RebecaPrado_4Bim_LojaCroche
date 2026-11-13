document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DA PÁGINA
    const itensPedido = document.getElementById('itens-pedido');
    const totalPedido = document.getElementById('total-pedido');

    // RECUPERA OS PRODUTOS DO CARRINHO
    const produtosCarrinho = JSON.parse(
        localStorage.getItem('carrinho') || '[]'
    );

    // FORMATA OS VALORES EM REAIS
    function formatarPreco(valor) {
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
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

    // CARREGA O RESUMO AO ABRIR A PÁGINA
    exibirResumoPedido();

    const formEntrega = document.getElementById('form-entrega');

    formEntrega.addEventListener('submit', function (event) {

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