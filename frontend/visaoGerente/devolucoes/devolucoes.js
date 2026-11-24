// ELEMENTOS DA PÁGINA
const listaPedidos = document.getElementById('lista-pedidos');
const secaoDevolucao = document.getElementById('secao-devolucao');
const informacoesPedido = document.getElementById('informacoes-pedido');
const listaProdutos = document.getElementById('lista-produtos');

// PEDIDO ATUALMENTE SELECIONADO
let pedidoSelecionadoId = null;

// CARREGAR PEDIDOS DISPONÍVEIS
async function carregarPedidos() {
    try {

        const resposta = await fetch(
            'http://127.0.0.1:3001/api/devolucoes/pedidos-disponiveis',
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar os pedidos.'
            );
        }

        listaPedidos.innerHTML = '';

        if (dados.pedidos.length === 0) {
            listaPedidos.innerHTML = `
                <p class="mensagem-vazia">
                    Não existem pedidos disponíveis para devolução.
                </p>
            `;
            return;
        }

        dados.pedidos.forEach(pedido => {
            const cartao = document.createElement('div');

            cartao.classList.add('cartao-pedido');

            cartao.innerHTML = `
                <h4>Pedido #${pedido.id_pedido}</h4>

                <p>
                    <strong>Cliente:</strong>
                    ${pedido.nome_pessoa}
                </p>

                <p>
                    <strong>Data:</strong>
                    ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}
                </p>

                <p>
                    <strong>Produtos:</strong>
                    ${pedido.quantidade_itens}
                </p>

                <button
                    class="botao-selecionar"
                    data-id="${pedido.id_pedido}"
                >
                    Selecionar pedido
                </button>
            `;

            listaPedidos.appendChild(cartao);
        });

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);

        listaPedidos.innerHTML = `
            <p class="mensagem-erro">
                Não foi possível carregar os pedidos.
            </p>
        `;
    }
}

// CARREGAR PRODUTOS DO PEDIDO SELECIONADO
async function carregarItensPedido(pedidoId) {
    try {
        pedidoSelecionadoId = pedidoId;
        
        const resposta = await fetch(
            `http://127.0.0.1:3001/api/devolucoes/pedido/${pedidoId}`,
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Não foi possível carregar os produtos.'
            );
        }

        informacoesPedido.innerHTML = `
            <p>
                <strong>Pedido selecionado:</strong>
                #${pedidoId}
            </p>
        `;

        listaProdutos.innerHTML = '';

        dados.itens.forEach(item => {
            const cartao = document.createElement('div');

            cartao.classList.add('cartao-produto-devolucao');

            const quantidadeComprada = Number(item.quantidade_comprada);
            const quantidadeReservada = Number(item.quantidade_reservada);
            const quantidadeDisponivel = Number(item.quantidade_disponivel);

            cartao.innerHTML = `
                <h4>${item.nome_produto}</h4>

                <p>
                    <strong>Quantidade comprada:</strong>
                    ${quantidadeComprada}
                </p>

                <p>
                    <strong>Já devolvida:</strong>
                    ${quantidadeReservada}
                </p>

                <p>
                    <strong>Disponível para devolução:</strong>
                    ${quantidadeDisponivel}
                </p>

                <div class="campo-produto">
                    <label>Quantidade recebida</label>

                    <input
                        type="number"
                        class="quantidade-devolvida"
                        data-produto="${item.produto_id}"
                        min="0"
                        max="${quantidadeDisponivel}"
                        value="0"
                        ${quantidadeDisponivel === 0 ? 'disabled' : ''}
                    >
                </div>

                <div class="campo-produto">
                    <label>Condição do produto</label>

                    <select
                        class="condicao-produto"
                        data-produto="${item.produto_id}"
                        ${quantidadeDisponivel === 0 ? 'disabled' : ''}
                    >
                        <option value="Em perfeito estado">
                            Em perfeito estado
                        </option>

                        <option value="Com defeito">
                            Com defeito
                        </option>
                    </select>
                </div>
            `;

            listaProdutos.appendChild(cartao);
        });

        secaoDevolucao.hidden = false;

        secaoDevolucao.scrollIntoView({
            behavior: 'smooth'
        });

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);

        alert(error.message);
    }
}

// SELECIONAR UM PEDIDO
listaPedidos.addEventListener('click', function (event) {
    const botao = event.target.closest('.botao-selecionar');

    if (!botao) {
        return;
    }

    const pedidoId = botao.dataset.id;

    carregarItensPedido(pedidoId);
});
// REGISTRAR DEVOLUÇÃO
async function registrarDevolucao() {
    const motivo = document.getElementById('motivo-devolucao').value.trim();
    const botaoRegistrar = document.getElementById('registrar-devolucao');

    if (!pedidoSelecionadoId) {
        alert('Selecione um pedido primeiro.');
        return;
    }

    if (!motivo) {
        alert('Informe o motivo da devolução.');
        return;
    }

    const camposQuantidade = document.querySelectorAll(
        '.quantidade-devolvida'
    );

    const itens = [];

    for (const campo of camposQuantidade) {
        const quantidade = Number(campo.value);
        const quantidadeMaxima = Number(campo.max);
        const produtoId = Number(campo.dataset.produto);

        if (!Number.isInteger(quantidade) || quantidade < 0 ||
            quantidade > quantidadeMaxima) {
            alert('Confira as quantidades informadas.');
            return;
        }

        if (quantidade === 0) {
            continue;
        }

        const campoCondicao = document.querySelector(
            `.condicao-produto[data-produto="${produtoId}"]`
        );

        itens.push({
            produto_id: produtoId,
            quantidade_devolvida: quantidade,
            condicao_produto: campoCondicao.value
        });
    }

    if (itens.length === 0) {
        alert('Informe a quantidade de pelo menos um produto.');
        return;
    }

    try {
        botaoRegistrar.disabled = true;
        botaoRegistrar.textContent = 'Registrando...';

        const resposta = await fetch(
            'http://127.0.0.1:3001/api/devolucoes',
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pedido_id: Number(pedidoSelecionadoId),
                    motivo_devolucao: motivo,
                    itens: itens
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || 'Não foi possível registrar a devolução.'
            );
        }

        alert('Devolução registrada com sucesso!');

        secaoDevolucao.hidden = true;
        document.getElementById('motivo-devolucao').value = '';

        pedidoSelecionadoId = null;

        await carregarPedidos();

    } catch (error) {
        console.error('Erro ao registrar devolução:', error);
        alert(error.message);

    } finally {
        botaoRegistrar.disabled = false;
        botaoRegistrar.textContent = 'Registrar devolução';
    }
}

// EVENTO DO BOTÃO DE REGISTRO
document.getElementById('registrar-devolucao').addEventListener(
    'click',
    registrarDevolucao
);

// CARREGAR OS PEDIDOS AO ABRIR A PÁGINA
carregarPedidos();