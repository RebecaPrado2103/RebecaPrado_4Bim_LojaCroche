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
    const listaFormasPagamento = document.getElementById('lista-formas-pagamento');

    // IDENTIFICA O TIPO DE COMPRA
    const itensCompraDireta = sessionStorage.getItem('itensCompra');

    // BUSCAR OS PRODUTOS DA COMPRA
    let totalCompra = 0;

    try {

        if (itensCompraDireta) {

            // COMPRA DIRETA
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

    // FORMAS DE PAGAMENTO RECEBIDAS DO BANCO
    let formasPagamento = [];

    // EVITA INSERIR HTML INDESEJADO NOS NOMES
    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, function (caractere) {
            const caracteres = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };

            return caracteres[caractere];
        });
    }

    // CARREGAR FORMAS DE PAGAMENTO ATIVAS
    async function carregarFormasPagamento() {

        try {

            const resposta = await fetch(
                'http://127.0.0.1:3001/api/formas-pagamento/cliente/ativas'
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error('Não foi possível carregar as formas de pagamento.');
            }

            formasPagamento = resultado.formasPagamento.map(function (forma) {
                return {
                    id: Number(forma.id_forma_pagamento),
                    nome: forma.nome_forma_pagamento,

                    // IDENTIFICAR SE É UMA FORMA DE PAGAMENTO COM CARTÃO
                    ehCartao: forma.nome_forma_pagamento
                        .toLowerCase()
                        .includes('cartão'),

                    checkbox: `opcao-forma-${forma.id_forma_pagamento}`,
                    detalhes: `detalhes-forma-${forma.id_forma_pagamento}`,
                    valor: `valor-forma-${forma.id_forma_pagamento}`
                };
            });

            // VERIFICAR SE EXISTEM FORMAS ATIVAS
            if (formasPagamento.length === 0) {

                listaFormasPagamento.innerHTML = `
                    <p>Nenhuma forma de pagamento está disponível no momento.</p>
                `;

                mensagemPagamento.textContent =
                    'Entre em contato com a loja para obter mais informações.';

                return false;
            }

            // CRIAR AS OPÇÕES NA PÁGINA
            listaFormasPagamento.innerHTML = formasPagamento.map(function (forma) {

                return `
                    <div class="opcao-pagamento">

                        <label for="${forma.checkbox}">

                            <input
                                type="checkbox"
                                name="formasPagamento"
                                id="${forma.checkbox}"
                            >

                            <strong>${escaparHTML(forma.nome)}</strong>

                        </label>

                        <div
                            class="detalhes-pagamento"
                            id="${forma.detalhes}"
                            hidden
                        >

                            <label for="${forma.valor}">
                                Valor a pagar
                            </label>

                            <input
                                type="number"
                                id="${forma.valor}"
                                min="0.01"
                                step="0.01"
                                placeholder="Informe o valor"
                            >

                            ${forma.ehCartao ? `
                                <div class="dados-cartao">

                                    <h4>Dados fictícios do cartão</h4>

                                    <label for="titular-${forma.id}">
                                        Nome do titular
                                    </label>
                                    <input
                                        type="text"
                                        id="titular-${forma.id}"
                                        placeholder="Nome fictício do titular"
                                    >

                                    <label for="numero-cartao-${forma.id}">
                                        Número do cartão
                                    </label>
                                    <input
                                        type="text"
                                        id="numero-cartao-${forma.id}"
                                        placeholder="Somente números fictícios"
                                        inputmode="numeric"
                                    >

                                    <label for="validade-${forma.id}">
                                        Data de validade
                                    </label>
                                    <input
                                        type="text"
                                        id="validade-${forma.id}"
                                        placeholder="MM/AA"
                                    >

                                    <label for="seguranca-${forma.id}">
                                        Código de segurança
                                    </label>
                                    <input
                                        type="text"
                                        id="seguranca-${forma.id}"
                                        placeholder="Código fictício"
                                        inputmode="numeric"
                                    >

                                </div>
                            ` : ''}

                        </div>

                    </div>
                `;

            }).join('');

            // CONFIGURAR OS EVENTOS DAS OPÇÕES
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

                campoValor.addEventListener('input', atualizarValores);

            });

            return true;

        } catch (error) {

            console.error('Erro ao carregar formas de pagamento:', error);

            listaFormasPagamento.innerHTML = `
                <p>Não foi possível carregar as formas de pagamento.</p>
            `;

            mensagemPagamento.textContent =
                'Atualize a página ou tente novamente mais tarde.';

            return false;
        }
    }

    // CALCULAR OS VALORES DOS PAGAMENTOS
    function atualizarValores() {

        let totalInformado = 0;

        formasPagamento.forEach(function (forma) {

            const checkbox = document.getElementById(forma.checkbox);
            const campoValor = document.getElementById(forma.valor);

            if (checkbox && checkbox.checked) {

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

    // CARREGAR AS FORMAS ANTES DE PERMITIR O PAGAMENTO
    const formasCarregadas = await carregarFormasPagamento();

    // CÁLCULO INICIAL
    atualizarValores();

    // NÃO PERMITIR PAGAMENTO SE NÃO HOUVER FORMAS DISPONÍVEIS
    if (!formasCarregadas) {
        return;
    }

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

            // VALIDAR OS DADOS FICTÍCIOS DO CARTÃO
            if (forma.ehCartao) {

                const titular = document.getElementById(`titular-${forma.id}`);
                const numero = document.getElementById(`numero-cartao-${forma.id}`);
                const validade = document.getElementById(`validade-${forma.id}`);
                const seguranca = document.getElementById(`seguranca-${forma.id}`);

                if (
                    !titular.value.trim() ||
                    !numero.value.trim() ||
                    !validade.value.trim() ||
                    !seguranca.value.trim()
                ) {
                    alert('Preencha todos os campos fictícios do cartão.');
                    return;
                }
            }

            totalInformado += Math.round(valor * 100);

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

        // ORGANIZAR AS FORMAS DE PAGAMENTO SELECIONADAS
        const pagamentos = formasPagamento
            .filter(function (forma) {
                return document.getElementById(forma.checkbox).checked;
            })
            .map(function (forma) {
                return {
                    formaPagamentoId: forma.id,
                    valor: Number(document.getElementById(forma.valor).value)
                };
            });

        // ENVIAR O PEDIDO PARA O BACKEND
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

            // LIMPAR OS DADOS DE ENTREGA
            sessionStorage.removeItem('dadosEntrega');

            // LIMPAR OS DADOS DA COMPRA DIRETA
            sessionStorage.removeItem('itensCompra');
            sessionStorage.removeItem('compraDireta');

            alert(resultado.mensagem);

            // VOLTAR PARA A PÁGINA INICIAL
            window.location.href = '../inicio/index.html';

        } catch (error) {

            console.error('Erro ao confirmar pedido:', error);

            alert(error.message || 'Ocorreu um erro ao realizar sua compra. Tente novamente.');

        }

    });

});
