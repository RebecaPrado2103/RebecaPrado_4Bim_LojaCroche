// ELEMENTOS DA PÁGINA
const mensagemPedidos = document.getElementById('mensagem-pedidos');
const pedidosContainer = document.getElementById('pedidos-container');

// Guardar os temporizadores dos pedidos
let temporizadores = [];

function escaparHTML(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// FORMATAR VALOR EM REAIS
function formatarValor(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// FORMATAR DATA
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// CALCULAR TEMPO RESTANTE
function calcularTempoRestante(dataLimite) {

    const agora = new Date();
    const limite = new Date(dataLimite);

    const diferenca = limite - agora;

    if (diferenca <= 0) {
        return 'Prazo de pagamento encerrado';
    }

    const horas = Math.floor(diferenca / (1000 * 60 * 60));

    const minutos = Math.floor(
        (diferenca % (1000 * 60 * 60)) / (1000 * 60)
    );

    const segundos = Math.floor(
        (diferenca % (1000 * 60)) / 1000
    );

    return `${horas}h ${minutos}min ${segundos}s`;
}

// CARREGAR OS PEDIDOS DO CLIENTE
async function carregarMeusPedidos() {

    try {

        const resposta = await fetch(
            'http://127.0.0.1:3001/api/pedidos/meus',
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Não foi possível carregar os pedidos.');
        }

        mensagemPedidos.textContent = '';

        // Caso o cliente ainda não tenha pedidos
        if (dados.pedidos.length === 0) {

            mensagemPedidos.textContent =
                'Você ainda não realizou nenhum pedido.';

            return;
        }

        // Criar um cartão para cada pedido
        dados.pedidos.forEach(pedido => {

            const cartao = document.createElement('article');
            cartao.classList.add('cartao-pedido');

            const status = pedido.status_pedido;

            const pedidoAguardandoPagamento =
                status === 'Aguardando pagamento';

            cartao.innerHTML = `
                <div class="pedido-cabecalho">
                    <h3>Pedido #${escaparHTML(pedido.id_pedido)}</h3>
                    <span class="pedido-status">
                        ${escaparHTML(pedido.status_pedido)}
                    </span>
                </div>

                <p>
                    <strong>Data:</strong>
                    ${formatarData(pedido.data_pedido)}
                </p>

                <p>
                    <strong>Valor total:</strong>
                    ${formatarValor(pedido.valor_total)}
                </p>

                ${pedidoAguardandoPagamento
                    ? `
                        <div class="prazo-pagamento">
                            <p><strong>Tempo restante para pagamento:</strong></p>

                            <p
                                class="contador-pedido"
                                data-prazo="${escaparHTML(pedido.data_limite_pagamento)}"
                            >
                                Calculando...
                            </p>
                        </div>
                    `
                    : ''
                }

                <button class="botao-detalhes" type="button">
                    Ver detalhes
                </button>

                ${pedido.status_pedido === 'Aguardando pagamento'
                    ? '<button class="botao-pagar-pedido">Pagar pedido</button>'
                    : ''}

                ${pedido.status_pedido === 'Aguardando pagamento'
                    ? '<button class="botao-cancelar-pedido">Cancelar pedido</button>'
                    : ''}

                <div class="detalhes-pedido" hidden></div>
            `;

            // BOTÃO PAGAR PEDIDO
            const botaoPagar = cartao.querySelector('.botao-pagar-pedido');

            if (botaoPagar) {
                botaoPagar.addEventListener('click', () => {
                    // Guardar o pedido que será pago
                    sessionStorage.setItem(
                        'idPedidoPendente',
                        pedido.id_pedido
                    );

                    // Abrir a página de pagamento
                    window.location.href = '../pagamento/index.html';
                });
            }

            // BOTÃO DE CANCELAR PEDIDO
            const botaoCancelar = cartao.querySelector('.botao-cancelar-pedido');

            if (botaoCancelar) {
                botaoCancelar.addEventListener('click', async () => {

                    const confirmar = confirm(
                        'Tem certeza de que deseja cancelar este pedido?'
                    );

                    if (!confirmar) {
                        return;
                    }

                    botaoCancelar.disabled = true;
                    botaoCancelar.textContent = 'Cancelando...';

                    try {
                        const resposta = await fetch(
                            `http://127.0.0.1:3001/api/pedidos/meus/${pedido.id_pedido}/cancelar`,
                            {
                                method: 'POST',
                                credentials: 'include'
                            }
                        );

                        const resultado = await resposta.json();

                        if (!resposta.ok || !resultado.sucesso) {
                            throw new Error(
                                resultado.mensagem || 'Não foi possível cancelar o pedido.'
                            );
                        }

                        alert('Pedido cancelado com sucesso!');

                        // Atualiza a página para mostrar o novo status
                        window.location.reload();

                    } catch (erro) {
                        console.error('Erro ao cancelar pedido:', erro);

                        alert(erro.message || 'Ocorreu um erro ao cancelar o pedido.');

                        botaoCancelar.disabled = false;
                        botaoCancelar.textContent = 'Cancelar pedido';
                    }
                });
            }

            // BOTÃO PARA ABRIR OS DETALHES
            const botaoDetalhes = cartao.querySelector('.botao-detalhes');
            const areaDetalhes = cartao.querySelector('.detalhes-pedido');

            botaoDetalhes.addEventListener('click', async () => {

                // Se os detalhes já estiverem abertos, fechar
                if (!areaDetalhes.hidden) {
                    areaDetalhes.hidden = true;
                    botaoDetalhes.textContent = 'Ver detalhes';
                    return;
                }

                // Mostrar a área de detalhes
                areaDetalhes.hidden = false;
                botaoDetalhes.textContent = 'Ocultar detalhes';
                areaDetalhes.textContent = 'Carregando detalhes...';

                try {

                    const resposta = await fetch(
                        `http://127.0.0.1:3001/api/pedidos/meus/${pedido.id_pedido}/detalhes`,
                        {
                            method: 'GET',
                            credentials: 'include'
                        }
                    );

                    const dados = await resposta.json();

                    if (!resposta.ok || !dados.sucesso) {
                        throw new Error(
                            dados.mensagem || 'Não foi possível carregar os detalhes.'
                        );
                    }

                    const compra = dados.pedido;

                    let htmlItens = '';

                    dados.itens.forEach(item => {

                        htmlItens += `
                <div class="detalhe-item">
                    <p>
                        <strong>${escaparHTML(item.nome_produto)}</strong>
                    </p>

                    <p>
                        Quantidade:
                        ${escaparHTML(item.quantidade_item_pedido)}
                    </p>

                    <p>
                        Valor unitário:
                        ${formatarValor(item.preco_unitario_item_pedido)}
                    </p>
                </div>
            `;

                    });

                    let htmlPagamentos = '';

                    if (dados.pagamentos.length === 0) {

                        htmlPagamentos = `
                <p>Este pedido ainda não possui pagamento registrado.</p>
            `;

                    } else {

                        dados.pagamentos.forEach(pagamento => {

                            htmlPagamentos += `
                    <p>
                        ${escaparHTML(pagamento.nome_forma_pagamento)}
                        — ${formatarValor(pagamento.valor_pagamento)}
                        (${escaparHTML(pagamento.status_pagamento)})
                    </p>
                `;

                        });

                    }

                    areaDetalhes.innerHTML = `
            <h4>Produtos</h4>
            ${htmlItens}

            <h4>Entrega</h4>

            <p>
                ${escaparHTML(compra.nome_entrega)}
            </p>

            <p>
                ${escaparHTML(compra.endereco_entrega)},
                ${escaparHTML(compra.numero_entrega)}
            </p>

            ${compra.complemento_entrega
                            ? `<p>${escaparHTML(compra.complemento_entrega)}</p>`
                            : ''
                        }

            <p>
                ${escaparHTML(compra.cidade_entrega)}
                - ${escaparHTML(compra.estado_entrega)}
            </p>

            <p>CEP: ${escaparHTML(compra.cep_entrega)}</p>

            <h4>Pagamento</h4>
            ${htmlPagamentos}
        `;

                } catch (error) {

                    console.error('Erro ao carregar detalhes:', error);

                    areaDetalhes.textContent =
                        'Não foi possível carregar os detalhes deste pedido.';

                }

            });

            pedidosContainer.appendChild(cartao);

        });

        // Iniciar os contadores dos pedidos pendentes
        iniciarContadores();

    } catch (error) {

        console.error('Erro ao carregar meus pedidos:', error);

        mensagemPedidos.textContent =
            'Não foi possível carregar seus pedidos. Tente novamente.';

    }

}

// ATUALIZAR OS CONTADORES
function iniciarContadores() {

    const contadores = document.querySelectorAll('.contador-pedido');

    contadores.forEach(contador => {

        const dataLimite = contador.dataset.prazo;

        function atualizarContador() {

            contador.textContent =
                calcularTempoRestante(dataLimite);

        }

        atualizarContador();

        const temporizador = setInterval(
            atualizarContador,
            1000
        );

        temporizadores.push(temporizador);

    });

}


 // BOTÃO VOLTAR
const botaoVoltar = document.getElementById('botao-voltar');

if (botaoVoltar) {
    botaoVoltar.addEventListener('click', () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Caso a página tenha sido aberta diretamente
            window.location.href = '../inicio/index.html';
        }
    });
}


// INICIAR A PÁGINA
carregarMeusPedidos();