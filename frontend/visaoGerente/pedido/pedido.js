
// ENDEREÇO DO BACKEND
const URL_API = 'http://127.0.0.1:3001';

// ELEMENTOS DA PÁGINA
const totalPedidos = document.getElementById('total-pedidos');
const pedidosAndamento = document.getElementById('pedidos-andamento');
const pedidosEntregues = document.getElementById('pedidos-entregues');

const pesquisaPedido = document.getElementById('pesquisa-pedido');
const filtroStatus = document.getElementById('filtro-status');

const listaPedidos = document.getElementById('lista-pedidos');
const mensagemPedidos = document.getElementById('mensagem-pedidos');

// ARMAZENAR OS PEDIDOS
let pedidos = [];

// CARREGAR PEDIDOS DO BANCO
async function carregarPedidos() {

    try {

        mensagemPedidos.textContent = 'Carregando pedidos...';

        const resposta = await fetch(
            `${URL_API}/api/pedidos/gerenciar/listar`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível carregar os pedidos.');
        }

        pedidos = dados.pedidos;

        atualizarResumo();
        exibirPedidos(pedidos);

    } catch (erro) {

        console.error('Erro ao carregar pedidos:', erro);

        mensagemPedidos.textContent = erro.message;

    }

}

// ATUALIZAR OS CARTÕES DE RESUMO
function atualizarResumo() {

    totalPedidos.textContent = pedidos.length;

    pedidosAndamento.textContent = pedidos.filter(pedido =>
        ['Pagamento aprovado', 'Em preparação', 'Enviado']
            .includes(pedido.status_pedido)
    ).length;

    pedidosEntregues.textContent = pedidos.filter(pedido =>
        pedido.status_pedido === 'Entregue'
    ).length;

}

// EXIBIR OS PEDIDOS
function exibirPedidos(lista) {

    listaPedidos.innerHTML = '';

    mensagemPedidos.textContent = '';

    if (lista.length === 0) {

        mensagemPedidos.textContent = 'Nenhum pedido encontrado.';

        return;

    }

    lista.forEach(pedido => {

        const elemento = document.createElement('article');

        const data = new Date(pedido.data_pedido)
            .toLocaleDateString('pt-BR');

        const valor = Number(pedido.valor_total)
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

        elemento.innerHTML = `
            <h3>Pedido #${pedido.id_pedido}</h3>

            <p>Cliente: ${pedido.nome_cliente}</p>

            <p>Data: ${data}</p>

            <p>Valor: ${valor}</p>

            <p>Status: ${pedido.status_pedido}</p>

            <button
                type="button"
                class="botao-detalhes"
                data-id="${pedido.id_pedido}">
                Ver detalhes
            </button>
        `;

        listaPedidos.appendChild(elemento);

        elemento.querySelector('.botao-detalhes')
            .addEventListener('click', () => {
                visualizarDetalhesPedido(pedido.id_pedido);
            });

    });

}

