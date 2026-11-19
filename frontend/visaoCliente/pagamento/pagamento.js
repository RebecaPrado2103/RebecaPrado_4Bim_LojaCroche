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
            alert('Você precisa entrar na sua conta para realizar o pagamento!');
            window.location.href = '../../login/index.html';
            return;
        }

        const resultado = await resposta.json();

        if (!resultado.autenticado) {
            alert('Você precisa entrar na sua conta para realizar o pagamento!');
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
    const totalPagamento = document.getElementById('total-pagamento');
    const valorRestante = document.getElementById('valor-restante');
    const mensagemPagamento = document.getElementById('mensagem-pagamento');
    const formPagamento = document.getElementById('form-pagamento');

    // IDENTIFICA O TIPO DE COMPRA
    const itensCompraDireta = sessionStorage.getItem('itensCompra');

    // BUSCAR OS PRODUTOS DA COMPRA
    let totalCompra = 0;

    try {

        if (itensCompraDireta) {

            // COMPRA DIRETA: RECUPERA O PRODUTO ESCOLHIDO
            const itens = JSON.parse(itensCompraDireta);

            if (!Array.isArray(itens) || itens.length !== 1) {
                throw new Error('Dados da compra direta inválidos.');
            }

            const idProduto = Number(itens[0].idProduto);
            const quantidade = Number(itens[0].quantidade);

            if (
                !Number.isInteger(idProduto) ||
                idProduto <= 0 ||
                !Number.isInteger(quantidade) ||
                quantidade <= 0
            ) {
                throw new Error('Produto ou quantidade inválidos.');
            }

            // CONSULTA O PRODUTO NO BANCO
            const respostaProduto = await fetch(
                `http://127.0.0.1:3001/api/produtos/${idProduto}`
            );

            const resultadoProduto = await respostaProduto.json();

            if (!respostaProduto.ok || !resultadoProduto.sucesso) {
                throw new Error('Não foi possível encontrar o produto.');
            }

            const produto = resultadoProduto.produto;

            if (quantidade > Number(produto.quantidade_estoque_produto)) {
                throw new Error('A quantidade escolhida não está disponível em estoque.');
            }

            totalCompra =
                Math.round(Number(produto.preco_unitario_produto) * 100) *
                quantidade;

        } else {

            // COMPRA PELO CARRINHO
            const respostaCarrinho = await fetch(
                'http://127.0.0.1:3001/api/carrinho',
                {
                    credentials: 'include'
                }
            );

            if (respostaCarrinho.status === 401) {
                alert('Sua sessão expirou. Entre novamente na sua conta.');
                window.location.href = '../../login/index.html';
                return;
            }

            if (!respostaCarrinho.ok) {
                throw new Error('Não foi possível carregar o carrinho.');
            }

            const resultadoCarrinho = await respostaCarrinho.json();

            if (!resultadoCarrinho.sucesso) {
                throw new Error('Erro ao consultar os produtos do carrinho.');
            }

            const itensCarrinho = resultadoCarrinho.itens || [];

            totalCompra = itensCarrinho.reduce(function (total, produto) {
                return total +
                    Math.round(Number(produto.preco_unitario_produto) * 100) *
                    Number(produto.quantidade_item_carrinho);
            }, 0);

        }

    } catch (error) {

        console.error('Erro ao carregar a compra:', error);

        alert(error.message || 'Não foi possível carregar os produtos da sua compra.');

        window.location.href = '../finalizar/index.html';

        return;
    }

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
            valor: 'valor-pix',
            formaPagamentoId: 1
        },
        {
            checkbox: 'opcao-credito',
            detalhes: 'detalhes-credito',
            valor: 'valor-credito',
            formaPagamentoId: 2
        },
        {
            checkbox: 'opcao-debito',
            detalhes: 'detalhes-debito',
            valor: 'valor-debito',
            formaPagamentoId: 3
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
                'Não há produtos nesta compra. Volte à loja e escolha seus produtos.';
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
    formPagamento.addEventListener('submit', async function (event) {

        event.preventDefault();

        if (totalCompra <= 0) {
            alert('Seu carrinho está vazio!');
            return;
        }

        let totalInformado = 0;
        let quantidadeSelecionada = 0;

        // VALIDA AS FORMAS DE PAGAMENTO
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

        // RECUPERA OS DADOS DE ENTREGA
        let dadosEntrega;

        try {
            dadosEntrega = JSON.parse(
                sessionStorage.getItem('dadosEntrega')
            );
        } catch (error) {
            alert('Não foi possível recuperar os dados de entrega.');
            window.location.href = '../finalizar/index.html';
            return;
        }

        if (!dadosEntrega) {
            alert('Os dados de entrega não foram encontrados. Preencha-os novamente.');
            window.location.href = '../finalizar/index.html';
            return;
        }

        // ORGANIZA AS FORMAS DE PAGAMENTO SELECIONADAS
        const pagamentos = formasPagamento
            .filter(function (forma) {
                return document.getElementById(forma.checkbox).checked;
            })
            .map(function (forma) {
                return {
                    formaPagamentoId: forma.formaPagamentoId,
                    valor: Number(document.getElementById(forma.valor).value)
                };
            });

        // ENVIA O PEDIDO PARA O BACKEND
        try {

            const resposta = await fetch(
                'http://127.0.0.1:3001/api/pedidos/confirmar',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        dadosEntrega: dadosEntrega,
                        pagamentos: pagamentos,
                        itensCompra: itensCompraDireta
                            ? JSON.parse(itensCompraDireta)
                            : undefined
                    })
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(
                    resultado.mensagem || 'Não foi possível concluir a compra.'
                );
            }

            // LIMPA OS DADOS DE ENTREGA APÓS A COMPRA
            sessionStorage.removeItem('dadosEntrega');

            // LIMPA OS DADOS DA COMPRA DIRETA, SE EXISTIREM
            sessionStorage.removeItem('itensCompra');
            sessionStorage.removeItem('compraDireta');

            alert(resultado.mensagem);

            // VOLTA PARA A PÁGINA INICIAL
            window.location.href = '../inicio/index.html';

        } catch (error) {

            console.error('Erro ao confirmar pedido:', error);

            alert(error.message || 'Ocorreu um erro ao realizar sua compra. Tente novamente.');

        }

    });

    // CÁLCULO INICIAL
    atualizarValores();

});