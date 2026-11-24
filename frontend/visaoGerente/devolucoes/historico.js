// ELEMENTO QUE RECEBERÁ O HISTÓRICO
const listaDevolucoes = document.getElementById('lista-devolucoes');

// CARREGAR HISTÓRICO DE DEVOLUÇÕES
async function carregarHistorico() {
    try {
        const resposta = await fetch(
            'http://127.0.0.1:3001/api/devolucoes/historico',
            {
                credentials: 'include'
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(dados.mensagem || 'Não foi possível carregar o histórico.');
        }

        listaDevolucoes.replaceChildren();

        if (dados.devolucoes.length === 0) {
            const mensagem = document.createElement('p');
            mensagem.textContent = 'Nenhuma devolução foi registrada até o momento.';
            listaDevolucoes.appendChild(mensagem);
            return;
        }

        dados.devolucoes.forEach(devolucao => {
            // CARTÃO DA DEVOLUÇÃO
            const cartao = document.createElement('article');
            cartao.classList.add('cartao-devolucao');

            // DATA FORMATADA
            const data = new Date(devolucao.data_devolucao);
            const dataFormatada = data.toLocaleDateString('pt-BR');

            // INFORMAÇÕES
            const titulo = document.createElement('h3');
            titulo.textContent = `Devolução #${devolucao.id_devolucao}`;

            const pedido = document.createElement('p');
            pedido.textContent = `Pedido: #${devolucao.pedido_id}`;

            const cliente = document.createElement('p');
            cliente.textContent = `Cliente: ${devolucao.nome_pessoa}`;

            const produto = document.createElement('p');
            produto.textContent = `Produto: ${devolucao.nome_produto}`;

            const quantidade = document.createElement('p');
            quantidade.textContent = `Quantidade devolvida: ${devolucao.quantidade_devolvida}`;

            const condicao = document.createElement('p');
            condicao.textContent = `Condição do produto: ${devolucao.condicao_produto}`;

            const motivo = document.createElement('p');
            motivo.textContent = `Motivo: ${devolucao.motivo_devolucao}`;

            const status = document.createElement('p');
            status.textContent = `Status: ${devolucao.status_devolucao}`;

            const dataRegistro = document.createElement('p');
            dataRegistro.textContent = `Data: ${dataFormatada}`;

            // MONTAR CARTÃO
            cartao.append(
                titulo,
                pedido,
                cliente,
                produto,
                quantidade,
                condicao,
                motivo,
                status,
                dataRegistro
            );

            listaDevolucoes.appendChild(cartao);
        });

    } catch (erro) {
        console.error('Erro ao carregar histórico:', erro);

        listaDevolucoes.replaceChildren();

        const mensagem = document.createElement('p');
        mensagem.textContent = 'Não foi possível carregar o histórico de devoluções.';

        listaDevolucoes.appendChild(mensagem);
    }
}

// EXECUTAR AO ABRIR A PÁGINA
carregarHistorico();