// BUSCAR E EXIBIR DETALHES DO PEDIDO
async function visualizarDetalhesPedido(idPedido) {

    const areaDetalhes = document.getElementById('detalhes-pedido');
    const conteudoDetalhes = document.getElementById('conteudo-detalhes-pedido');

    try {

        areaDetalhes.hidden = false;
        conteudoDetalhes.textContent = 'Carregando detalhes...';

        const resposta = await fetch(
            `${URL_API}/api/pedidos/gerenciar/${idPedido}`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível carregar os detalhes.');
        }

        const pedido = dados.pedido;

        const data = new Date(pedido.data_pedido)
            .toLocaleDateString('pt-BR');

        const valorTotal = Number(pedido.valor_total)
            .toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

        const itensHTML = dados.itens.map(item => {

            const preco = Number(item.preco_unitario_item_pedido);

            return `
                <div>
                    <p><strong>${item.nome_produto}</strong></p>
                    <p>Quantidade: ${item.quantidade_item_pedido}</p>
                    <p>Preço unitário: ${preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })}</p>
                </div>
            `;

        }).join('');

        const pagamentosHTML = dados.pagamentos.map(pagamento => {

            const valor = Number(pagamento.valor_pagamento)
                .toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

            return `
                <p>
                    ${pagamento.nome_forma_pagamento}:
                    ${valor} (${pagamento.status_pagamento})
                </p>
            `;

        }).join('');

        // VERIFICAR SE O PEDIDO PODE SER CANCELADO
        const podeCancelar = [
            'Pagamento aprovado',
            'Em preparação'
        ].includes(pedido.status_pedido);

        conteudoDetalhes.innerHTML = `
            <h3>Pedido #${pedido.id_pedido}</h3>

            <p>Cliente: ${pedido.nome_cliente}</p>
            <p>Data: ${data}</p>
            <p>Status atual: <strong>${pedido.status_pedido}</strong></p>

                <div id="atualizacao-status-pedido">
                    <button
                        type="button"
                        id="avancar-status-pedido"
                        data-id="${pedido.id_pedido}"
                    >
                        Avançar status
                    </button>

                    <p id="mensagem-atualizacao-status"></p>

                    ${podeCancelar ? `
                        <button
                            type="button"
                            id="cancelar-pedido"
                            data-id="${pedido.id_pedido}"
                        >
                            Cancelar pedido
                        </button>
                    ` : ''}
                </div>

            <h3>Produtos</h3>
            ${itensHTML}

            <h3>Entrega</h3>
            <p>Destinatário: ${pedido.nome_entrega}</p>
            <p>Endereço: ${pedido.endereco_entrega}, ${pedido.numero_entrega}</p>
            <p>Complemento: ${pedido.complemento_entrega || 'Não informado'}</p>
            <p>CEP: ${pedido.cep_entrega}</p>
            <p>Cidade: ${pedido.cidade_entrega} - ${pedido.estado_entrega}</p>

            <h3>Pagamentos</h3>
            ${pagamentosHTML}

            <h3>Total: ${valorTotal}</h3>
        `;

        // CONTROLE DE ATUALIZAÇÃO DO STATUS
        const botaoAvancar = document.getElementById('avancar-status-pedido');
        const mensagemAtualizacao = document.getElementById('mensagem-atualizacao-status');

        // DEFINIR A PRÓXIMA ETAPA
        const proximosStatus = {
            'Pagamento aprovado': 'Em preparação',
            'Em preparação': 'Enviado',
            'Enviado': 'Entregue'
        };

        const proximoStatus = proximosStatus[pedido.status_pedido];

        // VERIFICAR SE EXISTE UMA PRÓXIMA ETAPA
        if (!proximoStatus) {
            botaoAvancar.disabled = true;

            if (pedido.status_pedido === 'Entregue') {
                botaoAvancar.textContent = 'Pedido entregue';
            } else {
                botaoAvancar.textContent = 'Sem atualização disponível';
            }
        }

        // ATUALIZAR STATUS AO CLICAR
        botaoAvancar.addEventListener('click', async () => {

            try {

                botaoAvancar.disabled = true;
                mensagemAtualizacao.textContent = 'Atualizando status...';

                const respostaAtualizacao = await fetch(
                    `${URL_API}/api/pedidos/gerenciar/${idPedido}/status`,
                    {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: proximoStatus
                        })
                    }
                );

                const resultadoAtualizacao = await respostaAtualizacao.json();

                if (!respostaAtualizacao.ok) {
                    throw new Error(
                        resultadoAtualizacao.mensagem ||
                        'Não foi possível atualizar o status.'
                    );
                }

                // ATUALIZAR A LISTA E OS DETALHES
                await carregarPedidos();
                await visualizarDetalhesPedido(idPedido);

            } catch (erro) {

                console.error('Erro ao atualizar status:', erro);

                mensagemAtualizacao.textContent = erro.message;
                botaoAvancar.disabled = false;

            }

        });

        // CONTROLE DE CANCELAMENTO DO PEDIDO
        const botaoCancelar = document.getElementById('cancelar-pedido');

        if (botaoCancelar) {

            botaoCancelar.addEventListener('click', async () => {

                const confirmar = window.confirm(
                    `Tem certeza de que deseja cancelar o pedido #${idPedido}? O estoque será atualizado.`
                );

                if (!confirmar) {
                    return;
                }

                try {

                    botaoCancelar.disabled = true;
                    mensagemAtualizacao.textContent = 'Cancelando pedido...';

                    const respostaCancelamento = await fetch(
                        `${URL_API}/api/pedidos/gerenciar/${idPedido}/cancelar`,
                        {
                            method: 'PATCH',
                            credentials: 'include'
                        }
                    );

                    const resultadoCancelamento = await respostaCancelamento.json();

                    if (!respostaCancelamento.ok) {
                        throw new Error(
                            resultadoCancelamento.mensagem ||
                            'Não foi possível cancelar o pedido.'
                        );
                    }

                    // ATUALIZAR A LISTA E OS DETALHES
                    await carregarPedidos();
                    await visualizarDetalhesPedido(idPedido);

                } catch (erro) {

                    console.error('Erro ao cancelar pedido:', erro);

                    mensagemAtualizacao.textContent = erro.message;
                    botaoCancelar.disabled = false;

                }

            });

        }

        areaDetalhes.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    } catch (erro) {

        console.error('Erro ao visualizar pedido:', erro);

        conteudoDetalhes.textContent = erro.message;

    }

}

// FILTRAR PEDIDOS
function filtrarPedidos() {

    const pesquisa = pesquisaPedido.value.toLowerCase().trim();

    const statusSelecionado = filtroStatus.value;

    const pedidosFiltrados = pedidos.filter(pedido => {

        const correspondePesquisa =
            String(pedido.id_pedido).includes(pesquisa) ||
            pedido.nome_cliente.toLowerCase().includes(pesquisa);

        const correspondeStatus =
            !statusSelecionado ||
            pedido.status_pedido === statusSelecionado;

        return correspondePesquisa && correspondeStatus;

    });

    exibirPedidos(pedidosFiltrados);

}

// EVENTOS DOS FILTROS
pesquisaPedido.addEventListener('input', filtrarPedidos);

filtroStatus.addEventListener('change', filtrarPedidos);

// FECHAR PAINEL DE DETALHES DO PEDIDO
const botaoFecharDetalhes = document.getElementById('fechar-detalhes');

if (botaoFecharDetalhes) {
    botaoFecharDetalhes.addEventListener('click', () => {
        const areaDetalhes = document.getElementById('detalhes-pedido');
        const conteudoDetalhes = document.getElementById('conteudo-detalhes-pedido');

        areaDetalhes.hidden = true;
        conteudoDetalhes.innerHTML = '';
    });
}

// INICIAR A PÁGINA
carregarPedidos();
