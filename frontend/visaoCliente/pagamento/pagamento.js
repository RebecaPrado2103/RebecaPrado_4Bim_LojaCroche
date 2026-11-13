document.addEventListener('DOMContentLoaded', function () {

    // ELEMENTOS DA PÁGINA
    const totalPagamento = document.getElementById('total-pagamento');
    const valorRestante = document.getElementById('valor-restante');
    const mensagemPagamento = document.getElementById('mensagem-pagamento');
    const formPagamento = document.getElementById('form-pagamento');

    // RECUPERA OS PRODUTOS DO CARRINHO
    const produtosCarrinho = JSON.parse(
        localStorage.getItem('carrinho') || '[]'
    );

    // CALCULA O TOTAL DA COMPRA EM CENTAVOS
    const totalCompra = produtosCarrinho.reduce(function (total, produto) {
        return total + Math.round(Number(produto.preco) * 100) * Number(produto.quantidade);
    }, 0);

    // FORMATA OS VALORES EM REAIS
    function formatarPreco(valor) {
        return (valor / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // EXIBE O TOTAL DA COMPRA
    totalPagamento.textContent = formatarPreco(totalCompra);

    // FORMAS DE PAGAMENTO E SEUS CAMPOS
    const formasPagamento = [
        {
            checkbox: 'opcao-pix',
            detalhes: 'detalhes-pix',
            valor: 'valor-pix'
        },
        {
            checkbox: 'opcao-credito',
            detalhes: 'detalhes-credito',
            valor: 'valor-credito'
        },
        {
            checkbox: 'opcao-debito',
            detalhes: 'detalhes-debito',
            valor: 'valor-debito'
        }
    ];

    // MOSTRA OU ESCONDE OS CAMPOS
    formasPagamento.forEach(function (forma) {

        const checkbox = document.getElementById(forma.checkbox);
        const detalhes = document.getElementById(forma.detalhes);
        const campoValor = document.getElementById(forma.valor);

        checkbox.addEventListener('change', function () {

            detalhes.hidden = !checkbox.checked;

            if (!checkbox.checked) {
                campoValor.value = '';
            }

            atualizarValores();

        });

    });

    // CALCULA OS VALORES DOS PAGAMENTOS
    function atualizarValores() {

        let totalInformado = 0;

        formasPagamento.forEach(function (forma) {

            const checkbox = document.getElementById(forma.checkbox);
            const campoValor = document.getElementById(forma.valor);

            if (checkbox.checked) {

                const valor = Number(campoValor.value);

                if (Number.isFinite(valor) && valor > 0) {
                    totalInformado += Math.round(valor * 100);
                }

            }

        });

        const restante = totalCompra - totalInformado;

        valorRestante.textContent = formatarPreco(restante);

        if (totalCompra <= 0) {
            mensagemPagamento.textContent =
                'Seu carrinho está vazio. Adicione produtos antes de pagar.';
        } else if (totalInformado === 0) {
            mensagemPagamento.textContent =
                'Informe o valor de pelo menos uma forma de pagamento.';
        } else if (restante > 0) {
            mensagemPagamento.textContent =
                'Ainda falta informar parte do valor da compra.';
        } else if (restante < 0) {
            mensagemPagamento.textContent =
                'O valor informado ultrapassa o total da compra.';
        } else {
            mensagemPagamento.textContent =
                'Os valores dos pagamentos correspondem ao total da compra!';
        }

    }

    // ATUALIZA OS CÁLCULOS QUANDO OS VALORES MUDAM
    formasPagamento.forEach(function (forma) {

        const campoValor = document.getElementById(forma.valor);

        campoValor.addEventListener('input', atualizarValores);

    });

    // VALIDAÇÃO E CONFIRMAÇÃO DOS PAGAMENTOS
    formPagamento.addEventListener('submit', function (event) {

        event.preventDefault();

        if (totalCompra <= 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        let totalInformado = 0;
        let quantidadeSelecionada = 0;

        for (const forma of formasPagamento) {

            const checkbox = document.getElementById(forma.checkbox);
            const campoValor = document.getElementById(forma.valor);

            if (!checkbox.checked) {
                continue;
            }

            quantidadeSelecionada++;

            const valor = Number(campoValor.value);

            if (!Number.isFinite(valor) || valor <= 0) {
                alert('Informe um valor válido para cada forma de pagamento selecionada.');
                campoValor.focus();
                return;
            }

            totalInformado += Math.round(valor * 100);

            // VERIFICA OS DADOS FICTÍCIOS DOS CARTÕES
            if (forma.checkbox === 'opcao-credito' ||
                forma.checkbox === 'opcao-debito') {

                const tipo = forma.checkbox === 'opcao-credito'
                    ? 'credito'
                    : 'debito';

                const camposCartao = [
                    `nome-${tipo}`,
                    `numero-${tipo}`,
                    `validade-${tipo}`,
                    `codigo-${tipo}`
                ];

                for (const id of camposCartao) {

                    const campo = document.getElementById(id);

                    if (!campo.value.trim()) {
                        alert('Preencha todos os campos fictícios do cartão.');
                        campo.focus();
                        return;
                    }

                }

            }

        }

        if (quantidadeSelecionada === 0) {
            alert('Selecione pelo menos uma forma de pagamento.');
            return;
        }

        if (totalInformado !== totalCompra) {
            alert('A soma dos pagamentos precisa ser exatamente igual ao total da compra.');
            return;
        }

        alert('Os dados do pagamento foram validados com sucesso!');

    });

    // CÁLCULO INICIAL
    atualizarValores();

});